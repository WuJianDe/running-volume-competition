# Cloudways PHP + MySQL 部署

## 部署內容

執行 `npm run build` 後，所有網站部署檔案都位於 `dist/`。

1. 編輯 `dist/config.local.php`，填入 Cloudways MySQL、Strava 及 `admin_secret` 設定。
2. 將 `dist/_database/schema.sql` 匯入 MySQL；不要將 `_database/` 上傳到公開網站根目錄。
3. 將 `dist/` 內其餘內容（包含隱藏 `.htaccess`）上傳到：

```text
/applications/ssehtjqyxe/public_html/running-volume-competition/
```

4. 清除 Cloudways Varnish cache。

PHP 需要 7.4+、PDO MySQL 與 cURL 擴充功能。

## 必要設定

`config.local.php` 的 `app_url` 必須包含子目錄：

```php
'app_url' => 'https://你的網域/running-volume-competition',
```

Strava Redirect URI：

```text
https://你的網域/running-volume-competition/api.php?_route=/strava/callback
```

Strava Authorization Callback Domain 僅填網域，例如 `demo.adevic.dev`。

## Strava API 存取

建立 API Application 的 Strava 帳號必須維持有效訂閱。新 app 預設為單一使用者模式；多人跑者連結前，請在 Strava API Settings Dashboard 升級 access tier。詳見 [Strava Getting Started](https://developers.strava.com/docs/getting-started/)。

## 診斷

部署期間可開啟 `api-health.php` 檢查 PHP 版本、設定檔、資料庫及必要擴充功能。確認完成後請刪除該檔案。
