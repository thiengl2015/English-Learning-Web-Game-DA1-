/**
 * pdfExtractorWrapper.js — Unified PDF extraction for all skills
 * ============================================================
 * 
 * Wrapper này đảm bảo tất cả skills (reading, listening, writing, speaking)
 * đều sử dụng cùng một pipeline OCR với table/map detection.
 * 
 * Features:
 * - Table detection & cropping to images
 * - Map detection & cropping to images  
 * - Diagram extraction
 * - Scanned page detection
 * - Fallback chain: OCR → pdf-parse → pdfjs-dist → raw-scan
 * 
 * Usage:
 *   const { extractPages, computeHashes } = require('./pdfExtractorWrapper');
 *   const result = await extractPages(pdfBuffer);
 */

'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const util = require('util');
const execFileAsync = util.promisify(execFile);
const pdfExtractorV2 = require('./pdfExtractorV2');

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const DEFAULT_OPTIONS = {
  // Force OCR mode (for scanned PDFs)
  useOcr: true,
  
  // Use V2 extractor with full features (default: true)
  useV2: true,
  
  // Language for OCR (default: en)
  lang: 'en',
};

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXTRACTION FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Extract pages from PDF with OCR support
 * 
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @param {Object} options - Extraction options
 * @param {boolean} options.useOcr - Use OCR (default: true)
 * @param {boolean} options.useV2 - Use V2 extractor (default: true)
 * @param {string} options.lang - Language code (default: 'en')
 * @returns {Promise<{pages: Array, fullText: string, meta: Object}>}
 */
async function extractPages(pdfBuffer, options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let tempFilePath = '';
  
  try {
    // Validate buffer
    if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer)) {
      throw new Error('Invalid PDF buffer');
    }
    
    const tempDir = os.tmpdir();
    tempFilePath = path.join(tempDir, `extract_${Date.now()}_${Math.random().toString(36).substring(7)}.pdf`);
    await fs.promises.writeFile(tempFilePath, pdfBuffer);

    const scriptPath = path.join(__dirname, 'pythonPdfExtractor.py');

    // Find Python interpreter
    const venvPython = path.join(__dirname, '..', '..', '.venv', process.platform === 'win32' ? 'Scripts' : 'bin', process.platform === 'win32' ? 'python.exe' : 'python');
    let pythonExe = null;

    if (fs.existsSync(venvPython)) {
      pythonExe = venvPython;
    } else {
      const candidates = process.platform === 'win32'
        ? ['py', 'python3', 'python']
        : ['python3', 'python'];
      for (const candidate of candidates) {
        try {
          await execFileAsync(candidate, ['--version'], { timeout: 5000 });
          pythonExe = candidate;
          break;
        } catch (_) { /* try next */ }
      }
    }

    if (!pythonExe) {
      throw new Error('No Python interpreter found');
    }

    // Use segmenter-v2 for image-text parsing (reading/writing/speaking)
    const { stdout, stderr } = await execFileAsync(
      pythonExe,
      [scriptPath, tempFilePath, '--segmenter-v2', '--dpi', '200'],
      { maxBuffer: 100 * 1024 * 1024 }
    );

    if (stderr) {
      console.warn('[extractPages] Python stderr:', stderr.slice(0, 500));
    }

    const result = JSON.parse(stdout);

    if (!result.success) {
      throw new Error(result.errors?.[0]?.err || 'Extraction failed');
    }

    return {
      pages: result.pages || [],
      fullText: result.fullText || '',
      meta: result.metadata || {},
      segmentCount: result.segmentCount || 0,
      pageCount: result.pageCount || 0,
    };
  } catch (err) {
    console.error('[extractPages] Extraction failed:', err.message);
    throw err;
  } finally {
    if (tempFilePath) {
      try {
        await fs.promises.unlink(tempFilePath);
      } catch (_) { /* ignore */ }
    }
  }
}

/**
 * Compute content hashes for caching/deduplication
 */
function computeHashes(pdfBuffer, text) {
  const crypto = require('crypto');
  const sha256 = crypto.createHash('sha256').update(pdfBuffer).digest('hex');
  const md5 = crypto.createHash('md5').update(pdfBuffer).digest('hex');
  const contentHash = crypto.createHash('sha256').update(text || '').digest('hex');
  return { sha256, md5, contentHash };
}

/**
 * Extract listening segments from PDF using Python segmenter
 * Uses --listening-segments which returns proper segments with fallback for standalone question numbers
 * Returns segments with both images (segmentImage) and text for AI parsing
 */
