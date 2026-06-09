-- =====================================================
-- Migration: Create placement tables for AI placement test
-- Date: 2025
-- =====================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Table: placement_topics
CREATE TABLE IF NOT EXISTS placement_topics (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL COMMENT 'Topic name in English',
  name_vi VARCHAR(150) NOT NULL COMMENT 'Topic name in Vietnamese',
  slug VARCHAR(100) NOT NULL UNIQUE,
  icon VARCHAR(10) DEFAULT '📚' COMMENT 'Emoji icon',
  difficulty_range ENUM('beginner', 'intermediate', 'advanced', 'all') DEFAULT 'all',
  min_age INT DEFAULT 8 COMMENT 'Minimum age for this topic',
  max_age INT DEFAULT 18 COMMENT 'Maximum age for this topic',
  unit_id INT DEFAULT NULL COMMENT 'Unit unlocked when this topic is mastered in placement',
  unit_order INT DEFAULT NULL COMMENT 'Display order aligned with unit order',
  vocabulary_keywords JSON DEFAULT NULL COMMENT 'JSON array of keywords to guide AI question generation',
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: placement_test_sessions
CREATE TABLE IF NOT EXISTS placement_test_sessions (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  age INT NOT NULL,
  level_input ENUM('beginner', 'intermediate', 'advanced') NOT NULL,
  selected_topics JSON NOT NULL COMMENT 'Array of 3 topic slugs selected by user',
  questions_data JSON NOT NULL COMMENT 'Full AI-generated questions with correct answers',
  answers_data JSON DEFAULT NULL COMMENT 'User answers for all sections',
  score INT DEFAULT NULL COMMENT 'Overall score 0-100',
  section_scores JSON DEFAULT NULL COMMENT 'Per-section scores',
  unlock_progress JSON DEFAULT NULL COMMENT 'Placement topic/unit unlock result',
  passed BOOLEAN DEFAULT NULL,
  cefr_level ENUM('A1', 'A2', 'B1', 'B2', 'C1') DEFAULT NULL,
  status ENUM('in-progress', 'completed', 'abandoned') DEFAULT 'in-progress',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  completed_at DATETIME DEFAULT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Indexes for performance
CREATE INDEX idx_placement_sessions_user_id ON placement_test_sessions(user_id);
CREATE INDEX idx_placement_sessions_status ON placement_test_sessions(status);
CREATE INDEX idx_placement_topics_age ON placement_topics(min_age, max_age);
CREATE INDEX idx_placement_topics_slug ON placement_topics(slug);
CREATE INDEX idx_placement_topics_active ON placement_topics(is_active);
CREATE INDEX idx_placement_topics_unit_order ON placement_topics(unit_order);

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Migration 005: Placement tables created successfully!' AS status;
