-- Grammar content authored by admin (lesson type 'grammar').

ALTER TABLE lessons
  MODIFY COLUMN type ENUM('vocabulary', 'practice', 'test', 'grammar') NOT NULL;

CREATE TABLE IF NOT EXISTS grammar (
  id INT AUTO_INCREMENT PRIMARY KEY,
  unit_id INT NOT NULL,
  lesson_id INT NOT NULL,
  pattern VARCHAR(255) NOT NULL,
  explanation TEXT NULL,
  example TEXT NULL,
  translation VARCHAR(500) NULL,
  order_index INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  INDEX idx_grammar_unit (unit_id),
  INDEX idx_grammar_lesson (lesson_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
