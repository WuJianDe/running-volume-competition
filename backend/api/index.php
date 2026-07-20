<?php
declare(strict_types=1);

session_name('running_league');
session_start([
    'cookie_httponly' => true,
    'cookie_samesite' => 'Lax',
    'cookie_secure' => (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off'),
]);

$configFile = dirname(__DIR__) . '/config.local.php';
if (!is_file($configFile)) {
    http_response_code(500);
    exit('Server configuration is missing.');
}
$config = require $configFile;

try {
    $db = $config['db'];
    $pdo = new PDO(
        "mysql:host={$db['host']};port={$db['port']};dbname={$db['name']};charset=utf8mb4",
        $db['user'],
        $db['password'],
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC],
    );
} catch (Throwable $e) {
    error_log('Running League database connection failed: ' . $e->getMessage());
    http_response_code(500);
    exit('Database connection failed.');
}

function jsonResponse(mixed $data, int $status = 200): never {
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function requestBody(): array {
    $body = json_decode(file_get_contents('php://input'), true);
    return is_array($body) ? $body : [];
}

function isAdmin(array $config): bool {
    $provided = $_SERVER['HTTP_X_ADMIN_SECRET'] ?? '';
    return is_string($provided) && $provided !== '' && hash_equals((string) $config['admin_secret'], $provided);
}

function requireAdmin(array $config): void {
    if (!isAdmin($config)) jsonResponse(['error' => 'Unauthorized'], 401);
}

function apiPath(): string {
    $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $marker = '/api';
    $position = strpos($path, $marker);
    return $position === false ? '/' : substr($path, $position + strlen($marker)) ?: '/';
}

function uuid(): string {
    $bytes = random_bytes(16);
    $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
    $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($bytes), 4));
}

function stravaRequest(string $url, ?string $accessToken = null, ?array $body = null): array {
    $curl = curl_init($url);
    $headers = ['Accept: application/json'];
    if ($accessToken) $headers[] = "Authorization: Bearer {$accessToken}";
    if ($body !== null) {
        $headers[] = 'Content-Type: application/json';
        curl_setopt($curl, CURLOPT_POST, true);
        curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($body));
    }
    curl_setopt_array($curl, [
        CURLOPT_HTTPHEADER => $headers,
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_TIMEOUT => 25,
    ]);
    $response = curl_exec($curl);
    $status = (int) curl_getinfo($curl, CURLINFO_RESPONSE_CODE);
    $error = curl_error($curl);
    curl_close($curl);
    if ($response === false || $status < 200 || $status >= 300) {
        throw new RuntimeException("Strava request failed ({$status}): {$error}");
    }
    $decoded = json_decode($response, true);
    if (!is_array($decoded)) throw new RuntimeException('Invalid Strava response.');
    return $decoded;
}

function season(PDO $pdo): array {
    $row = $pdo->query('SELECT season_start, season_end FROM settings WHERE id = 1')->fetch();
    if (!$row) throw new RuntimeException('Season settings are missing.');
    return $row;
}

function validAccessToken(PDO $pdo, array $token, array $config): string {
    if ((int) $token['expires_at'] > time() + 60) return $token['access_token'];
    $refreshed = stravaRequest('https://www.strava.com/oauth/token', null, [
        'client_id' => $config['strava_client_id'],
        'client_secret' => $config['strava_client_secret'],
        'refresh_token' => $token['refresh_token'],
        'grant_type' => 'refresh_token',
    ]);
    $stmt = $pdo->prepare('UPDATE runner_tokens SET access_token = ?, refresh_token = ?, expires_at = ? WHERE runner_id = ?');
    $stmt->execute([$refreshed['access_token'], $refreshed['refresh_token'], $refreshed['expires_at'], $token['runner_id']]);
    return $refreshed['access_token'];
}

