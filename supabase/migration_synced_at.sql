-- ============================================================
-- Migration: 新增 synced_at 欄位記錄上次同步時間
-- 在 Supabase SQL Editor 執行
-- ============================================================

alter table runners
  add column if not exists synced_at timestamptz;
