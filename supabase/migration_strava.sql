-- ============================================================
-- Migration: 新增 Strava 整合所需資料表與欄位
-- 在 Supabase SQL Editor 執行
-- ============================================================

-- 1. 新增 runner_tokens 表（存放每位跑者的 Strava OAuth tokens）
create table if not exists runner_tokens (
  runner_id     uuid    primary key references runners(id) on delete cascade,
  athlete_id    bigint  unique not null,
  access_token  text    not null,
  refresh_token text    not null,
  expires_at    bigint  not null  -- Unix timestamp（秒）
);

-- 不設 public 讀取 policy（service role key 自動繞過 RLS）
alter table runner_tokens enable row level security;

-- 2. runners 表確認有 id 欄位（建表時已包含，僅供確認）
-- select id, name from runners;
