<?php

/**
 * 複製為 config.local.php 後填入 Cloudways 提供的 MySQL 與 Strava 設定。
 * config.local.php 已被 .gitignore 排除，請勿提交。
 */
return [
    'db' => [
        'host' => '127.0.0.1',
        'port' => 3306,
        'name' => 'running_league',
        'user' => 'database_user',
        'password' => 'database_password',
    ],
    'app_url' => 'https://league.example.com/running-volume-competition',
    'strava_client_id' => 'your-strava-client-id',
    'strava_client_secret' => 'your-strava-client-secret',
    'admin_secret' => 'replace-with-a-long-random-secret',
];
