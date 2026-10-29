<?php

/**
 * 複製為 config.local.php 後填入 Cloudways 提供的 MySQL 與 Strava 設定。
 * config.local.php 已被 .gitignore 排除，請勿提交。
 * GitHub Actions 部署時，內容來自 repository secret CONFIG_LOCAL_PHP。
 */
return [
    'db' => [
        'host' => '127.0.0.1',
        'port' => 3306,
        'name' => 'nnbcjxmqpm',
        'user' => 'nnbcjxmqpm',
        'password' => 'database_password',
    ],
    'app_url' => 'https://demo.adevic.dev/running-volume-competition',
    'strava_client_id' => 'your-strava-client-id',
    'strava_client_secret' => 'your-strava-client-secret',
    // 同時用於管理員登入，以及產生跑者的私人 Strava 連結與 OAuth state。更換後既有連結會失效。
    'admin_secret' => 'replace-with-a-long-random-secret',
];
