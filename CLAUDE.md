# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案說明

跑步量競賽（Running League）— 依每季訓練距離與爬升量計算積分的跑者排行榜。跑者透過 Strava OAuth 授權後，系統定期拉取活動資料並更新積分。

## 常用指令

在專案根目錄執行：

```bash
npm run dev       # 啟動開發伺服器
npm run build     # 型別檢查（vue-tsc）+ 生產打包
npm run preview   # 預覽生產打包
```

> 無 lint / test 指令，型別檢查由 `npm run build` 觸發。

## 技術棧

- **框架**：Vue 3（`<script setup>` SFC）+ Vue Router 4
- **語言**：TypeScript 6（`ignoreDeprecations: "6.0"` 以支援 `baseUrl` 路徑別名）
- **建置**：Vite 8
- **後端**：Supabase（PostgreSQL + Realtime）；API 層為 Vercel Serverless Functions（`/api/`）
- **外部整合**：Strava API（OAuth 2.0 授權流程 + 活動資料同步）
- **樣式**：Tailwind CSS v3 + PostCSS；自訂動畫與工具類別寫在 `src/style.css`
- **Icon**：`lucide-vue-next`
- **字型**：Outfit（主體）、JetBrains Mono（數字/Mono）via Google Fonts

## 架構說明

### 前端（`src/`）

```
src/
├── types/runner.ts           # Runner / RankedRunner 型別
├── lib/supabase.ts           # Supabase client（使用 VITE_SUPABASE_* 環境變數）
├── utils/format.ts           # formatNum / formatKm / calcScore
├── composables/
│   └── useLeaderboard.ts     # 從 Supabase 拉取跑者資料、訂閱 Realtime、計分排序
├── router/index.ts           # 路由：/ | /admin | /runner/:id
├── views/
│   ├── HomeView.vue          # 主排行榜頁
│   ├── AdminView.vue         # 管理後台（密碼保護，操作需帶 x-admin-secret header）
│   └── RunnerView.vue        # 個人頁：統計、週次里程長條圖、活動列表
└── components/
    ├── HeroSection.vue       # 頁首主標題
    ├── StatsSummary.vue      # 四格統計 pill
    ├── ScoringRule.vue       # 計分規則說明列
    ├── TeamBoard.vue         # 單一隊伍排行
    ├── RunnerRow.vue         # 單筆跑者列（名次徽章顏色依 rank / teamColor 動態計算）
    ├── ActivityFeed.vue      # 最近活動動態（最多 5 筆）
    └── SyncButton.vue        # 固定於右下角的 Strava 同步按鈕（30s timeout，60s rate limit）
```

### API 層（`/api/`，Vercel Serverless）

```
api/
├── admin/
│   ├── add-runner.ts         # POST：新增跑者（需 x-admin-secret）
│   ├── update-runner.ts      # POST：更新跑者基本資料
│   ├── delete-runner.ts      # POST：刪除跑者
│   └── season.ts             # GET / POST：讀取或儲存賽季區間（settings 表）
└── strava/
    ├── auth.ts               # Strava OAuth 起點（?connect=<runner_id> 帶入）
    ├── callback.ts           # OAuth callback：儲存 tokens 至 runner_tokens 表
    └── sync.ts               # POST：拉取所有已授權跑者的 Strava 活動並寫入 DB
```

### Supabase 資料表

| 表名 | 用途 |
|------|------|
| `runners` | 跑者基本資料（含 distance/elevation/activities 累計值） |
| `activities` | 每筆跑步活動明細（id 為 Strava activity id） |
| `runner_tokens` | Strava OAuth tokens（access/refresh/expires_at） |
| `settings` | 賽季設定（season_start / season_end） |

### 計分規則

`calcScore(distance, elevation)` → `distance(m) + floor(elevation(m) / 100)`

### 資料流

1. **排行榜**：`useLeaderboard` 於 `onMounted` 呼叫 Supabase，並訂閱 `runners` 表的 Realtime 變更，資料更新自動重刷。
2. **Strava 同步**：使用者點擊「更新數據」→ `POST /api/strava/sync` → 依序刷新 token、呼叫 Strava API、寫入 `runners` + `activities`。60 秒 rate limit 由 API 端管控。
3. **Strava 授權**：管理後台產生 `/?connect=<runner_id>` 連結發給跑者 → `/api/strava/auth` 轉導 Strava → callback 寫入 token。

## 環境變數

前端（Vite，需有 `VITE_` 前綴）：
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

API（Vercel 環境，不含 `VITE_` 前綴）：
- `VITE_SUPABASE_URL`（API 端直接讀取）
- `SUPABASE_SERVICE_ROLE_KEY`（server-side 操作用）
- `STRAVA_CLIENT_ID`
- `STRAVA_CLIENT_SECRET`
- `ADMIN_SECRET`（管理後台密碼）

## TypeScript 注意事項

- `noUnusedLocals` / `noUnusedParameters` 已啟用，新增程式碼不可有未使用的變數
- 使用 `@/` 路徑別名取代相對路徑（`baseUrl` + `paths` 已設定）
- 樣式優先使用 inline `style` 屬性傳入顏色，Tailwind 僅用於 layout / spacing
