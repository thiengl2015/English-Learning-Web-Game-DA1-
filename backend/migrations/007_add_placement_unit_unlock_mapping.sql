-- =====================================================
-- Migration: Add unit unlock mapping to placement topics
-- Date: 2026-06-09
-- =====================================================

ALTER TABLE placement_topics
  ADD COLUMN unit_id INT DEFAULT NULL COMMENT 'Unit unlocked when this topic is mastered in placement' AFTER max_age,
  ADD COLUMN unit_order INT DEFAULT NULL COMMENT 'Display order aligned with unit order' AFTER unit_id;

ALTER TABLE placement_topics
  ADD CONSTRAINT fk_placement_topics_unit_id
  FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL;

CREATE INDEX idx_placement_topics_unit_order ON placement_topics(unit_order);

ALTER TABLE placement_test_sessions
  ADD COLUMN unlock_progress JSON DEFAULT NULL COMMENT 'Placement topic/unit unlock result' AFTER section_scores;

ALTER TABLE placement_test_sessions
  ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at;

SELECT 'Migration 007: Placement unit unlock mapping added successfully!' AS status;
