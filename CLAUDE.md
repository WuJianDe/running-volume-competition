# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 專案說明

跑步量競賽（Running League）— 依每季訓練距離與爬升量計算積分的跑者排行榜。

## 專案結構

```
running-volume-competition/
└── frontend/          ← Vue 3 + TypeScript + Vite 前端
```

## 常用指令

所有指令在 `frontend/` 目錄下執行：

```bash
npm run dev       # 啟動開發伺服器
npm run build     # 型別檢查（vue-tsc）+ 生產打包
npm run preview   # 預覽生產打包
```

## 技術棧

- **框架**：Vue 3（`<script setup>` SFC）
- **語言**：TypeScript 6（`ignoreDeprecations: "6.0"` 以支援 `baseUrl` 路徑別名）
- **建置**：Vite 8
- **樣式**：Tailwind CSS v3 + PostCSS；自訂動畫與工具類別寫在 `src/style.css`
- **Icon**：`lucide-vue-next`
- **字型**：Outfit（主體）、JetBrains Mono（數字/Mono）via Google Fonts

## 架構說明

```
src/
├── types/
│   └── runner.ts              # Runner / RankedRunner 型別
├── data/
│   └── runners.ts             # 靜態跑者資料（mock）
├── utils/
│   └── format.ts              # formatNum / formatKm / calcScore
├── composables/
│   └── useLeaderboard.ts      # 計分、排序、統計邏輯（computed）
└── components/
    ├── HeroSection.vue        # 頁首：賽季 badge、主標題
    ├── StatsSummary.vue       # 四格統計 pill（跑者數、公里、爬升、領先隊）
    ├── ScoringRule.vue        # 計分規則說明列
    ├── TeamBoard.vue          # 單一隊伍排行（接受 runners / teamColor 等 props）
    └── RunnerRow.vue          # 單筆跑者列（名次徽章顏色依 rank 與 teamColor 動態計算）
```

### 計分規則

`calcScore(distance, elevation)` → `distance(m) + floor(elevation(m) / 100)`

每跑 1 公尺 = 1 分；每爬升 100 公尺 = 1 分。

### 資料流

`data/runners.ts` → `composables/useLeaderboard.ts`（computed 計算） → `App.vue`（組裝） → 各子元件（props 傳入）

目前資料為靜態 mock，未接後端 API。

## TypeScript 注意事項

- `noUnusedLocals` / `noUnusedParameters` 已啟用，新增程式碼不可有未使用的變數
- `baseUrl` + `@/*` 路徑別名已設定，使用 `@/` 取代相對路徑
