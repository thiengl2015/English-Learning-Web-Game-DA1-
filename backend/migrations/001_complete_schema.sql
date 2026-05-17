-- =====================================================
-- English Learning Web Game - Complete Database Schema
-- MySQL 5.7+ Compatible
-- Generated from Sequelize Models
-- =====================================================

SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';

-- =====================================================
-- 1. UNITS - Top level organization
-- =====================================================

DROP TABLE IF EXISTS units;
CREATE TABLE units (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(100) NOT NULL,
  subtitle VARCHAR(255),
  icon VARCHAR(10),
  order_index INT NOT NULL,
  total_lessons INT DEFAULT 15,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. LESSONS - Belongs to units
-- =====================================================

DROP TABLE IF EXISTS lessons;
CREATE TABLE lessons (
  id INT AUTO_INCREMENT PRIMARY KEY,
  unit_id INT NOT NULL,
  title VARCHAR(100) NOT NULL,
  type ENUM('vocabulary', 'practice', 'test') NOT NULL,
  order_index INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
  INDEX idx_unit_id (unit_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. VOCABULARY - Belongs to units and lessons
-- =====================================================

DROP TABLE IF EXISTS vocabulary;
CREATE TABLE vocabulary (
  id INT AUTO_INCREMENT PRIMARY KEY,
  unit_id INT NOT NULL,
  lesson_id INT NOT NULL,
  word VARCHAR(100) NOT NULL,
  phonetic VARCHAR(100),
  translation VARCHAR(255) NOT NULL,
  image_url VARCHAR(500),
  audio_url VARCHAR(500),
  level INT DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  INDEX idx_unit_id (unit_id),
  INDEX idx_lesson_id (lesson_id),
  INDEX idx_word (word)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. USERS - Core user table (UUID primary key)
-- =====================================================

DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id CHAR(36) PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  avatar VARCHAR(500),
  level INT DEFAULT 1,
  subscription ENUM('Free', 'Premium', 'Super') DEFAULT 'Free',
  native_language VARCHAR(50) DEFAULT 'vi',
  current_level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
  learning_goal ENUM('travel', 'work', 'ielts', 'toeic', 'daily', 'academic') DEFAULT 'daily',
  daily_goal INT DEFAULT 15 COMMENT 'Daily study goal in minutes',
  joined_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status ENUM('Active', 'Inactive') DEFAULT 'Active',
  last_active TIMESTAMP NULL,
  role ENUM('user', 'admin') DEFAULT 'user',
  reset_token VARCHAR(6),
  reset_token_expires TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. USER_PROGRESS - User statistics and progress
-- =====================================================

DROP TABLE IF EXISTS user_progress;
CREATE TABLE user_progress (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL UNIQUE,
  total_xp INT DEFAULT 0 COMMENT 'Lifetime XP earned',
  weekly_xp INT DEFAULT 0 COMMENT 'Current week XP',
  xp_this_week INT DEFAULT 0 COMMENT 'XP earned this week for leaderboard',
  level INT DEFAULT 1 COMMENT 'Calculated from total_xp',
  streak_days INT DEFAULT 0 COMMENT 'Consecutive days of activity',
  last_active_date DATE COMMENT 'Last login/activity date',
  words_learned INT DEFAULT 0 COMMENT 'Total vocabulary words learned',
  total_study_minutes INT DEFAULT 0 COMMENT 'Total study time in minutes',
  units_completed INT DEFAULT 0 COMMENT 'Total units completed',
  lessons_completed INT DEFAULT 0 COMMENT 'Total lessons completed',
  league ENUM('Bronze', 'Silver', 'Gold', 'Diamond') DEFAULT 'Bronze',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_league (league)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. LESSON_PROGRESS - User lesson progress
-- =====================================================

DROP TABLE IF EXISTS lesson_progress;
CREATE TABLE lesson_progress (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  unit_id INT NOT NULL,
  lesson_id INT NOT NULL,
  status ENUM('locked', 'in-progress', 'completed') DEFAULT 'locked',
  stars_earned INT DEFAULT 0,
  is_review BOOLEAN DEFAULT FALSE,
  xp_earned INT DEFAULT 0,
  correct_count INT DEFAULT 0,
  total_count INT DEFAULT 0,
  completed_at TIMESTAMP NULL,
  first_completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  UNIQUE KEY uk_user_lesson (user_id, lesson_id),
  INDEX idx_user_id (user_id),
  INDEX idx_unit_id (unit_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 7. USER_VOCABULARY - User vocabulary learning progress
-- =====================================================

DROP TABLE IF EXISTS user_vocabulary;
CREATE TABLE user_vocabulary (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  vocab_id INT NOT NULL,
  is_favorite BOOLEAN DEFAULT FALSE,
  mastery_level INT DEFAULT 0 COMMENT '0-5: Level of mastery',
  correct_count INT DEFAULT 0,
  incorrect_count INT DEFAULT 0,
  last_reviewed TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (vocab_id) REFERENCES vocabulary(id) ON DELETE CASCADE,
  UNIQUE KEY uk_user_vocab (user_id, vocab_id),
  INDEX idx_user_id (user_id),
  INDEX idx_favorite (is_favorite)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 8. CONVERSATIONS - AI conversation sessions
-- =====================================================

DROP TABLE IF EXISTS conversations;
CREATE TABLE conversations (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  topic VARCHAR(100) NOT NULL COMMENT 'Conversation topic/category',
  topic_title VARCHAR(255) NOT NULL COMMENT 'Human-readable topic title',
  status ENUM('active', 'completed', 'abandoned') DEFAULT 'active',
  total_messages INT DEFAULT 0 COMMENT 'Total messages in conversation',
  duration_seconds INT DEFAULT 0 COMMENT 'Total conversation time',
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ended_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_status (user_id, status),
  INDEX idx_topic (topic)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 9. CONVERSATION_MESSAGES - Messages in conversations
-- =====================================================

DROP TABLE IF EXISTS conversation_messages;
CREATE TABLE conversation_messages (
  id CHAR(36) PRIMARY KEY,
  conversation_id CHAR(36) NOT NULL,
  role ENUM('user', 'assistant', 'system') NOT NULL COMMENT 'Message sender role',
  content TEXT NOT NULL COMMENT 'Message content',
  tokens_used INT DEFAULT 0 COMMENT 'Tokens used for this message',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
  INDEX idx_conversation_created (conversation_id, created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 10. GAME_CONFIG - Game configuration settings
-- =====================================================

DROP TABLE IF EXISTS game_config;
CREATE TABLE game_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  game_type ENUM('galaxy-match', 'planetary-order', 'rescue-mission', 'signal-check', 'voice-command') NOT NULL COMMENT '5 game types',
  unit_id INT COMMENT 'Optional: associated unit',
  lesson_id INT COMMENT 'Optional: associated lesson',
  difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
  questions_count INT DEFAULT 10 COMMENT 'Number of questions in game',
  time_limit INT DEFAULT 120 COMMENT 'Time limit in seconds, 0 = unlimited',
  passing_score INT DEFAULT 70 COMMENT 'Minimum score to pass (%)',
  xp_reward INT DEFAULT 50 COMMENT 'XP reward on completion',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  INDEX idx_game_type (game_type),
  INDEX idx_unit_id (unit_id),
  INDEX idx_lesson_id (lesson_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 11. GAME_SESSIONS - Game play sessions
-- =====================================================

DROP TABLE IF EXISTS game_sessions;
CREATE TABLE game_sessions (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  game_config_id INT NOT NULL,
  status ENUM('in-progress', 'completed', 'abandoned') DEFAULT 'in-progress',
  score INT DEFAULT 0 COMMENT 'Score (0-100)',
  correct_answers INT DEFAULT 0,
  total_questions INT NOT NULL,
  questions_data JSON COMMENT 'JSON containing questions and answers',
  time_spent INT DEFAULT 0 COMMENT 'Play time (seconds)',
  xp_earned INT DEFAULT 0,
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (game_config_id) REFERENCES game_config(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_game_config_id (game_config_id),
  INDEX idx_created_at (created_at),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 12. GAME_WRONG_ANSWERS - Track wrong answers
-- =====================================================

DROP TABLE IF EXISTS game_wrong_answers;
CREATE TABLE game_wrong_answers (
  id CHAR(36) PRIMARY KEY,
  game_session_id CHAR(36) NOT NULL,
  question_id VARCHAR(100),
  prompt TEXT COMMENT 'Question',
  user_answer VARCHAR(255) COMMENT 'User selected answer',
  correct_answer VARCHAR(255) NOT NULL COMMENT 'Correct answer',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (game_session_id) REFERENCES game_sessions(id) ON DELETE CASCADE,
  INDEX idx_session_id (game_session_id),
  INDEX idx_question_id (question_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 13. LESSON_GAMES - Legacy lesson game settings
-- =====================================================

DROP TABLE IF EXISTS lesson_games;
CREATE TABLE lesson_games (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lesson_id INT NOT NULL,
  game_type ENUM('signal-check', 'galaxy-match', 'planetary-order', 'rescue-mission') NOT NULL,
  difficulty ENUM('easy', 'medium', 'hard') DEFAULT 'medium',
  question_count INT DEFAULT 10,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NULL,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  INDEX idx_lesson_id (lesson_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 14. MISSIONS - Daily and achievement missions
-- =====================================================

DROP TABLE IF EXISTS missions;
CREATE TABLE missions (
  id CHAR(36) PRIMARY KEY,
  type ENUM('daily', 'achievement') NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL COMMENT 'Unique code: login, flashcard, lesson, etc.',
  title VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(50) DEFAULT '🌟',
  target INT NOT NULL DEFAULT 1 COMMENT 'Target count to complete',
  xp_reward INT NOT NULL DEFAULT 10,
  chain_code VARCHAR(50) COMMENT 'Previous mission code (for chains)',
  order_index INT DEFAULT 0 COMMENT 'Display order',
  is_active BOOLEAN DEFAULT TRUE,
  reset_daily BOOLEAN DEFAULT FALSE COMMENT 'Reset at midnight',
  start_date DATE COMMENT 'Available from this date',
  end_date DATE COMMENT 'Available until this date',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_type (type),
  INDEX idx_code (code),
  INDEX idx_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 15. USER_MISSIONS - User mission progress
-- =====================================================

DROP TABLE IF EXISTS user_missions;
CREATE TABLE user_missions (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  mission_id CHAR(36) NOT NULL,
  progress INT DEFAULT 0 COMMENT 'Current progress towards target',
  status ENUM('in_progress', 'completed', 'claimed') DEFAULT 'in_progress',
  claimed_at TIMESTAMP NULL COMMENT 'When reward was claimed',
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Last progress update',
  reset_date DATE COMMENT 'Date when daily mission should reset',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (mission_id) REFERENCES missions(id) ON DELETE CASCADE,
  INDEX idx_user_mission (user_id, mission_id),
  INDEX idx_reset_date (reset_date),
  UNIQUE KEY uk_user_mission_reset (user_id, mission_id, reset_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 16. PAYMENT_ORDERS - Payment/subscription orders
-- =====================================================

DROP TABLE IF EXISTS payment_orders;
CREATE TABLE payment_orders (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  package_type VARCHAR(50) NOT NULL COMMENT 'e.g. Premium-Monthly, Super-Monthly',
  transfer_type VARCHAR(20) COMMENT 'qr - SePay always returns qr',
  trans_id VARCHAR(100) COMMENT 'Transaction ID from bank',
  transfer_amount DECIMAL(10, 2),
  transfer_date TIMESTAMP NULL,
  account_number VARCHAR(50) COMMENT 'Sender account number',
  account_holder VARCHAR(200) COMMENT 'Sender account holder name',
  bank_code VARCHAR(20) COMMENT 'Sender bank code',
  description VARCHAR(500) COMMENT 'Payment description / transfer note',
  status ENUM('pending', 'approved', 'rejected', 'cancelled') DEFAULT 'pending',
  admin_note VARCHAR(500),
  reviewed_by CHAR(36) COMMENT 'Admin user who reviewed',
  reviewed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 17. FEEDBACK - User feedback and bug reports
-- =====================================================

DROP TABLE IF EXISTS feedback;
CREATE TABLE feedback (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) COMMENT 'Null if anonymous',
  type ENUM('Review', 'Suggestion', 'Bug Report') NOT NULL,
  rating INT COMMENT '1-5 stars',
  message TEXT NOT NULL,
  status ENUM('unread', 'read', 'resolved') DEFAULT 'unread',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_user_id (user_id),
  INDEX idx_type (type),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- RE-ENABLE FOREIGN KEY CHECKS
-- =====================================================

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- VERIFICATION
-- =====================================================

SELECT 'Database schema created successfully!' AS status;
SHOW TABLES;
