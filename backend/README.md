# Cloudways PHP + MySQL 部署

1. 在 Cloudways 建立 MySQL database，將 `schema.sql` 匯入該資料庫。資料表皆以 `running_volume_competition_` 為前綴。
2. 將 `config.example.php` 複製成 `config.local.php`，填入 Cloudways 的資料庫憑證、正式網域、Strava OAuth credentials 與高強度 `admin_secret`。此檔不可上傳至 Git。
3. 將 `backend/api/` 部署到 `public_html/running-volume-competition/api/`；必須一併部署 `.htaccess` 與 `index.php`。
4. 複製 `.env.example` 為 `.env.local`，執行 `npm run build`，將 `dist/` 內容與根目錄 `.htaccess` 部署到 `public_html/running-volume-competition/`。
5. `config.local.php` 的 `app_url` 必須包含子目錄，例如 `https://你的網域/running-volume-competition`。
6. 在 Strava Application 設定 Redirect URI：`https://你的網域/running-volume-competition/api/strava/callback`。

PHP 必須啟用 PDO MySQL 與 cURL 擴充功能。Cloudways 的 Apache rewrite module 預設可處理 `api/.htaccess` 路由。

若已匯入舊版 schema，請先備份資料庫，再執行一次 `migrate_table_prefix.sql` 將既有資料表改名。

## 排程同步（建議）

建議在 Cloudways Cron Job 每 15 分鐘呼叫一次 `POST /api/admin/sync`，並附帶 `X-Admin-Secret`。目前前端同步按鈕也會要求輸入同一組管理密鑰；此設計避免公開端點耗盡 Strava API 額度。
