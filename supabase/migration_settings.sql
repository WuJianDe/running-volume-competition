-- ============================================================
-- Migration: 新增 settings 表存放賽季區間
-- 在 Supabase SQL Editor 執行
-- ============================================================

create table if not exists settings (
  id           integer  primary key default 1,
  season_start date     not null default '2026-04-01',
  season_end   date     not null default '2026-04-30'
);

-- 只允許單筆設定
alter table settings enable row level security;

-- 公開讀取（前台需要顯示賽季資訊）
create policy "public read"
  on settings for select
  using (true);

-- 插入預設值
insert into settings (id, season_start, season_end)
values (1, '2026-04-01', '2026-04-30')
on conflict (id) do nothing;
