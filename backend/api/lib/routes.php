<?php
declare(strict_types=1);

const RUNNER_COLUMNS = 'id, name, avatar, distance, elevation, activities, team, synced_at';

function appUrl(array $config): string {
    return rtrim((string) $config['app_url'], '/');
}

function handleRequest(PDO $pdo, array $config, string $method, string $path): void {
    $match = [];

    // ── Public ───────────────────────────────────────────────
    if ($method === 'GET' && $path === '/overview') {
        jsonResponse([
            'season' => season($pdo),
            'runners' => $pdo->query('SELECT ' . RUNNER_COLUMNS . ' FROM ' . T_RUNNERS . ' ORDER BY created_at')->fetchAll(),
        ]);
    }
    if ($method === 'GET' && $path === '/runners') {
        jsonResponse($pdo->query('SELECT ' . RUNNER_COLUMNS . ' FROM ' . T_RUNNERS . ' ORDER BY created_at')->fetchAll());
    }
    if ($method === 'GET' && preg_match('#^/runners/([\w-]+)$#', $path, $match)) {
        $stmt = $pdo->prepare('SELECT ' . RUNNER_COLUMNS . ' FROM ' . T_RUNNERS . ' WHERE id = ?');
        $stmt->execute([$match[1]]);
        $runner = $stmt->fetch();
        $runner ? jsonResponse($runner) : jsonResponse(['error' => 'Runner not found'], 404);
    }
    if ($method === 'GET' && preg_match('#^/runners/([\w-]+)/activities$#', $path, $match)) {
        $stmt = $pdo->prepare('SELECT id, name, distance, elevation, start_date FROM ' . T_ACTIVITIES . ' WHERE runner_id = ? ORDER BY start_date DESC');
        $stmt->execute([$match[1]]);
        jsonResponse($stmt->fetchAll());
    }
    if ($method === 'GET' && $path === '/activities') {
        jsonResponse($pdo->query(
            'SELECT a.id, a.name, a.distance, a.elevation, a.start_date, r.id AS runner_id, r.name AS runner_name, r.avatar AS runner_avatar, r.team AS runner_team '
            . 'FROM ' . T_ACTIVITIES . ' a JOIN ' . T_RUNNERS . ' r ON r.id = a.runner_id ORDER BY a.start_date DESC LIMIT 5'
        )->fetchAll());
    }
    if ($method === 'GET' && $path === '/season') jsonResponse(season($pdo));

    // ── Strava connect (private per-runner link) ─────────────
    if ($method === 'GET' && preg_match('#^/connect/([a-f0-9]{64})$#', $path, $match)) {
        $runner = findRunnerByConnectToken($pdo, $config, $match[1]);
        $runner ? jsonResponse(['name' => $runner['name'], 'avatar' => $runner['avatar']]) : jsonResponse(['error' => 'Invalid connect link'], 404);
    }
    if ($method === 'GET' && $path === '/strava/auth') {
        $runner = findRunnerByConnectToken($pdo, $config, (string) ($_GET['token'] ?? ''));
        if (!$runner) jsonResponse(['error' => 'Invalid connect link'], 404);
        $params = http_build_query([
            'client_id' => $config['strava_client_id'],
            'redirect_uri' => appUrl($config) . '/api.php?_route=/strava/callback',
            'response_type' => 'code',
            'scope' => 'activity:read_all',
            'approval_prompt' => 'auto',
            'state' => signState($config, $runner['id']),
        ]);
        header('Location: https://www.strava.com/oauth/authorize?' . $params, true, 302);
        exit;
    }
    if ($method === 'GET' && $path === '/strava/callback') {
        $runnerId = verifyState($config, (string) ($_GET['state'] ?? ''));
        if ($runnerId === null) {
            http_response_code(400);
            exit('Invalid or expired OAuth state.');
        }
        if (isset($_GET['error'])) {
            header('Location: ' . appUrl($config) . '/?connect=' . connectToken($config, $runnerId) . '&error=denied', true, 302);
            exit;
        }
        $code = $_GET['code'] ?? '';
        if (!$code) {
            http_response_code(400);
            exit('Missing authorization code.');
        }
        $token = stravaRequest('https://www.strava.com/oauth/token', null, [
            'client_id' => $config['strava_client_id'],
            'client_secret' => $config['strava_client_secret'],
            'code' => $code,
            'grant_type' => 'authorization_code',
        ]);
        $pdo->prepare(
            'INSERT INTO ' . T_TOKENS . ' (runner_id, athlete_id, access_token, refresh_token, expires_at) VALUES (?, ?, ?, ?, ?) '
            . 'ON DUPLICATE KEY UPDATE athlete_id = VALUES(athlete_id), access_token = VALUES(access_token), refresh_token = VALUES(refresh_token), expires_at = VALUES(expires_at)'
        )->execute([$runnerId, $token['athlete']['id'], $token['access_token'], $token['refresh_token'], $token['expires_at']]);
        header('Location: ' . appUrl($config) . '/?connected=true', true, 302);
        exit;
    }

    // ── Admin ────────────────────────────────────────────────
    if (strpos($path, '/admin/') === 0) {
        requireAdmin($config);
        handleAdmin($pdo, $config, $method, $path);
    }

    jsonResponse(['error' => 'Not found'], 404);
}

