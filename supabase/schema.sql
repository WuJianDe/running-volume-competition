-- ============================================================
-- Running League — Supabase Schema
-- ============================================================

create table if not exists runners (
  id         uuid        primary key default gen_random_uuid(),
  name       text        not null,
  avatar     text        not null,
  distance   integer     not null default 0,  -- 單位：公尺
  elevation  integer     not null default 0,  -- 單位：公尺
  activities integer     not null default 0,  -- 活動次數
  team       text        not null check (team in ('A', 'B')),
  created_at timestamptz not null default now()
);

-- 公開讀取（排行榜不需登入）
alter table runners enable row level security;

create policy "public read"
  on runners for select
  using (true);

-- ============================================================
-- Seed — 初始跑者資料
-- ============================================================

insert into runners (name, avatar, distance, elevation, activities, team) values
  ('陳柏翰', '🏃',    487200,  5820, 42, 'A'),
  ('林芷瑄', '🏃‍♀️', 421500,  8340, 38, 'A'),
  ('王俊傑', '🦅',    398700, 12150, 35, 'A'),
  ('張雅婷', '⚡',    356000,  3200, 31, 'A'),
  ('黃子軒', '🔥',    312400,  6780, 28, 'B'),
  ('劉佳穎', '🌟',    289100,  4560, 26, 'B'),
  ('許志明', '🎯',    245800,  9870, 22, 'B'),
  ('吳心怡', '💨',    198600,  2340, 18, 'B');

-- ============================================================
-- Migration — 已建立的資料表補加 activities 欄位
-- ============================================================

-- alter table runners add column if not exists activities integer not null default 0;
