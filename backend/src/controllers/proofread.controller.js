/**
 * proofread.controller.js — Proofread API Controller
 * =================================================
 * 
 * Endpoints:
 * POST /api/proofread - Upload image and get proofread result
 * GET  /api/proofread/ocr/:id - Get OCR result only
 */

'use strict';

const proofreadService = require('../services/proofread.service');

// ═══════════════════════════════════════════════════════════════════════════════
// UPLOAD MIDDLEWARE (Inline - or use existing upload.middleware.js)
// ═══════════════════════════════════════════════════════════════════════════════

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const proofreadStorage = multer.memoryStorage();

const proofreadFileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (jpg, png, gif, webp) are allowed'), false);
  }
};

const uploadProofread = multer({
  storage: proofreadStorage,
  fileFilter: proofreadFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max
  },
});

// ═══════════════════════════════════════════════════════════════════════════════
// CONTROLLER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/proofread
 * Upload image and get proofread result
 * 
 * Body (multipart/form-data):
 *   - image: Image file (required)
 *   - language: 'vietnamese' | 'english' (default: 'vietnamese')
 *   - level: 'beginner' | 'intermediate' | 'advanced' (default: 'intermediate')
 * 
 * Response:
 *   {
 *     success: true,
 *     ocr: { text, confidence, method, geminiUsed },
 *     result: { originalText, correctedText, score, grade, words, sentences, summary, feedback },
 *     processingTime: number
 *   }
 */
async function proofreadImage(req, res) {
  try {
    // Validate upload
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded'
      });
    }

    const imageBuffer = req.file.buffer;
    const options = {
      language: req.body.language || 'vietnamese',
      level: req.body.level || 'intermediate',
      geminiApiKey: req.body.geminiApiKey || process.env.GEMINI_API_KEY,
      originalFilename: req.file.originalname
    };

    console.log(`[proofread.controller] Processing image: ${req.file.originalname} (${req.file.size} bytes)`);

    // Call proofread service
    const result = await proofreadService.proofreadImage(imageBuffer, options);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Proofread failed',
        errors: result.errors,
        ocr: result.ocr // Include OCR info even if proofread failed
      });
    }

    // Success response
    return res.status(200).json({
      success: true,
      message: 'Proofread completed',
      data: {
        ocr: result.ocr,
        proofread: {
          originalText: result.result.originalText,
          correctedText: result.result.correctedText,
          score: result.result.score,
          grade: result.result.grade,
          words: result.result.words,
          sentences: result.result.sentences,
          summary: result.result.summary,
          feedback: result.result.feedback
        },
        processingTime: result.processingTime,
        timestamp: result.timestamp
      }
    });

  } catch (err) {
    console.error('[proofread.controller] Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message
    });
  }
}

/**
 * POST /api/proofread/text
 * Proofread already-extracted text (skip OCR)
 * 
 * Body (JSON):
 *   {
 *     "text": "text to proofread",
 *     "language": "vietnamese",
 *     "level": "intermediate"
 *   }
 */
async function proofreadText(req, res) {
  try {
    const { text, language, level } = req.body;

    if (!text || typeof text !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }

    const options = {
      language: language || 'vietnamese',
      level: level || 'intermediate'
    };

    console.log(`[proofread.controller] Proofreading text: ${text.length} chars`);

    const result = await proofreadService.proofreadText(text, options);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Proofread failed',
        error: result.error
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Proofread completed',
      data: {
        originalText: result.result.originalText,
        correctedText: result.result.correctedText,
        score: result.result.score,
        grade: result.result.grade,
        words: result.result.words,
        sentences: result.result.sentences,
        summary: result.result.summary,
        feedback: result.result.feedback,
        processingTime: result.processingTime
      }
    });

  } catch (err) {
    console.error('[proofread.controller] Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message
    });
  }
}

/**
 * POST /api/proofread/ocr
 * OCR only (no proofreading)
 * 
 * Body (multipart/form-data):
 *   - image: Image file (required)
 */
async function ocrOnly(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file uploaded'
      });
    }

    const imageBuffer = req.file.buffer;
    const geminiApiKey = req.body.geminiApiKey || process.env.GEMINI_API_KEY;

    console.log(`[proofread.controller] OCR only: ${req.file.originalname}`);

    const result = await proofreadService.ocrOnly(
      imageBuffer,
      geminiApiKey,
      req.file.originalname
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'OCR failed',
        error: result.error
      });
    }

    return res.status(200).json({
      success: true,
      message: 'OCR completed',
      data: {
        text: result.text,
        confidence: result.confidence,
        method: result.method,
        geminiUsed: result.geminiUsed
      }
    });

  } catch (err) {
    console.error('[proofread.controller] OCR error:', err);
    return res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: err.message
    });
  }
}

/**
 * Error handler for multer
 */
function handleUploadError(err, req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File too large. Maximum size is 10MB'
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`
    });
  }

  if (err) {
    return res.status(400).json({
      success: false,
      message: err.message
    });
  }

  next();
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  proofreadImage,
  proofreadText,
  ocrOnly,
  uploadProofread,
  handleUploadError
};