function handleAdmin(PDO $pdo, array $config, string $method, string $path): void {
    $match = [];

    if ($method === 'POST' && $path === '/admin/login') jsonResponse(['success' => true]);

    if ($method === 'GET' && $path === '/admin/runners') {
        $runners = $pdo->query('SELECT ' . RUNNER_COLUMNS . ' FROM ' . T_RUNNERS . ' ORDER BY created_at')->fetchAll();
        $connected = array_flip($pdo->query('SELECT runner_id FROM ' . T_TOKENS)->fetchAll(PDO::FETCH_COLUMN));
        foreach ($runners as &$runner) {
            $runner['connect_token'] = connectToken($config, $runner['id']);
            $runner['strava_connected'] = isset($connected[$runner['id']]);
        }
        unset($runner);
        jsonResponse($runners);
    }
    if ($method === 'POST' && $path === '/admin/runners') {
        [$name, $avatar, $team] = runnerInput(requestBody());
        $id = uuid();
        $pdo->prepare('INSERT INTO ' . T_RUNNERS . ' (id, name, avatar, team) VALUES (?, ?, ?, ?)')->execute([$id, $name, $avatar, $team]);
        jsonResponse(['id' => $id], 201);
    }
    if ($method === 'PATCH' && preg_match('#^/admin/runners/([\w-]+)$#', $path, $match)) {
        [$name, $avatar, $team] = runnerInput(requestBody());
        $pdo->prepare('UPDATE ' . T_RUNNERS . ' SET name = ?, avatar = ?, team = ? WHERE id = ?')->execute([$name, $avatar, $team, $match[1]]);
        jsonResponse(['success' => true]);
    }
    if ($method === 'DELETE' && preg_match('#^/admin/runners/([\w-]+)$#', $path, $match)) {
        $pdo->prepare('DELETE FROM ' . T_RUNNERS . ' WHERE id = ?')->execute([$match[1]]);
        jsonResponse(['success' => true]);
    }
    if ($method === 'PUT' && $path === '/admin/season') {
        $body = requestBody();
        $start = $body['season_start'] ?? '';
        $end = $body['season_end'] ?? '';
        if (!validDate($start) || !validDate($end) || strtotime($start) > strtotime($end)) jsonResponse(['error' => 'Invalid season range'], 400);
        $pdo->prepare('UPDATE ' . T_SETTINGS . ' SET season_start = ?, season_end = ? WHERE id = 1')->execute([$start, $end]);
        jsonResponse(['success' => true]);
    }
    if ($method === 'POST' && $path === '/admin/sync') {
        $tokens = $pdo->query('SELECT * FROM ' . T_TOKENS)->fetchAll();
        if (!$tokens) jsonResponse(['synced' => 0, 'connected_runners' => 0, 'message' => 'No runners are connected to Strava.', 'results' => []]);

        $range = season($pdo);
        $results = [];
        foreach ($tokens as $token) {
            try {
                syncRunner($pdo, $token, $config, $range);
                $results[] = ['runner_id' => $token['runner_id'], 'success' => true];
            } catch (Throwable $e) {
                error_log('Strava sync failed: ' . $e->getMessage());
                $results[] = ['runner_id' => $token['runner_id'], 'success' => false, 'error' => $e->getMessage()];
            }
        }
        $synced = count(array_filter($results, fn($result) => $result['success']));
        jsonResponse(['synced' => $synced, 'connected_runners' => count($tokens), 'message' => $synced ? null : 'No runner could be synchronized.', 'results' => $results]);
    }
    jsonResponse(['error' => 'Not found'], 404);
}