async function extractListeningSegments(pdfBuffer, options = {}) {
  return _extractListeningSegments(pdfBuffer, options, 'listening-segments');
}

/**
 * Extract listening text from PDF using Python segmenter (for TEXT extraction only)
 * Uses --listening-segments which returns proper text with standalone number fallback
 * Use this when you only need text (e.g., extracting answers from answer key)
 * Note: This is now an alias to extractListeningSegments since both return images+text
 */
async function extractListeningText(pdfBuffer, options = {}) {
  return _extractListeningSegments(pdfBuffer, options, 'listening-segments');
}

/**
 * Internal function for listening segment/text extraction
 */
async function _extractListeningSegments(pdfBuffer, options = {}, flag) {
  const { dpi = 200, lazyPages = true } = options;
  let tempFilePath = '';
  const errors = [];

  try {
    const tempDir = os.tmpdir();
    tempFilePath = path.join(tempDir, `listening_${Date.now()}_${Math.random().toString(36).substring(7)}.pdf`);
    await fs.promises.writeFile(tempFilePath, pdfBuffer);

    const scriptPath = path.join(__dirname, 'pythonPdfExtractor.py');

    const venvPython = path.join(__dirname, '..', '..', '.venv', process.platform === 'win32' ? 'Scripts' : 'bin', process.platform === 'win32' ? 'python.exe' : 'python');
    let pythonExe = null;

    if (fs.existsSync(venvPython)) {
      pythonExe = venvPython;
      console.log(`[extractListening${flag === 'segmenter-v2' ? 'Segments' : 'Text'}] Using .venv Python: ${venvPython}`);
    } else {
      const candidates = process.platform === 'win32'
        ? ['py', 'python3', 'python']
        : ['python3', 'python'];
      for (const candidate of candidates) {
        try {
          await execFileAsync(candidate, ['--version'], { timeout: 5000 });
          pythonExe = candidate;
          break;
        } catch (_) { /* try next */ }
      }
    }

    if (!pythonExe) {
      throw new Error(`No Python interpreter found`);
    }

    const { stdout, stderr } = await execFileAsync(
      pythonExe,
      [scriptPath, tempFilePath, `--${flag}`, '--dpi', String(dpi), '--lazy-pages', String(lazyPages)],
      { maxBuffer: 100 * 1024 * 1024 }
    );

    if (stderr) {
      console.warn(`[extractListening${flag === 'segmenter-v2' ? 'Segments' : 'Text'}] Python stderr:`, stderr.slice(0, 500));
    }

    const result = JSON.parse(stdout);

    if (!result.success) {
      return {
        success: false,
        segments: [],
        fullDocPages: [],
        errors: result.errors || [{ step: 'python', err: 'Unknown error' }],
      };
    }

    return {
      success: true,
      segments: result.segments || [],
      fullDocPages: result.fullDocPages || [],
      pageCount: result.pageCount || 0,
      segmentCount: result.segmentCount || 0,
      metadata: result.metadata || {},
      errors: [],
    };
  } catch (err) {
    return {
      success: false,
      segments: [],
      fullDocPages: [],
      errors: [{ step: 'extractListeningText', err: err.message }],
    };
  } finally {
    if (tempFilePath) {
      try {
        await fs.promises.unlink(tempFilePath);
      } catch (_) { /* ignore */ }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Validate PDF buffer
 */
function validatePdfBuffer(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    return { valid: false, reason: 'Input is not a Buffer' };
  }

  const MIN_SIZE = 512;
  const MAX_SIZE = 200 * 1024 * 1024;

  if (buffer.length < MIN_SIZE) {
    return { valid: false, reason: `File too small (${buffer.length} bytes < ${MIN_SIZE} bytes minimum)` };
  }

  if (buffer.length > MAX_SIZE) {
    return { valid: false, reason: `File too large (${(buffer.length / 1024 / 1024).toFixed(1)}MB > 200MB limit)` };
  }

  return { valid: true };
}

/**
 * Extract writing sections from PDF using Python segmenter (Task 1 / Task 2)
 */
async function extractWritingSegments(pdfBuffer, options = {}) {
  return _extractGenericSegments(pdfBuffer, options, 'writing-segments');
}

/**
 * Extract speaking sections from PDF using Python segmenter (Part 1 / Part 2 / Part 3)
 */
async function extractSpeakingSegments(pdfBuffer, options = {}) {
  return _extractGenericSegments(pdfBuffer, options, 'speaking-segments');
}

/**
 * Internal function for writing/speaking segment extraction
 */
async function _extractGenericSegments(pdfBuffer, options = {}, flag) {
  const { dpi = 200, lazyPages = true } = options;
  let tempFilePath = '';
  const errors = [];

  try {
    const tempDir = os.tmpdir();
    tempFilePath = path.join(tempDir, `generic_${Date.now()}_${Math.random().toString(36).substring(7)}.pdf`);
    await fs.promises.writeFile(tempFilePath, pdfBuffer);

    const scriptPath = path.join(__dirname, 'pythonPdfExtractor.py');

    const venvPython = path.join(__dirname, '..', '..', '.venv', process.platform === 'win32' ? 'Scripts' : 'bin', process.platform === 'win32' ? 'python.exe' : 'python');
    let pythonExe = null;

    if (fs.existsSync(venvPython)) {
      pythonExe = venvPython;
    } else {
      const candidates = process.platform === 'win32'
        ? ['py', 'python3', 'python']
        : ['python3', 'python'];
      for (const candidate of candidates) {
        try {
          await execFileAsync(candidate, ['--version'], { timeout: 5000 });
          pythonExe = candidate;
          break;
        } catch (_) { /* try next */ }
      }
    }

    if (!pythonExe) {
      throw new Error(`No Python interpreter found`);
    }

    const { stdout, stderr } = await execFileAsync(
      pythonExe,
      [scriptPath, tempFilePath, `--${flag}`, '--dpi', String(dpi), '--lazy-pages', String(lazyPages)],
      { maxBuffer: 100 * 1024 * 1024 }
    );

    if (stderr) {
      console.warn(`[_extractGenericSegments] Python stderr:`, stderr.slice(0, 500));
    }

    const result = JSON.parse(stdout);

    if (!result.success) {
      return {
        success: false,
        segments: [],
        fullDocPages: [],
        errors: result.errors || [{ step: 'python', err: 'Unknown error' }],
      };
    }

    return {
      success: true,
      segments: result.segments || [],
      fullDocPages: result.fullDocPages || [],
      pageCount: result.pageCount || 0,
      segmentCount: result.segmentCount || 0,
      metadata: result.metadata || {},
      errors: [],
    };
  } catch (err) {
    return {
      success: false,
      segments: [],
      fullDocPages: [],
      errors: [{ step: '_extractGenericSegments', err: err.message }],
    };
  } finally {
    if (tempFilePath) {
      try {
        await fs.promises.unlink(tempFilePath);
      } catch (_) { /* ignore */ }
    }
  }
}

/**
 * Extract all images from pages
 */
function extractAllImages(pages) {
  const images = [];
  
  for (const page of pages) {
    // Tables
    if (page.tableImages?.length) {
      for (const table of page.tableImages) {
        images.push({
          pageIndex: page.pageIndex,
          type: 'table',
          image: table.image,
          bbox: table.bbox,
          label: `Table ${table.row_count || 0}x${table.col_count || 0}`,
        });
      }
    }
    
    // Maps
    if (page.mapImages?.length) {
      for (const map of page.mapImages) {
        images.push({
          pageIndex: page.pageIndex,
          type: 'map',
          image: map.image,
          bbox: map.bbox,
          label: map.label || 'Map',
        });
      }
    }
    
    // Diagrams
    if (page.diagramCrops?.length) {
      for (let i = 0; i < page.diagramCrops.length; i++) {
        images.push({
          pageIndex: page.pageIndex,
          type: 'diagram',
          image: page.diagramCrops[i],
          bbox: null,
          label: `Diagram ${i + 1}`,
        });
      }
    }
  }
  
  return images;
}

/**
 * Get extraction statistics
 */
function getExtractionStats(pages) {
  return {
    totalPages: pages.length,
    totalTables: pages.reduce((sum, p) => sum + (p.tableImages?.length || 0), 0),
    totalMaps: pages.reduce((sum, p) => sum + (p.mapImages?.length || 0), 0),
    totalDiagrams: pages.reduce((sum, p) => sum + (p.diagramCrops?.length || 0), 0),
    totalImages: pages.reduce((sum, p) => sum + (p.imageCount || 0), 0),
    scannedPages: pages.filter(p => p.metadata?.isScanned).length,
    ocrRecommended: pages.filter(p => p.metadata?.ocrRecommended).length,
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  // Main functions
  extractPages,
  extractListeningSegments,
  extractListeningText,
  extractWritingSegments,
  extractSpeakingSegments,
  computeHashes,
  validatePdfBuffer,

  // Utilities
  extractAllImages,
  getExtractionStats,

  // Direct access to underlying extractors (for advanced usage)
  extractors: {
    v2: pdfExtractorV2,
  },

  // Constants
  DEFAULT_OPTIONS,
};
