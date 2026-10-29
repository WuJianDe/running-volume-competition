<?php
declare(strict_types=1);

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
        $detail = $error ?: substr((string) $response, 0, 500);
        throw new RuntimeException("Strava request failed ({$status}): {$detail}");
    }
    $decoded = json_decode($response, true);
    if (!is_array($decoded)) throw new RuntimeException('Invalid Strava response.');
    return $decoded;
}

function validAccessToken(PDO $pdo, array $token, array $config): string {
    if ((int) $token['expires_at'] > time() + 60) return $token['access_token'];
    $refreshed = stravaRequest('https://www.strava.com/oauth/token', null, [
        'client_id' => $config['strava_client_id'],
        'client_secret' => $config['strava_client_secret'],
        'refresh_token' => $token['refresh_token'],
        'grant_type' => 'refresh_token',
    ]);
    $pdo->prepare('UPDATE ' . T_TOKENS . ' SET access_token = ?, refresh_token = ?, expires_at = ? WHERE runner_id = ?')
        ->execute([$refreshed['access_token'], $refreshed['refresh_token'], $refreshed['expires_at'], $token['runner_id']]);
    return $refreshed['access_token'];
}

function fetchSeasonRuns(string $accessToken, array $season): array {
    $after = strtotime($season['season_start'] . ' 00:00:00 UTC');
    $before = strtotime($season['season_end'] . ' 23:59:59 UTC');
    $runs = [];
    for ($page = 1; ; $page++) {
        $batch = stravaRequest("https://www.strava.com/api/v3/athlete/activities?after={$after}&before={$before}&per_page=200&page={$page}", $accessToken);
        foreach ($batch as $activity) {
            if (($activity['sport_type'] ?? $activity['type'] ?? '') === 'Run') $runs[] = $activity;
        }
        if (count($batch) < 200) break;
    }
    return $runs;
}

function syncRunner(PDO $pdo, array $token, array $config, array $season): void {
    $runs = fetchSeasonRuns(validAccessToken($pdo, $token, $config), $season);
    $distance = (int) round(array_sum(array_map(fn($a) => $a['distance'] ?? 0, $runs)));
    $elevation = (int) round(array_sum(array_map(fn($a) => $a['total_elevation_gain'] ?? 0, $runs)));

    $pdo->beginTransaction();
    try {
        $pdo->prepare('UPDATE ' . T_RUNNERS . ' SET distance = ?, elevation = ?, activities = ?, synced_at = UTC_TIMESTAMP() WHERE id = ?')
            ->execute([$distance, $elevation, count($runs), $token['runner_id']]);
        $pdo->prepare('DELETE FROM ' . T_ACTIVITIES . ' WHERE runner_id = ?')->execute([$token['runner_id']]);
        $insert = $pdo->prepare('INSERT INTO ' . T_ACTIVITIES . ' (id, runner_id, name, distance, elevation, start_date) VALUES (?, ?, ?, ?, ?, ?)');
        foreach ($runs as $run) {
            $insert->execute([
                (int) $run['id'],
                $token['runner_id'],
                (string) ($run['name'] ?? ''),
                (int) round($run['distance'] ?? 0),
                (int) round($run['total_elevation_gain'] ?? 0),
                gmdate('Y-m-d H:i:s', strtotime($run['start_date'])),
            ]);
        }
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
}
