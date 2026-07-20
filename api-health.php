<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

echo json_encode([
    'php_version' => PHP_VERSION,
    'config_exists' => is_file(__DIR__ . '/config.local.php'),
    'api_entry_exists' => is_file(__DIR__ . '/api/index.php'),
    'pdo_mysql_enabled' => extension_loaded('pdo_mysql'),
    'curl_enabled' => extension_loaded('curl'),
]);
