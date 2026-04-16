# Running League — 跑步量競賽排行榜

依每季訓練距離與爬升量計算積分的跑者排行榜。跑者透過 Strava OAuth 授權後，系統定期拉取活動資料並即時更新積分。

## 功能

- 雙隊伍積分排行榜，支援 Supabase Realtime 即時更新
- 個人頁面：賽季統計、週次里程長條圖、活動列表
- 管理後台：新增 / 編輯 / 刪除跑者、設定賽季區間、產生 Strava 授權連結
- Strava OAuth 2.0 個人授權，同步賽季內所有跑步活動
- 60 秒同步 rate limit

## 計分規則

```
積分 = 距離（公尺）+ floor（爬升（公尺）/ 100）
```

## 技術棧

| 類別 | 技術 |
|------|------|
| 前端 | Vue 3 + TypeScript + Vite 8 |
| 樣式 | Tailwind CSS v3 + PostCSS |
| 後端 | Vercel Serverless Functions |
| 資料庫 | Supabase（PostgreSQL + Realtime） |
| 外部整合 | Strava API（OAuth 2.0） |

## 快速開始

```bash
npm install
npm run dev
```

複製 `.env.example` 為 `.env.local` 並填入環境變數（見下方說明）。

## 環境變數

**前端（`.env.local`）**

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

**Vercel 後端環境變數**

```
VITE_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=
ADMIN_SECRET=
APP_URL=
```

> `APP_URL` 為部署後的完整網址，用於 Strava OAuth callback redirect（例：`https://your-app.vercel.app`）

## Supabase 資料表

| 表名 | 用途 |
|------|------|
| `runners` | 跑者基本資料（含 distance / elevation / activities 累計值） |
| `activities` | 每筆跑步活動明細（id 為 Strava activity id） |
| `runner_tokens` | Strava OAuth tokens（access / refresh / expires_at） |
| `settings` | 賽季設定（season_start / season_end） |

## API 路由

```
api/
├── admin/
│   ├── add-runner.ts      POST  新增跑者（需 x-admin-secret header）
│   ├── update-runner.ts   POST  更新跑者資料
│   ├── delete-runner.ts   POST  刪除跑者
│   └── season.ts          GET / POST  讀取或儲存賽季區間
└── strava/
    ├── auth.ts            GET   Strava OAuth 起點（?runner_id=<id>）
    ├── callback.ts        GET   OAuth callback，寫入 runner_tokens
    └── sync.ts            POST  拉取所有已授權跑者的活動並更新積分
```

## Strava 授權流程

1. 管理後台 → 複製跑者的「Strava 授權連結」
2. 將連結傳給跑者，跑者點擊後授權 Strava
3. 授權完成，token 自動存入 DB
4. 之後點擊「更新數據」即可同步該跑者的賽季活動

## 指令

```bash
npm run dev       # 啟動開發伺服器
npm run build     # 型別檢查（vue-tsc）+ 生產打包
npm run preview   # 預覽生產打包
```

## 部署

本專案設計部署於 [Vercel](https://vercel.com)，前端靜態檔案與 `/api/` serverless functions 一併部署。資料庫使用 [Supabase](https://supabase.com) 雲端服務。
