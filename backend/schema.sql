CREATE TABLE IF NOT EXISTS running_volume_competition_runners (
  id CHAR(36) NOT NULL PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  avatar VARCHAR(32) NOT NULL,
  distance INT UNSIGNED NOT NULL DEFAULT 0,
  elevation INT UNSIGNED NOT NULL DEFAULT 0,
  activities INT UNSIGNED NOT NULL DEFAULT 0,
  team ENUM('A', 'B') NOT NULL,
  synced_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS running_volume_competition_activities (
  id BIGINT UNSIGNED NOT NULL PRIMARY KEY,
  runner_id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL DEFAULT '',
  distance INT UNSIGNED NOT NULL DEFAULT 0,
  elevation INT UNSIGNED NOT NULL DEFAULT 0,
  start_date DATETIME NOT NULL,
  CONSTRAINT fk_activities_runner FOREIGN KEY (runner_id) REFERENCES running_volume_competition_runners(id) ON DELETE CASCADE,
  INDEX idx_activities_runner_date (runner_id, start_date DESC)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS running_volume_competition_runner_tokens (
  runner_id CHAR(36) NOT NULL PRIMARY KEY,
  athlete_id BIGINT UNSIGNED NOT NULL UNIQUE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at BIGINT UNSIGNED NOT NULL,
  CONSTRAINT fk_runner_tokens_runner FOREIGN KEY (runner_id) REFERENCES running_volume_competition_runners(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS running_volume_competition_settings (
  id TINYINT UNSIGNED NOT NULL PRIMARY KEY,
  season_start DATE NOT NULL,
  season_end DATE NOT NULL,
  CHECK (season_start <= season_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT IGNORE INTO running_volume_competition_settings (id, season_start, season_end)
VALUES (1, '2026-04-01', '2026-04-30');
