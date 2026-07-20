<?php
declare(strict_types=1);

// Physical API entry point for hosts that do not rewrite /api/* paths.
if (isset($_GET['_debug']) && $_GET['_debug'] === '1') {
    error_reporting(E_ALL);
    ini_set('display_errors', '0');
    register_shutdown_function(function (): void {
        $error = error_get_last();
        if ($error === null) return;

        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'error' => 'PHP fatal error',
            'type' => $error['type'],
            'message' => $error['message'],
            'line' => $error['line'],
        ]);
    });
}

require __DIR__ . '/api/index.php';