function syncRunner(PDO $pdo, array $token, array $config, array $season): void {
    $accessToken = validAccessToken($pdo, $token, $config);
    $after = strtotime($season['season_start'] . ' 00:00:00 UTC');
    $before = strtotime($season['season_end'] . ' 23:59:59 UTC');
    $runs = [];
    for ($page = 1; ; $page++) {
        $batch = stravaRequest("https://www.strava.com/api/v3/athlete/activities?after={$after}&before={$before}&per_page=200&page={$page}", $accessToken);
        foreach ($batch as $activity) if (($activity['sport_type'] ?? $activity['type'] ?? '') === 'Run') $runs[] = $activity;
        if (count($batch) < 200) break;
    }
    $distance = (int) round(array_sum(array_map(fn($a) => $a['distance'] ?? 0, $runs)));
    $elevation = (int) round(array_sum(array_map(fn($a) => $a['total_elevation_gain'] ?? 0, $runs)));
    $pdo->beginTransaction();
    try {
        $pdo->prepare('UPDATE runners SET distance = ?, elevation = ?, activities = ?, synced_at = UTC_TIMESTAMP() WHERE id = ?')
            ->execute([$distance, $elevation, count($runs), $token['runner_id']]);
        $pdo->prepare('DELETE FROM activities WHERE runner_id = ?')->execute([$token['runner_id']]);
        if ($runs) {
            $activityStmt = $pdo->prepare('INSERT INTO activities (id, runner_id, name, distance, elevation, start_date) VALUES (?, ?, ?, ?, ?, ?)');
            foreach ($runs as $run) {
                $activityStmt->execute([(int) $run['id'], $token['runner_id'], (string) ($run['name'] ?? ''), (int) round($run['distance'] ?? 0), (int) round($run['total_elevation_gain'] ?? 0), gmdate('Y-m-d H:i:s', strtotime($run['start_date']))]);
            }
        }
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$path = rtrim(apiPath(), '/') ?: '/';

try {
    // Temporary compatibility routes keep the existing admin screen working during frontend rollout.
    if ($path === '/admin/season' && $method === 'GET') jsonResponse(season($pdo));
    if ($path === '/admin/season' && $method === 'POST') {
        requireAdmin($config); $body = requestBody(); $start = $body['season_start'] ?? ''; $end = $body['season_end'] ?? '';
        if (!$start || !$end || strtotime($start) > strtotime($end)) jsonResponse(['error' => 'Invalid season range'], 400);
        $pdo->prepare('UPDATE settings SET season_start = ?, season_end = ? WHERE id = 1')->execute([$start, $end]); jsonResponse(['success' => true]);
    }
    if ($path === '/admin/add-runner' && $method === 'POST') {
        requireAdmin($config); $body = requestBody(); $name = trim((string) ($body['name'] ?? '')); $avatar = trim((string) ($body['avatar'] ?? '')); $team = $body['team'] ?? '';
        if ($name === '' || $avatar === '' || !in_array($team, ['A', 'B'], true)) jsonResponse(['error' => 'Invalid runner data'], 400);
        $id = uuid(); $pdo->prepare('INSERT INTO runners (id, name, avatar, team) VALUES (?, ?, ?, ?)')->execute([$id, $name, $avatar, $team]); jsonResponse(['id' => $id], 201);
    }
    if ($path === '/admin/update-runner' && $method === 'POST') {
        requireAdmin($config); $body = requestBody(); $id = $body['id'] ?? ''; $name = trim((string) ($body['name'] ?? '')); $avatar = trim((string) ($body['avatar'] ?? '')); $team = $body['team'] ?? '';
        if (!$id || $name === '' || $avatar === '' || !in_array($team, ['A', 'B'], true)) jsonResponse(['error' => 'Invalid runner data'], 400);
        $pdo->prepare('UPDATE runners SET name = ?, avatar = ?, team = ? WHERE id = ?')->execute([$name, $avatar, $team, $id]); jsonResponse(['success' => true]);
    }
    if ($path === '/admin/delete-runner' && $method === 'POST') {
        requireAdmin($config); $id = requestBody()['id'] ?? ''; if (!$id) jsonResponse(['error' => 'Missing runner id'], 400);
        $pdo->prepare('DELETE FROM runners WHERE id = ?')->execute([$id]); jsonResponse(['success' => true]);
    }
    if ($method === 'GET' && $path === '/runners') {
        jsonResponse($pdo->query('SELECT id, name, avatar, distance, elevation, activities, team, synced_at FROM runners ORDER BY created_at')->fetchAll());
    }
    if ($method === 'GET' && preg_match('#^/runners/([\w-]+)$#', $path, $match)) {
        $stmt = $pdo->prepare('SELECT id, name, avatar, distance, elevation, activities, team, synced_at FROM runners WHERE id = ?');
        $stmt->execute([$match[1]]);
        $runner = $stmt->fetch();
        $runner ? jsonResponse($runner) : jsonResponse(['error' => 'Runner not found'], 404);
    }
    if ($method === 'GET' && preg_match('#^/runners/([\w-]+)/activities$#', $path, $match)) {
        $stmt = $pdo->prepare('SELECT id, name, distance, elevation, start_date FROM activities WHERE runner_id = ? ORDER BY start_date DESC');
        $stmt->execute([$match[1]]);
        jsonResponse($stmt->fetchAll());
    }
    if ($method === 'GET' && $path === '/activities') {
        $stmt = $pdo->query('SELECT a.id, a.name, a.distance, a.elevation, a.start_date, r.id AS runner_id, r.name AS runner_name, r.avatar AS runner_avatar, r.team AS runner_team FROM activities a JOIN runners r ON r.id = a.runner_id ORDER BY a.start_date DESC LIMIT 5');
        jsonResponse($stmt->fetchAll());
    }
    if ($method === 'GET' && $path === '/season') jsonResponse(season($pdo));

    if ($method === 'POST' && $path === '/admin/runners') {
        requireAdmin($config);
        $body = requestBody();
        $name = trim((string) ($body['name'] ?? ''));
        $avatar = trim((string) ($body['avatar'] ?? ''));
        $team = $body['team'] ?? '';
        if ($name === '' || $avatar === '' || !in_array($team, ['A', 'B'], true)) jsonResponse(['error' => 'Invalid runner data'], 400);
        $id = uuid();
        $pdo->prepare('INSERT INTO runners (id, name, avatar, team) VALUES (?, ?, ?, ?)')->execute([$id, $name, $avatar, $team]);
        jsonResponse(['id' => $id], 201);
    }
    if ($method === 'PATCH' && preg_match('#^/admin/runners/([\w-]+)$#', $path, $match)) {
        requireAdmin($config);
        $body = requestBody(); $name = trim((string) ($body['name'] ?? '')); $avatar = trim((string) ($body['avatar'] ?? '')); $team = $body['team'] ?? '';
        if ($name === '' || $avatar === '' || !in_array($team, ['A', 'B'], true)) jsonResponse(['error' => 'Invalid runner data'], 400);
        $pdo->prepare('UPDATE runners SET name = ?, avatar = ?, team = ? WHERE id = ?')->execute([$name, $avatar, $team, $match[1]]);
        jsonResponse(['success' => true]);
    }
    if ($method === 'DELETE' && preg_match('#^/admin/runners/([\w-]+)$#', $path, $match)) {
        requireAdmin($config); $pdo->prepare('DELETE FROM runners WHERE id = ?')->execute([$match[1]]); jsonResponse(['success' => true]);
    }
    if ($method === 'PUT' && $path === '/admin/season') {
        requireAdmin($config); $body = requestBody(); $start = $body['season_start'] ?? ''; $end = $body['season_end'] ?? '';
        if (!$start || !$end || strtotime($start) > strtotime($end)) jsonResponse(['error' => 'Invalid season range'], 400);
        $pdo->prepare('UPDATE settings SET season_start = ?, season_end = ? WHERE id = 1')->execute([$start, $end]); jsonResponse(['success' => true]);
    }
    if ($method === 'GET' && $path === '/strava/auth') {
        $runnerId = $_GET['runner_id'] ?? '';
        $stmt = $pdo->prepare('SELECT id FROM runners WHERE id = ?'); $stmt->execute([$runnerId]);
        if (!$stmt->fetch()) jsonResponse(['error' => 'Runner not found'], 404);
        $state = bin2hex(random_bytes(32)); $_SESSION['strava_state'] = ['value' => $state, 'runner_id' => $runnerId, 'expires' => time() + 600];
        $params = http_build_query(['client_id' => $config['strava_client_id'], 'redirect_uri' => rtrim($config['app_url'], '/') . '/api/strava/callback', 'response_type' => 'code', 'scope' => 'activity:read_all', 'approval_prompt' => 'auto', 'state' => $state]);
        header('Location: https://www.strava.com/oauth/authorize?' . $params, true, 302); exit;
    }
    if ($method === 'GET' && $path === '/strava/callback') {
        $state = (string) ($_GET['state'] ?? ''); $saved = $_SESSION['strava_state'] ?? null; unset($_SESSION['strava_state']);
        if (!is_array($saved) || time() > $saved['expires'] || !hash_equals($saved['value'], $state)) { http_response_code(400); exit('Invalid OAuth state.'); }
        if (isset($_GET['error'])) { header('Location: ' . rtrim($config['app_url'], '/') . '/?connect=' . urlencode($saved['runner_id']) . '&error=denied', true, 302); exit; }
        $code = $_GET['code'] ?? ''; if (!$code) { http_response_code(400); exit('Missing authorization code.'); }
        $token = stravaRequest('https://www.strava.com/oauth/token', null, ['client_id' => $config['strava_client_id'], 'client_secret' => $config['strava_client_secret'], 'code' => $code, 'grant_type' => 'authorization_code']);
        $pdo->prepare('INSERT INTO runner_tokens (runner_id, athlete_id, access_token, refresh_token, expires_at) VALUES (?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE athlete_id = VALUES(athlete_id), access_token = VALUES(access_token), refresh_token = VALUES(refresh_token), expires_at = VALUES(expires_at)')->execute([$saved['runner_id'], $token['athlete']['id'], $token['access_token'], $token['refresh_token'], $token['expires_at']]);
        header('Location: ' . rtrim($config['app_url'], '/') . '/?connected=true', true, 302); exit;
    }
    if ($method === 'POST' && $path === '/admin/sync') {
        requireAdmin($config); $tokens = $pdo->query('SELECT * FROM runner_tokens')->fetchAll(); $range = season($pdo); $results = [];
        foreach ($tokens as $token) { try { syncRunner($pdo, $token, $config, $range); $results[] = ['runner_id' => $token['runner_id'], 'success' => true]; } catch (Throwable $e) { error_log('Strava sync failed: ' . $e->getMessage()); $results[] = ['runner_id' => $token['runner_id'], 'success' => false]; } }
        jsonResponse(['synced' => count(array_filter($results, fn($result) => $result['success'])), 'results' => $results]);
    }
    jsonResponse(['error' => 'Not found'], 404);
} catch (Throwable $e) {
    error_log('Running League API error: ' . $e->getMessage());
    jsonResponse(['error' => 'Internal server error'], 500);
}
