-- Generic key/value store for runtime markers (e.g. weekly leaderboard reset).
CREATE TABLE IF NOT EXISTS system_state (
  `key` VARCHAR(100) NOT NULL PRIMARY KEY,
  `value` TEXT NULL,
  updated_at DATETIME NULL DEFAULT CURRENT_TIMESTAMP
);
