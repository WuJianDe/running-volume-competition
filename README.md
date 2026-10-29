# Running League

以季為單位統計跑步距離與爬升的團隊排行榜。

線上網址：<https://demo.adevic.dev/running-volume-competition/>

## 技術架構

- 前端：Vue 3、TypeScript、Vite、Tailwind CSS（hash 路由）
- 後端：PHP 7.4+、MySQL、cURL，不使用框架
- 部署：Cloudways 子目錄 `/running-volume-competition/`，GitHub Actions 自動部署
- 活動資料：Strava OAuth 2.0

## 計分規則

`積分 = floor(距離（公尺）/ 1000) + floor(爬升（公尺）/ 100)`

同分時以爬升較多者排名在前。

## 專案結構

```text
src/
  views/            首頁排行榜、管理頁、個人頁
  components/       排行榜元件；admin/ 為管理頁的表單與清單
  composables/      useLeaderboard（排行榜輪詢）、useAdmin（管理頁狀態）
  lib/              api.ts（API 與管理密碼）、teams.ts（隊名與顏色）
backend/
  api/index.php     入口：讀取設定、連線資料庫、分派請求
  api/lib/          helpers.php、strava.php、routes.php（lib/ 以 .htaccess 禁止直接存取）
  schema.sql        資料表（可重複執行）
  config.example.php
api.php             實體 API 入口（主機不支援 /api/* rewrite 時使用）
api-health.php      健康檢查：設定、資料庫、PHP 擴充
scripts/prepare-deploy.mjs   組出 dist/ 部署包
.github/workflows/deploy.yml 自動部署
```

資料表一律加上 `running_volume_competition_` 前綴。

## API

所有路徑透過 `api.php?_route=<路徑>` 呼叫。回應一律帶 `Cache-Control: no-store`。

| 方法 | 路徑 | 權限 | 說明 |
|---|---|---|---|
| GET | `/overview` | 公開 | 賽季區間與全部跑者 |
| GET | `/runners`、`/runners/{id}`、`/runners/{id}/activities`、`/activities`、`/season` | 公開 | 跑者、活動、賽季 |
| GET | `/connect/{token}` | 私人連結 | 查詢此授權連結對應的跑者姓名與頭像 |
| GET | `/strava/auth?token=` | 私人連結 | 導向 Strava 授權頁 |
| GET | `/strava/callback` | Strava | OAuth 回呼，驗證簽章 state 後儲存 token |
| POST | `/admin/login` | 管理員 | 驗證管理密碼 |
| GET / POST | `/admin/runners` | 管理員 | 跑者清單（含授權 token）／新增跑者 |
| PATCH / DELETE | `/admin/runners/{id}` | 管理員 | 編輯／刪除跑者 |
| PUT | `/admin/season` | 管理員 | 更新賽季區間 |
| POST | `/admin/sync` | 管理員 | 從 Strava 同步所有已連結的跑者 |

管理員請求帶標頭 `X-Admin-Secret`。

### 安全設計

- 跑者 id 是公開的，不能用來連結 Strava；授權連結使用由 `admin_secret` 與跑者 id 計算出的私人 token。
- OAuth state 為簽章加到期時間，不依賴 PHP session。
- `admin_secret` 更換後，所有已複製的授權連結會失效，需到管理頁重新複製。

## 自動部署（GitHub Actions → Cloudways）

推送到 `main`（或在 Actions 頁手動執行 Deploy to Cloudways）會觸發 `.github/workflows/deploy.yml`：

1. 建置前端並組出 `dist/`
2. 以 `CONFIG_LOCAL_PHP` 產生 `config.local.php`
3. 設定了 `DB_PASSWORD` 時，透過 SSH 執行 `schema.sql`
4. rsync 上傳到 `/home/master/applications/nnbcjxmqpm/public_html/running-volume-competition/`，並將 `config.local.php` 設為 `644`（PHP 執行帳號需要能讀取）
5. 檢查 `api-health.php` 與首頁

需要的 repository secrets（Settings → Secrets and variables → Actions）：

| Secret | 說明 |
|---|---|
| `SSH_PRIVATE_KEY` | 部署用 SSH 私鑰；對應公鑰需加入 Cloudways 的 SSH 授權金鑰 |
| `CONFIG_LOCAL_PHP` | 完整的 `config.local.php` 內容（範本見 `backend/config.example.php`） |
| `DB_PASSWORD` | 選填；設定後每次部署會執行冪等的 `schema.sql` |

從本機檔案更新 secret 並重新部署：

```bash
gh secret set CONFIG_LOCAL_PHP --repo WuJianDe/running-volume-competition < config.local.php
gh workflow run deploy.yml --repo WuJianDe/running-volume-competition
```

根目錄的 `config.local.php` 含密碼與密鑰，已被 `.gitignore` 排除，請勿提交。

### 疑難排解

打 `api-health.php` 檢視狀態（加上隨機查詢參數可避開 CDN 快取）：

```text
https://demo.adevic.dev/running-volume-competition/api-health.php?x=1
```

| 欄位 | 為 false / 有值時 |
|---|---|
| `config_readable` | 設定檔權限不對，PHP 讀不到 |
| `config_valid`、`config_error` | 設定檔語法錯誤或回傳格式不對，`config_error` 會說明原因 |
| `database_connected` | 資料庫帳密或主機錯誤 |

`/overview` 回 500 通常代表資料表尚未建立，請設定 `DB_PASSWORD` 後重新部署，或手動匯入 `backend/schema.sql`。

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

登入密碼為 `config.local.php` 的 `admin_secret`。

## Strava 設定與限制

1. 在 Strava API Settings 使用建立此 API app 的帳號維持有效訂閱；Strava 將訂閱列為建立與使用 API app 的前提。
2. 新 API app 預設為單一使用者模式。若要讓多位跑者連結，請在 Strava API Settings Dashboard 升級存取層級；初始升級通常可支援最多 10 位 athlete。
3. Authorization Callback Domain 設為純網域，例如 `demo.adevic.dev`。
4. Redirect URI 設為：

```text
https://你的網域/running-volume-competition/api.php?_route=/strava/callback
```

5. 每位跑者須從管理頁複製專屬「授權連結」完成 OAuth 授權，接著在首頁同步 Strava。

同步時若出現 `Application / Status / Inactive`（403），代表 Strava 端的 API app 已被停用，通常是建立 app 的帳號訂閱失效；請先在 Strava API Settings 處理，程式不需要修改。

> Strava API 條款可能限制支援虛擬競賽或 competitions 的使用案例。上線多人競賽前，請確認產品用途符合 [Strava API Agreement](https://developers.strava.com/)。

官方文件：[Getting Started](https://developers.strava.com/docs/getting-started/)｜[Authentication](https://developers.strava.com/docs/authentication/)
