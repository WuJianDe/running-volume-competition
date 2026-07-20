<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$configFile = __DIR__ . '/config.local.php';
$configValid = false;
$databaseConnected = false;

if (is_file($configFile)) {
    try {
        $config = require $configFile;
        $configValid = is_array($config) && isset($config['db']) && is_array($config['db']);
        if ($configValid && extension_loaded('pdo_mysql')) {
            $db = $config['db'];
            new PDO(
                "mysql:host={$db['host']};port={$db['port']};dbname={$db['name']};charset=utf8mb4",
                $db['user'],
                $db['password'],
                [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION],
            );
            $databaseConnected = true;
        }
    } catch (Throwable $e) {
        $configValid = false;
    }
}

echo json_encode([
    'php_version' => PHP_VERSION,
    'config_exists' => is_file($configFile),
    'config_valid' => $configValid,
    'database_connected' => $databaseConnected,
    'api_entry_exists' => is_file(__DIR__ . '/api/index.php'),
    'pdo_mysql_enabled' => extension_loaded('pdo_mysql'),
    'curl_enabled' => extension_loaded('curl'),
]);
