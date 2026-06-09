-- =====================================================
-- Migration: Create checkpoint/challenge tables (unit tests)
-- Date: 2025
-- =====================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Table: unit_test_configs
-- Luu cau hinh checkpoint/challenge (tieu de, unit cover, threshold)
CREATE TABLE IF NOT EXISTS unit_test_configs (
  id VARCHAR(50) PRIMARY KEY COMMENT 'checkpoint-1, checkpoint-2, unit-1, unit-2...',
  test_type ENUM('checkpoint', 'challenge') NOT NULL COMMENT 'Loai bai thi',
  title VARCHAR(255) NOT NULL COMMENT 'Tieu de bai thi',
  description TEXT DEFAULT NULL COMMENT 'Mo ta chi tiet',
  units_covered JSON DEFAULT NULL COMMENT 'Mang unit ID [1,2,3] chi checkpoint',
  unit_id INT DEFAULT NULL COMMENT 'Unit ID chi challenge, FK units.id',
  pass_threshold INT DEFAULT 80 COMMENT 'Phan tram de pass (checkpoint: 80, challenge: 100)',
  total_score INT DEFAULT 20 COMMENT 'Tong diem (checkpoint: 20, challenge: 10)',
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: unit_test_sessions
-- Lich su lam bai cua user
CREATE TABLE IF NOT EXISTS unit_test_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id CHAR(36) NOT NULL COMMENT 'FK users.id',
  test_type ENUM('checkpoint', 'challenge') NOT NULL COMMENT 'Loai bai thi',
  test_id VARCHAR(50) NOT NULL COMMENT 'checkpoint-1, unit-1...',
  units_covered JSON DEFAULT NULL COMMENT 'Mang unit ID [1,2,3] chi checkpoint',
  unit_id INT DEFAULT NULL COMMENT 'Unit ID chi challenge',
  status ENUM('in_progress', 'completed', 'abandoned') DEFAULT 'in_progress' COMMENT 'Trang thai',
  answers_data JSON DEFAULT NULL COMMENT 'Dap an nguoi dung: [{questionId, section, userAnswer, isCorrect, score}]',
  score INT DEFAULT 0 COMMENT 'Tong diem',
  pass BOOLEAN DEFAULT FALSE COMMENT 'Pass hay fail',
  section_scores JSON DEFAULT NULL COMMENT 'Diem theo section: {A:{correct,total}, B:{...}}',
  section_details JSON DEFAULT NULL COMMENT 'Chi tiet tung cau: [{section, questionId, correct, userAnswer, isCorrect}]',
  time_spent_seconds INT DEFAULT 0 COMMENT 'Thoi gian lam bai (giay)',
  completed_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (test_id) REFERENCES unit_test_configs(id) ON DELETE CASCADE,
  FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: question_checkpoints
-- Cau hoi checkpoint (5 section: A, B, C, D, E)
CREATE TABLE IF NOT EXISTS question_checkpoints (
  id INT AUTO_INCREMENT PRIMARY KEY,
  checkpoint_id VARCHAR(50) NOT NULL COMMENT 'checkpoint-1, checkpoint-2...',
  section ENUM('A', 'B', 'C', 'D', 'E') NOT NULL COMMENT 'Section A-E',
  question_type ENUM('match', 'listen_write', 'fill_blank', 'unscramble', 'read_speak') NOT NULL COMMENT 'Loai cau hoi',
  content JSON NOT NULL COMMENT 'Noi dung cau hoi (khong co dap an)',
  correct_answer JSON NOT NULL COMMENT 'Dap an dung',
  score INT NOT NULL DEFAULT 1 COMMENT 'Diem cho cau nay',
  display_order INT NOT NULL DEFAULT 0 COMMENT 'Thu tu hien thi trong section',
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (checkpoint_id) REFERENCES unit_test_configs(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: question_challenges
-- Cau hoi challenge (4 section: A, B, C, D)
CREATE TABLE IF NOT EXISTS question_challenges (
  id INT AUTO_INCREMENT PRIMARY KEY,
  unit_id INT NOT NULL COMMENT 'FK units.id',
  section ENUM('A', 'B', 'C', 'D') NOT NULL COMMENT 'Section A-D',
  question_type ENUM('match', 'listen_write', 'fill_blank', 'word_bank', 'listen_repeat') NOT NULL COMMENT 'Loai cau hoi',
  content JSON NOT NULL COMMENT 'Noi dung cau hoi (khong co dap an)',
  correct_answer JSON NOT NULL COMMENT 'Dap an dung',
  score INT NOT NULL DEFAULT 1 COMMENT 'Diem cho cau nay',
  display_order INT NOT NULL DEFAULT 0 COMMENT 'Thu tu hien thi trong section',
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for performance
CREATE INDEX idx_unit_test_configs_type ON unit_test_configs(test_type);
CREATE INDEX idx_unit_test_configs_active ON unit_test_configs(is_active);
CREATE INDEX idx_unit_test_sessions_user_id ON unit_test_sessions(user_id);
CREATE INDEX idx_unit_test_sessions_test_id ON unit_test_sessions(test_id);
CREATE INDEX idx_unit_test_sessions_status ON unit_test_sessions(status);
CREATE INDEX idx_unit_test_sessions_type ON unit_test_sessions(test_type);
CREATE INDEX idx_question_checkpoints_checkpoint_id ON question_checkpoints(checkpoint_id);
CREATE INDEX idx_question_checkpoints_section ON question_checkpoints(checkpoint_id, section);
CREATE INDEX idx_question_challenges_unit_id ON question_challenges(unit_id);
CREATE INDEX idx_question_challenges_section ON question_challenges(unit_id, section);

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Migration 006: Unit test tables (checkpoint/challenge) created successfully!' AS status;
