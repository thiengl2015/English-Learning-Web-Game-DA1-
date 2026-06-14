/**
 * proofread.routes.js — Proofread API Routes
 * =======================================
 * 
 * Base path: /api/proofread
 */

'use strict';

const express = require('express');
const router = express.Router();

const {
  proofreadImage,
  proofreadText,
  ocrOnly,
  uploadProofread,
  handleUploadError
} = require('../controllers/proofread.controller');

// ═══════════════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/proofread
 * Upload image → OCR → AI Proofread → Return annotated result
 * 
 * Content-Type: multipart/form-data
 * Fields:
 *   - image (file, required): Handwriting image
 *   - language (string, optional): 'vietnamese' | 'english' (default: 'vietnamese')
 *   - level (string, optional): 'beginner' | 'intermediate' | 'advanced' (default: 'intermediate')
 */
router.post(
  '/',
  uploadProofread.single('image'),
  handleUploadError,
  proofreadImage
);

/**
 * POST /api/proofread/text
 * Proofread already-extracted text (skip OCR)
 * 
 * Content-Type: application/json
 * Body:
 *   {
 *     "text": "string",
 *     "language": "vietnamese" | "english",
 *     "level": "beginner" | "intermediate" | "advanced"
 *   }
 */
router.post('/text', proofreadText);

/**
 * POST /api/proofread/ocr
 * OCR only (no proofreading) - useful for testing OCR
 * 
 * Content-Type: multipart/form-data
 * Fields:
 *   - image (file, required): Image to OCR
 */
router.post(
  '/ocr',
  uploadProofread.single('image'),
  handleUploadError,
  ocrOnly
);

module.exports = router;
