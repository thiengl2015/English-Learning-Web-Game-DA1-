-- =====================================================
-- Migration: Add badge and medal columns to missions table
-- Date: 2024
-- =====================================================

SET FOREIGN_KEY_CHECKS = 0;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_SCHEMA = DATABASE()
                 AND TABLE_NAME = 'missions'
                 AND COLUMN_NAME = 'badge');
SET @sqlstmt := IF(@exist > 0, 'SELECT "Column badge already exists"',
                   'ALTER TABLE missions ADD COLUMN badge VARCHAR(255) NULL COMMENT ''Badge name/image for achievement display'' AFTER xp_reward');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_SCHEMA = DATABASE()
                 AND TABLE_NAME = 'missions'
                 AND COLUMN_NAME = 'medal');
SET @sqlstmt := IF(@exist > 0, 'SELECT "Column medal already exists"',
                   'ALTER TABLE missions ADD COLUMN medal VARCHAR(50) NULL COMMENT ''Medal type: bronze, silver, gold, platinum'' AFTER badge');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Migration 004: Badge and medal columns added to missions!' AS status;
