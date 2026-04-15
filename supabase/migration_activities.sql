-- ============================================================
-- Migration: 新增 activities 表存每筆跑步活動
-- 在 Supabase SQL Editor 執行
-- ============================================================

create table if not exists activities (
  id          bigint       primary key,   -- Strava activity ID
  runner_id   uuid         not null references runners(id) on delete cascade,
  name        text         not null default '',
  distance    integer      not null default 0,  -- 公尺
  elevation   integer      not null default 0,  -- 公尺
  start_date  timestamptz  not null
);

create index if not exists activities_runner_id_idx on activities(runner_id);
create index if not exists activities_start_date_idx on activities(start_date desc);

alter table activities enable row level security;

create policy "public read activities"
  on activities for select using (true);
