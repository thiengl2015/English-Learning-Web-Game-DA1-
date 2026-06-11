-- Notification campaigns (admin broadcasts + conditional notifications) and
-- editable personalized templates. Also widen notifications.type and link to campaign.

ALTER TABLE notifications
  MODIFY COLUMN type VARCHAR(50) NOT NULL DEFAULT 'system';

ALTER TABLE notifications
  ADD COLUMN campaign_id CHAR(36) NULL;

CREATE TABLE IF NOT EXISTS notification_campaigns (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(150) NOT NULL,
  message TEXT NOT NULL,
  image_url VARCHAR(500) NULL,
  audience ENUM('all', 'free', 'premium', 'inactive') NOT NULL DEFAULT 'all',
  trigger_type ENUM('schedule', 'level_reached', 'units_completed', 'streak', 'xp_milestone', 'resume_activity') NOT NULL DEFAULT 'schedule',
  trigger_config JSON NULL,
  status ENUM('draft', 'scheduled', 'active', 'sent', 'cancelled') NOT NULL DEFAULT 'draft',
  created_by CHAR(36) NULL,
  sent_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_campaign_status (status),
  INDEX idx_campaign_trigger (trigger_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS notification_templates (
  id INT AUTO_INCREMENT PRIMARY KEY,
  event VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(150) NOT NULL,
  body TEXT NOT NULL,
  variables JSON NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
