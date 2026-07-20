# Running League

跑步量競賽排行榜，依每季的跑步距離與爬升計算隊伍積分。

## 技術架構

- 前端：Vue 3、TypeScript、Vite、Tailwind CSS
- 後端：PHP 8.1+、MySQL、cURL
- 部署：Cloudways
- 資料來源：Strava OAuth 2.0

## 計分規則

`積分 = floor(距離（公尺）/ 1000) + floor(爬升（公尺）/ 100)`

## 本機前端開發

```bash
npm install
cp .env.example .env.local
npm run dev
```

預設部署位置是 `/running-volume-competition/`，`.env.example` 已提供相對應的 Vite 與 API base path。若 PHP API 位於其他位置，請在 `.env.local` 覆寫。

## Cloudways 部署

完整步驟見 [backend/README.md](backend/README.md)：

1. 匯入 `backend/schema.sql` 至 MySQL。
2. 複製 `backend/config.example.php` 為 `backend/config.local.php` 並填入憑證。
3. 將 `backend/api/` 部署至 `public_html/running-volume-competition/api/`。
4. 建置前端後，將 `dist/` 內容與根目錄 `.htaccess` 部署至 `public_html/running-volume-competition/`。
5. 在 Strava 設定 callback URL：`https://你的網域/running-volume-competition/api/strava/callback`。

## 常用指令

```bash
npm run dev
npm run build
npm run preview
```
