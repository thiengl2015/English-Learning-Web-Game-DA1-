-- =====================================================
-- Migration: Add badge and medal columns to missions table
-- Date: 2024
-- =====================================================

SET FOREIGN_KEY_CHECKS = 0;

ALTER TABLE missions
  ADD COLUMN IF NOT EXISTS badge VARCHAR(255) NULL COMMENT 'Badge name/image for achievement display' AFTER xp_reward,
  ADD COLUMN IF NOT EXISTS medal VARCHAR(50) NULL COMMENT 'Medal type: bronze, silver, gold, platinum' AFTER badge;

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Migration 004: Badge and medal columns added to missions!' AS status;
