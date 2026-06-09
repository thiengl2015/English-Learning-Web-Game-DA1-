-- User UI/preferences settings used by client/settings and admin/user detail.

CREATE TABLE IF NOT EXISTS user_settings (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL UNIQUE,
  push_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  email_reminders BOOLEAN NOT NULL DEFAULT TRUE,
  sound_effects BOOLEAN NOT NULL DEFAULT TRUE,
  background_music BOOLEAN NOT NULL DEFAULT TRUE,
  music_volume INT NOT NULL DEFAULT 70,
  audio_volume INT NOT NULL DEFAULT 80,
  dark_mode BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_settings_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
