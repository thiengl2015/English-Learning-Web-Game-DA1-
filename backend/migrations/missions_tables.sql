-- =====================================================
-- Fix: Create user_missions table and add columns to user_progress
-- =====================================================

USE englishlearningapp;

-- Xóa bảng missions và user_missions nếu tồn tại để tạo lại
DROP TABLE IF EXISTS user_missions;
DROP TABLE IF EXISTS missions;

-- =====================================================
-- Tạo lại bảng missions
-- =====================================================

CREATE TABLE missions (
  id CHAR(36) PRIMARY KEY,
  type ENUM('daily', 'achievement') NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(50) DEFAULT '🌟',
  target INT NOT NULL DEFAULT 1,
  xp_reward INT NOT NULL DEFAULT 10,
  chain_code VARCHAR(50),
  order_index INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  reset_daily BOOLEAN DEFAULT FALSE,
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- =====================================================
-- Tạo bảng user_missions (không có foreign key để tránh lỗi)
-- =====================================================

CREATE TABLE user_missions (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  mission_id CHAR(36) NOT NULL,
  progress INT DEFAULT 0,
  status ENUM('in_progress', 'completed', 'claimed') DEFAULT 'in_progress',
  claimed_at TIMESTAMP NULL,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  reset_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_user_mission (user_id, mission_id),
  INDEX idx_reset_date (reset_date)
) ENGINE=InnoDB;

-- =====================================================
-- Insert seed data cho missions
-- =====================================================

-- Insert Daily Missions
INSERT INTO missions (id, type, code, title, description, icon, target, xp_reward, order_index, reset_daily) VALUES
(UUID(), 'daily', 'login', 'Check-in', 'Đăng nhập vào ứng dụng hàng ngày', '🌟', 1, 10, 1, TRUE),
(UUID(), 'daily', 'flashcard', 'Ôn tập', 'Hoàn thành 1 bộ flashcard', '🎴', 1, 20, 2, TRUE),
(UUID(), 'daily', 'complete_level', 'Chinh phục', 'Chinh phục 1 level mới', '🎯', 1, 10, 3, TRUE),
(UUID(), 'daily', 'complete_lesson', 'Học tập', 'Hoàn thành 1 bài học mới', '📚', 1, 25, 4, TRUE),
(UUID(), 'daily', 'daily_goal', 'Mục tiêu hàng ngày', 'Học 15 phút mỗi ngày', '⏰', 15, 50, 5, TRUE);

-- Insert Achievement Missions
INSERT INTO missions (id, type, code, title, description, icon, target, xp_reward, order_index, chain_code) VALUES
(UUID(), 'achievement', 'unit_5', 'Người mở đường', 'Hoàn thành 5 Units', '🚀', 5, 100, 1, NULL),
(UUID(), 'achievement', 'unit_10', 'Nhà thám hiểm', 'Hoàn thành 10 Units', '🌍', 10, 250, 2, 'unit_5'),
(UUID(), 'achievement', 'unit_20', 'Bậc thầy vũ trụ', 'Hoàn thành 20 Units', '👑', 20, 500, 3, 'unit_10'),
(UUID(), 'achievement', 'words_50', 'Người học chữ', 'Học xong 50 từ vựng', '📝', 50, 80, 4, NULL),
(UUID(), 'achievement', 'words_100', 'Thạo ngôn ngữ', 'Học xong 100 từ vựng', '📖', 100, 150, 5, 'words_50'),
(UUID(), 'achievement', 'words_500', 'Bách khoa toàn thư', 'Học xong 500 từ vựng', '📚', 500, 800, 6, 'words_100'),
(UUID(), 'achievement', 'streak_10', 'Kiên trì', 'Đạt chuỗi 10 ngày liên tiếp', '🔥', 10, 200, 7, NULL),
(UUID(), 'achievement', 'streak_30', 'Nghị lực sắt đá', 'Đạt chuỗi 30 ngày liên tiếp', '💪', 30, 400, 8, 'streak_10'),
(UUID(), 'achievement', 'streak_50', 'Huyền thoại', 'Đạt chuỗi 50 ngày liên tiếp', '⚡', 50, 700, 9, 'streak_30'),
(UUID(), 'achievement', 'streak_100', 'Bất tử', 'Đạt chuỗi 100 ngày liên tiếp', '💎', 100, 1500, 10, 'streak_50'),
(UUID(), 'achievement', 'study_60', 'Học giả', 'Tổng thời gian học 60 phút', '⏱️', 60, 80, 11, NULL),
(UUID(), 'achievement', 'study_120', 'Chuyên gia', 'Tổng thời gian học 120 phút', '🎓', 120, 150, 12, 'study_60'),
(UUID(), 'achievement', 'study_360', 'Tiến sĩ', 'Tổng thời gian học 360 phút (6 giờ)', '🧠', 360, 400, 13, 'study_120'),
(UUID(), 'achievement', 'study_600', 'Giáo sư vĩ đại', 'Tổng thời gian học 600 phút (10 giờ)', '🏆', 600, 1000, 14, 'study_360');

-- =====================================================
-- Thêm các cột mới vào user_progress (sử dụng procedure để kiểm tra)
-- =====================================================

-- Thêm cột xp_this_week
SET @dbname = DATABASE();
SET @tablename = 'user_progress';
SET @columnname = 'xp_this_week';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT 1',
  'ALTER TABLE user_progress ADD COLUMN xp_this_week INT DEFAULT 0 COMMENT "XP earned this week for leaderboard"'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Thêm cột words_learned
SET @columnname = 'words_learned';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT 1',
  'ALTER TABLE user_progress ADD COLUMN words_learned INT DEFAULT 0 COMMENT "Total vocabulary words learned"'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Thêm cột total_study_minutes
SET @columnname = 'total_study_minutes';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT 1',
  'ALTER TABLE user_progress ADD COLUMN total_study_minutes INT DEFAULT 0 COMMENT "Total study time in minutes"'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Thêm cột units_completed
SET @columnname = 'units_completed';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT 1',
  'ALTER TABLE user_progress ADD COLUMN units_completed INT DEFAULT 0 COMMENT "Total units completed"'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- Thêm cột lessons_completed
SET @columnname = 'lessons_completed';
SET @preparedStatement = (SELECT IF(
  (
    SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = @dbname
    AND TABLE_NAME = @tablename
    AND COLUMN_NAME = @columnname
  ) > 0,
  'SELECT 1',
  'ALTER TABLE user_progress ADD COLUMN lessons_completed INT DEFAULT 0 COMMENT "Total lessons completed"'
));
PREPARE alterIfNotExists FROM @preparedStatement;
EXECUTE alterIfNotExists;
DEALLOCATE PREPARE alterIfNotExists;

-- =====================================================
-- Verify
-- =====================================================

SELECT 'Migration completed successfully!' AS status;
SELECT COUNT(*) AS missions_count FROM missions;
SELECT COUNT(*) AS user_missions_count FROM user_missions;

SHOW TABLES;

DESCRIBE user_progress;
