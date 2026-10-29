<?php
declare(strict_types=1);

const T_RUNNERS = 'running_volume_competition_runners';
const T_ACTIVITIES = 'running_volume_competition_activities';
const T_TOKENS = 'running_volume_competition_runner_tokens';
const T_SETTINGS = 'running_volume_competition_settings';

function jsonResponse($data, int $status = 200): void {
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
    if (isAdmin($config)) return;
    usleep(300000); // slow down brute-force attempts
    jsonResponse(['error' => 'Unauthorized'], 401);
}

function apiPath(): string {
    $route = $_GET['_route'] ?? null;
    if (is_string($route) && $route !== '') {
        return '/' . trim($route, '/');
    }

    $path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $position = strpos($path, '/api');
    return $position === false ? '/' : (substr($path, $position + 4) ?: '/');
}

function uuid(): string {
    $bytes = random_bytes(16);
    $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40);
    $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($bytes), 4));
}

function base64UrlEncode(string $raw): string {
    return rtrim(strtr(base64_encode($raw), '+/', '-_'), '=');
}

function base64UrlDecode(string $encoded): string {
    return (string) base64_decode(strtr($encoded, '-_', '+/'));
}

/** Per-runner secret for the private Strava connect link; the public runner id alone cannot link an account. */
function connectToken(array $config, string $runnerId): string {
    return hash_hmac('sha256', 'connect|' . $runnerId, (string) $config['admin_secret']);
}

function findRunnerByConnectToken(PDO $pdo, array $config, string $token): ?array {
    if ($token === '') return null;
    foreach ($pdo->query('SELECT id, name, avatar FROM ' . T_RUNNERS)->fetchAll() as $runner) {
        if (hash_equals(connectToken($config, $runner['id']), $token)) return $runner;
    }
    return null;
}

/** Stateless OAuth state (no PHP session needed): signed runner id + expiry. */
function signState(array $config, string $runnerId): string {
    $payload = $runnerId . '|' . (time() + 600);
    return base64UrlEncode($payload) . '.' . hash_hmac('sha256', 'state|' . $payload, (string) $config['admin_secret']);
}

function verifyState(array $config, string $state): ?string {
    $parts = explode('.', $state, 2);
    if (count($parts) !== 2) return null;
    $payload = base64UrlDecode($parts[0]);
    if (!hash_equals(hash_hmac('sha256', 'state|' . $payload, (string) $config['admin_secret']), $parts[1])) return null;
    [$runnerId, $expires] = array_pad(explode('|', $payload, 2), 2, '0');
    return (int) $expires >= time() ? $runnerId : null;
}

function season(PDO $pdo): array {
    $row = $pdo->query('SELECT season_start, season_end FROM ' . T_SETTINGS . ' WHERE id = 1')->fetch();
    if (!$row) throw new RuntimeException('Season settings are missing.');
    return $row;
}

function validDate($value): bool {
    return is_string($value) && preg_match('/^\d{4}-\d{2}-\d{2}$/', $value) === 1 && strtotime($value) !== false;
}

/** @return array{0:string,1:string,2:string} name, avatar, team */
function runnerInput(array $body): array {
    $name = trim((string) ($body['name'] ?? ''));
    $avatar = trim((string) ($body['avatar'] ?? ''));
    $team = $body['team'] ?? '';
    if ($name === '' || $avatar === '' || !in_array($team, ['A', 'B'], true) || mb_strlen($name) > 120 || mb_strlen($avatar) > 32) {
        jsonResponse(['error' => 'Invalid runner data'], 400);
    }
    return [$name, $avatar, $team];
}
