-- ============================================================
-- Migration: 明確補強 RLS，禁止匿名用戶寫入
-- 在 Supabase SQL Editor 執行
-- ============================================================

-- runners：僅允許 service_role 寫入（anon/authenticated 只能讀）
create policy "deny anon insert runners"
  on runners for insert to anon, authenticated
  using (false) with check (false);

create policy "deny anon update runners"
  on runners for update to anon, authenticated
  using (false) with check (false);

create policy "deny anon delete runners"
  on runners for delete to anon, authenticated
  using (false);

-- runner_tokens：完全禁止公開存取
create policy "deny all runner_tokens"
  on runner_tokens for all to anon, authenticated
  using (false);

-- settings：禁止匿名寫入（僅允許 service_role）
create policy "deny anon write settings"
  on settings for insert to anon, authenticated
  using (false) with check (false);

create policy "deny anon update settings"
  on settings for update to anon, authenticated
  using (false) with check (false);
