-- =====================================================
-- Migration: Add missing columns to existing tables
-- Date: 2024
-- =====================================================

SET FOREIGN_KEY_CHECKS = 0;

-- =====================================================
-- 1. Add subscription columns to users table
-- =====================================================

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMP NULL COMMENT 'Subscription expiry date' AFTER reset_token_expires,
  ADD COLUMN IF NOT EXISTS subscription_cancelled_at TIMESTAMP NULL COMMENT 'When subscription was cancelled' AFTER premium_expires_at;

-- =====================================================
-- 2. Add subscription columns to payment_orders table
-- =====================================================

ALTER TABLE payment_orders
  ADD COLUMN IF NOT EXISTS duration_months INT NULL COMMENT 'Subscription duration in months' AFTER package_type,
  ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMP NULL COMMENT 'Calculated expiry date after approval' AFTER duration_months;

-- =====================================================
-- RE-ENABLE FOREIGN KEY CHECKS
-- =====================================================

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Migration 003: Missing columns added successfully!' AS status;
