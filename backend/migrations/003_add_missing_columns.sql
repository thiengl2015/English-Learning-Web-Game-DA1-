-- =====================================================
-- Migration: Add missing columns to existing tables
-- Date: 2024
-- =====================================================

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- 1. Add subscription columns to users table
-- =====================================================

-- Helper: add column only if it doesn't exist
SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_SCHEMA = DATABASE()
                 AND TABLE_NAME = 'users'
                 AND COLUMN_NAME = 'premium_expires_at');
SET @sqlstmt := IF(@exist > 0, 'SELECT "Column already exists"',
                   'ALTER TABLE users ADD COLUMN premium_expires_at TIMESTAMP NULL COMMENT ''Subscription expiry date'' AFTER reset_token_expires');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_SCHEMA = DATABASE()
                 AND TABLE_NAME = 'users'
                 AND COLUMN_NAME = 'subscription_cancelled_at');
SET @sqlstmt := IF(@exist > 0, 'SELECT "Column already exists"',
                   'ALTER TABLE users ADD COLUMN subscription_cancelled_at TIMESTAMP NULL COMMENT ''When subscription was cancelled'' AFTER premium_expires_at');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- 2. Add subscription columns to payment_orders table
-- =====================================================

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_SCHEMA = DATABASE()
                 AND TABLE_NAME = 'payment_orders'
                 AND COLUMN_NAME = 'duration_months');
SET @sqlstmt := IF(@exist > 0, 'SELECT "Column already exists"',
                   'ALTER TABLE payment_orders ADD COLUMN duration_months INT NULL COMMENT ''Subscription duration in months'' AFTER package_type');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exist := (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
               WHERE TABLE_SCHEMA = DATABASE()
                 AND TABLE_NAME = 'payment_orders'
                 AND COLUMN_NAME = 'premium_expires_at');
SET @sqlstmt := IF(@exist > 0, 'SELECT "Column already exists"',
                   'ALTER TABLE payment_orders ADD COLUMN premium_expires_at TIMESTAMP NULL COMMENT ''Calculated expiry date after approval'' AFTER duration_months');
PREPARE stmt FROM @sqlstmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- =====================================================
-- RE-ENABLE FOREIGN KEY CHECKS
-- =====================================================

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Migration 003: Missing columns added successfully!' AS status;
