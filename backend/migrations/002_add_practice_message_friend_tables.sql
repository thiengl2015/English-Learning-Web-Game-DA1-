-- =====================================================
-- Migration: Add Practice, Message, and Friendship tables
-- Date: 2024
-- =====================================================

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- 1. PRACTICE_TOPICS - Practice topic categories
-- =====================================================

DROP TABLE IF EXISTS practice_topics;

CREATE TABLE practice_topics (
  id CHAR(36) PRIMARY KEY,
  mode ENUM('listen-fill', 'listen-repeat', 'read-answer', 'read-story') NOT NULL,
  slug VARCHAR(100) NOT NULL,
  title VARCHAR(150) NOT NULL,
  description VARCHAR(500),
  emoji VARCHAR(50),
  color VARCHAR(100),
  image_url VARCHAR(500),
  order_index INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_mode_slug (mode, slug),
  INDEX idx_mode (mode),
  INDEX idx_active (is_active),
  INDEX idx_order (order_index)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 2. PRACTICE_ITEMS - Individual practice items per topic
-- =====================================================

DROP TABLE IF EXISTS practice_items;

CREATE TABLE practice_items (
  id CHAR(36) PRIMARY KEY,
  topic_id CHAR(36) NOT NULL,
  order_index INT DEFAULT 0,
  title VARCHAR(150),
  prompt VARCHAR(500),
  passage TEXT,
  image_url VARCHAR(500),
  audio_text TEXT COMMENT 'Text to be read aloud (for listen-repeat)',
  translation TEXT,
  content_data JSON COMMENT 'Flexible JSON for any mode-specific data',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (topic_id) REFERENCES practice_topics(id) ON DELETE CASCADE,
  UNIQUE KEY uk_topic_order (topic_id, order_index),
  INDEX idx_topic_id (topic_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 3. PRACTICE_PROGRESS - User progress per practice topic
-- =====================================================

DROP TABLE IF EXISTS practice_progress;

CREATE TABLE practice_progress (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  topic_id CHAR(36) NOT NULL,
  completed_items INT DEFAULT 0,
  total_items INT DEFAULT 0,
  best_score INT DEFAULT 0,
  attempts_count INT DEFAULT 0,
  last_attempt_at TIMESTAMP NULL,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (topic_id) REFERENCES practice_topics(id) ON DELETE CASCADE,
  UNIQUE KEY uk_user_topic (user_id, topic_id),
  INDEX idx_user_id (user_id),
  INDEX idx_topic_id (topic_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 4. PRACTICE_ATTEMPTS - Individual practice attempt records
-- =====================================================

DROP TABLE IF EXISTS practice_attempts;

CREATE TABLE practice_attempts (
  id CHAR(36) PRIMARY KEY,
  user_id CHAR(36) NOT NULL,
  topic_id CHAR(36) NOT NULL,
  mode ENUM('listen-fill', 'listen-repeat', 'read-answer', 'read-story') NOT NULL,
  score INT DEFAULT 0,
  correct_count INT DEFAULT 0,
  total_count INT DEFAULT 0,
  time_spent INT DEFAULT 0 COMMENT 'Seconds spent in this practice attempt',
  xp_earned INT DEFAULT 0,
  status ENUM('in-progress', 'completed', 'abandoned') DEFAULT 'in-progress',
  answers JSON COMMENT 'JSON array of user answers',
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (topic_id) REFERENCES practice_topics(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_topic_id (topic_id),
  INDEX idx_status (status),
  INDEX idx_started_at (started_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 5. FRIENDSHIPS - Friend relationships between users
-- =====================================================

DROP TABLE IF EXISTS friendships;

CREATE TABLE friendships (
  id CHAR(36) PRIMARY KEY,
  requester_id CHAR(36) NOT NULL,
  addressee_id CHAR(36) NOT NULL,
  status ENUM('pending', 'accepted') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (addressee_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY uk_requester_addressee (requester_id, addressee_id),
  INDEX idx_addressee_id (addressee_id),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- 6. DIRECT_MESSAGES - Direct messages between friends
-- =====================================================

DROP TABLE IF EXISTS direct_messages;

CREATE TABLE direct_messages (
  id CHAR(36) PRIMARY KEY,
  sender_id CHAR(36) NOT NULL,
  receiver_id CHAR(36) NOT NULL,
  type ENUM('text', 'image', 'voice') DEFAULT 'text',
  content TEXT NOT NULL,
  media_url VARCHAR(500),
  voice_duration INT COMMENT 'Duration in seconds for voice messages',
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_sender_receiver (sender_id, receiver_id, created_at),
  INDEX idx_receiver_read (receiver_id, read_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =====================================================
-- RE-ENABLE FOREIGN KEY CHECKS
-- =====================================================

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Migration 002: Practice, Message, Friendship tables created successfully!' AS status;
