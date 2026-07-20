-- 僅供已使用舊表名的 MySQL 資料庫執行一次。
-- 新安裝請直接匯入 schema.sql，不需要執行本檔案。
RENAME TABLE runners TO running_volume_competition_runners;
RENAME TABLE activities TO running_volume_competition_activities;
RENAME TABLE runner_tokens TO running_volume_competition_runner_tokens;
RENAME TABLE settings TO running_volume_competition_settings;
