# Running League

以季為單位統計跑步距離與爬升的團隊排行榜。

## 技術架構

- 前端：Vue 3、TypeScript、Vite、Tailwind CSS
- 後端：PHP 7.4+、MySQL、cURL
- 部署：Cloudways 子目錄 `/running-volume-competition/`
- 活動資料：Strava OAuth 2.0

## 計分規則

`積分 = floor(距離（公尺）/ 1000) + floor(爬升（公尺）/ 100)`

## 自動部署（GitHub Actions → Cloudways）

推送到 `main` 會觸發 `.github/workflows/deploy.yml`：建置、（可選）匯入資料表、以 rsync 上傳到
`/home/master/applications/nnbcjxmqpm/public_html/running-volume-competition/`，最後打 `api-health.php` 做冒煙測試。

需要的 repository secrets（Settings → Secrets and variables → Actions）：

| Secret | 說明 |
|---|---|
| `SSH_PRIVATE_KEY` | 部署用 SSH 私鑰；對應公鑰需加入 Cloudways 應用程式的 SSH 授權金鑰 |
| `CONFIG_LOCAL_PHP` | 完整的 `config.local.php` 內容（範本見 `backend/config.example.php`） |
| `DB_PASSWORD` | 選填；設定後每次部署會執行冪等的 `schema.sql` |

資料表一律加上 `running_volume_competition_` 前綴。管理員密碼同時用來簽署跑者的私人 Strava 授權連結，更換後需重新複製連結。

## 手動建置與部署

```bash
npm install
npm run build
```

建置後，`dist/` 會包含前端、PHP API、`.htaccess`、`config.local.php` 範本、資料庫 schema 與 Cloudways 上傳說明。請依 `dist/UPLOAD_TO_CLOUDWAYS.md` 部署。

管理頁使用不依賴伺服器 rewrite 的 hash 路由：

```text
https://你的網域/running-volume-competition/#/admin
```

## Strava 設定與限制

1. 在 Strava API Settings 使用建立此 API app 的帳號維持有效訂閱；Strava 將訂閱列為建立與使用 API app 的前提。
2. 新 API app 預設為單一使用者模式。若要讓多位跑者連結，請在 Strava API Settings Dashboard 升級存取層級；初始升級通常可支援最多 10 位 athlete。
3. Authorization Callback Domain 設為純網域，例如 `demo.adevic.dev`。
4. Redirect URI 設為：

```text
https://你的網域/running-volume-competition/api.php?_route=/strava/callback
```

5. 每位跑者須從管理頁的連結完成 OAuth 授權，接著在首頁同步 Strava。

> Strava API 條款可能限制支援虛擬競賽或 competitions 的使用案例。上線多人競賽前，請確認產品用途符合 [Strava API Agreement](https://developers.strava.com/)。

官方文件：[Getting Started](https://developers.strava.com/docs/getting-started/)｜[Authentication](https://developers.strava.com/docs/authentication/)
