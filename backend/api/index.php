<?php
declare(strict_types=1);

require __DIR__ . '/lib/helpers.php';
require __DIR__ . '/lib/strava.php';
require __DIR__ . '/lib/routes.php';

$configFile = dirname(__DIR__) . '/config.local.php';
if (!is_file($configFile)) {
    jsonResponse(['error' => 'Server configuration is missing. Create config.local.php in the application root.'], 500);
}
try {
    $config = require $configFile;
    if (!is_array($config)) {
        throw new RuntimeException('Configuration must return an array.');
    }
} catch (Throwable $e) {
    error_log('Running League configuration error: ' . $e->getMessage());
    jsonResponse(['error' => 'Server configuration is invalid. Check config.local.php PHP syntax and return value.'], 500);
}

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
    jsonResponse(['error' => 'Database connection failed. Check config.local.php credentials.'], 500);
}

try {
    handleRequest($pdo, $config, $_SERVER['REQUEST_METHOD'] ?? 'GET', rtrim(apiPath(), '/') ?: '/');
} catch (Throwable $e) {
    error_log('Running League API error: ' . $e->getMessage());
    jsonResponse(['error' => 'Internal server error'], 500);
}
