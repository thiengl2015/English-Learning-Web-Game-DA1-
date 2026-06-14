/**
 * ocrExtractor.js — Standalone OCR extraction module
 * ==================================================
 * 
 * Tách riêng để không ảnh hưởng các skill khác (listening, writing, speaking).
 * Chỉ sử dụng cho Reading khi cần OCR trên scanned documents.
 * 
 * Features:
 * - Table detection & cropping to images
 * - Map detection & cropping to images
 * - Diagram extraction
 * - Scanned page detection
 * - Hybrid OCR: PaddleOCR + Gemini Flash 3.5
 * 
 * Dependencies: 
 *   - pythonPdfExtractor.py (default, local processing)
 *   - hybridOcrGemini.py (optional, hybrid PaddleOCR + Gemini)
 * 
 * Usage:
 *   const { extractWithOcr } = require('./ocrExtractor');
 *   const result = await extractWithOcr(pdfBuffer);
 *   
 *   // Or with Gemini fallback:
 *   const { extractWithHybridOcr } = require('./ocrExtractor');
 *   const result = await extractWithHybridOcr(pdfBuffer);
 */

'use strict';

const { execFile } = require('child_process');
const util = require('util');
const execFileAsync = util.promisify(execFile);
const fs = require('fs');
const path = require('path');
const os = require('os');

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  scriptPath: path.join(__dirname, 'pythonPdfExtractor.py'),
  maxBuffer: 100 * 1024 * 1024, // 100MB
  tempDir: os.tmpdir(),
  pythonCandidates: process.platform === 'win32'
    ? ['py', 'python3', 'python']
    : ['python3', 'python'],
};

// ═══════════════════════════════════════════════════════════════════════════════
// PYTHON INTERPRETER DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

async function findPythonInterpreter() {
  // Prefer .venv if present (where packages are installed)
  const venvPython = path.join(__dirname, '..', '..', '.venv', process.platform === 'win32' ? 'Scripts' : 'bin', process.platform === 'win32' ? 'python.exe' : 'python');
  if (fs.existsSync(venvPython)) {
    return venvPython;
  }
  for (const candidate of CONFIG.pythonCandidates) {
    try {
      await execFileAsync(candidate, ['--version'], { timeout: 5000 });
      return candidate;
    } catch {
      // Continue trying
    }
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN EXTRACTION FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Extract PDF content với table/map/diagram detection
 * 
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @param {Object} options
 * @param {string} options.tempDir - Override temp directory
 * @returns {Promise<{pages: Array, errors: Array, success: boolean}>}
 */
async function extractWithOcr(pdfBuffer, options = {}) {
  const errors = [];
  let tempFilePath = '';
  
  try {
    // Find Python interpreter
    const pythonExe = await findPythonInterpreter();
    if (!pythonExe) {
      errors.push({
        step: 'python-detection',
        err: 'No Python interpreter found'
      });
      return { pages: [], errors, success: false };
    }

    // Write PDF to temp file
    const tempDir = options.tempDir || CONFIG.tempDir;
    tempFilePath = path.join(
      tempDir,
      `ocr_extract_${Date.now()}_${Math.random().toString(36).substring(7)}.pdf`
    );
    await fs.promises.writeFile(tempFilePath, pdfBuffer);

    console.log(`[ocrExtractor] Using Python: ${pythonExe}`);

    // Execute Python script
    const { stdout, stderr } = await execFileAsync(
      pythonExe,
      [CONFIG.scriptPath, tempFilePath],
      { maxBuffer: CONFIG.maxBuffer }
    );

    // Filter stderr - only log actual errors, not warnings
    if (stderr) {
      const errorLines = stderr.split('\n')
        .filter(line => line.trim() && !line.includes('WARNING') && !line.includes('table detection error'))
        .join('\n');
      if (errorLines) {
        console.warn('[ocrExtractor] Python stderr:', errorLines.slice(0, 500));
      }
    }

    // Find JSON start in stdout (skip any stderr text that might be mixed)
    let jsonStart = stdout.indexOf('{');
    let jsonText = jsonStart >= 0 ? stdout.slice(jsonStart) : stdout;

    // Parse result
    let result;
    try {
      result = JSON.parse(jsonText);
    } catch (parseErr) {
      // Try to extract just the JSON part
      const jsonEnd = jsonText.lastIndexOf('}');
      if (jsonEnd > jsonStart) {
        try {
          result = JSON.parse(jsonText.slice(0, jsonEnd + 1));
        } catch {
          errors.push({ step: 'json-parse', err: `JSON parse failed: ${parseErr.message}` });
          console.error('[ocrExtractor] JSON parse failed:', parseErr.message);
          console.error('[ocrExtractor] Raw output:', jsonText.slice(0, 200));
          return { pages: [], errors, success: false };
        }
      } else {
        errors.push({ step: 'json-parse', err: `JSON parse failed: ${parseErr.message}` });
        console.error('[ocrExtractor] JSON parse failed:', parseErr.message);
        return { pages: [], errors, success: false };
      }
    }
    
    if (!result.success) {
      errors.push(...(result.errors || [{ step: 'python-script', err: 'Extraction failed' }]));
      return { pages: [], errors, success: false };
    }

    // Normalize pages to include tableImages and mapImages
    const pages = (result.pages || []).map(normalizePage);

    // Log summary
    const tableCount = pages.reduce((sum, p) => sum + (p.tableImages?.length || 0), 0);
    const mapCount = pages.reduce((sum, p) => sum + (p.mapImages?.length || 0), 0);
    const diagramCount = pages.reduce((sum, p) => sum + (p.diagramCrops?.length || 0), 0);
    
    console.log(`[ocrExtractor] Extracted: ${pages.length} pages`);
    console.log(`[ocrExtractor] Tables: ${tableCount}, Maps: ${mapCount}, Diagrams: ${diagramCount}`);

    return {
      pages,
      errors,
      success: true,
      summary: {
        totalPages: pages.length,
        totalTables: tableCount,
        totalMaps: mapCount,
        totalDiagrams: diagramCount,
      }
    };

  } catch (err) {
    errors.push({ step: 'ocr-extraction', err: err.message });
    console.error('[ocrExtractor] Extraction failed:', err.message);
    return { pages: [], errors, success: false };

  } finally {
    // Cleanup temp file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        await fs.promises.unlink(tempFilePath);
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}

/**
 * Normalize page data to include tableImages and mapImages
 */
function normalizePage(page) {
  return {
    pageIndex: page.pageIndex,
    text: page.text || '',
    imageCount: page.imageCount || 0,
    diagramCrops: page.diagramCrops || [],
    tableImages: page.tableImages || [],  // Table regions as cropped images
    mapImages: page.mapImages || [],     // Map/diagram regions as cropped images
    metadata: {
      isScanned: page.metadata?.isScanned || false,
      ocrRecommended: page.metadata?.ocrRecommended || false,
      textDensity: page.metadata?.textDensity || 0,
      hasTables: page.metadata?.hasTables || false,
      hasMaps: page.metadata?.hasMaps || false,
      tableCount: page.metadata?.tableCount || 0,
      mapCount: page.metadata?.mapCount || 0,
      isMultiColumn: page.metadata?.isMultiColumn || false,
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE QUALITY ASSESSMENT (for routing)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Assess if a page needs Vision OCR or can use text extraction
 */
function assessPageQuality(page, imageCount = 0, ocrRecommended = false, pageMeta = {}) {
  const text = page.text || '';
  const t = text.trim();
  
  if (!t.length) {
    return { qualityScore: 0, route: 'vision', hasLayoutIssues: false };
  }

  const wordCount = t.split(/\s+/).length;
  const avgWordLen = wordCount > 0 ? t.length / wordCount : 0;
  
  const hasQuestionPattern = /(?:^|\n)\s*\d{1,3}\s*[.)]\s/m.test(t);
  const hasOptions = /\b[A-D]\s*[.)]\s/m.test(t);
  const hasTFNG = /\b(TRUE|FALSE|NOT\s*GIVEN|YES|NO)\b/i.test(t);
  const hasIeltsKeywords = /\b(question|section|passage|reading|choose|match)\b/i.test(t);
  
  const noiseChars = (t.match(/[^a-zA-Z0-9\s.,;:!?'"()\-–—_]/g) || []).length;
  const noiseRatio = noiseChars / t.length;

  let qualityScore = 0;
  if (t.length >= 200) qualityScore += 0.2;
  else if (t.length >= 50) qualityScore += 0.1;
  if (hasQuestionPattern) qualityScore += 0.2;
  if (hasOptions || hasTFNG) qualityScore += 0.15;
  if (hasIeltsKeywords) qualityScore += 0.2;
  if (noiseRatio < 0.05) qualityScore += 0.15;
  else if (noiseRatio < 0.15) qualityScore += 0.05;
  if (avgWordLen >= 3 && avgWordLen <= 12) qualityScore += 0.1;
  qualityScore = Math.max(0, Math.min(qualityScore, 1.0));

  const hasTableStructure = (page.tableImages?.length || 0) > 0;
  const hasLayoutIssues = hasTableStructure;

  let route = 'text';
  if (t.length === 0 || ocrRecommended || (pageMeta.isScanned && imageCount > 0)) {
    route = 'vision';
  } else if (imageCount > 0 && qualityScore < 0.3) {
    route = 'vision';
  }

  return {
    qualityScore,
    route,
    hasLayoutIssues,
    features: {
      imageCount,
      hasQuestionPattern,
      hasOptions,
      hasTFNG,
      hasIeltsKeywords,
      noiseRatio: +noiseRatio.toFixed(3),
      avgWordLen: +avgWordLen.toFixed(1),
      hasTableStructure,
      wordCount,
      charCount: t.length,
    },
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// BOUNDARY DETECTION
// ═══════════════════════════════════════════════════════════════════════════════

const BOUNDARY_PATTERNS = [
  { regex: /\b(?:SECTION|Section)\s+(\d+)/i, type: 'new_section' },
  { regex: /\b(?:PASSAGE|Passage|READING PASSAGE)\s+(\d+)/i, type: 'new_section' },
  { regex: /\b(?:PART|Part)\s+(\d+)/i, type: 'new_section' },
  { regex: /\b(?:LISTENING|READING|WRITING|SPEAKING)\b/, type: 'new_section' },
  { regex: /\bTask\s+[12]\b/i, type: 'new_section' },
  { regex: /\bQuestions?\s+(\d+)\s*[–-]\s*(\d+)/i, type: 'new_group' },
];

function detectBoundary(pageText) {
  if (!pageText) return { type: null, confidence: 0, match: null };
  const header = pageText.trim().slice(0, 300);
  for (const pattern of BOUNDARY_PATTERNS) {
    const m = header.match(pattern.regex);
    if (m) return { type: pattern.type, confidence: 0.9, match: m[0] };
  }
  return { type: null, confidence: 0.3, match: null };
}

// ═══════════════════════════════════════════════════════════════════════════════
// BUILD PAGE INFO (for parser consumption)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build PageInfo array với table/map metadata
 */
function buildPageInfos(rawPages, strategy = 'ocr', errors = []) {
  const pages = rawPages.map(pt => {
    const pageMeta = pt.metadata || {};
    const ocrRecommended = pageMeta.ocrRecommended || false;
    const isScanned = pageMeta.isScanned || false;

    const quality = assessPageQuality(
      pt,
      pt.imageCount || 0,
      ocrRecommended,
      { isScanned, textDensity: pageMeta.textDensity }
    );

    const boundary = detectBoundary(pt.text);

    return {
      pageIndex: pt.pageIndex,
      text: pt.text || '',
      qualityScore: quality.qualityScore,
      route: quality.route,
      hasLayoutIssues: quality.hasLayoutIssues,
      detectedBoundary: boundary,
      features: quality.features,
      image: null,
      imageCount: pt.imageCount || 0,
      diagramCrops: pt.diagramCrops || [],
      tableImages: pt.tableImages || [],
      mapImages: pt.mapImages || [],
      _ocrRecommended: ocrRecommended,
      _isScanned: isScanned,
      _textDensity: pageMeta.textDensity || 0,
    };
  });

  const visionPages = pages.filter(p => p.route === 'vision');
  if (visionPages.length > 0) {
    console.info(`[ocrExtractor] Pages routed to VISION: ${visionPages.map(p => `p${p.pageIndex}`).join(', ')}`);
  }

  const fullText = pages.map(p => p.text).join('\n\n');
  const meta = {
    strategy,
    pageCount: pages.length,
    textLength: fullText.length,
    errors,
    visionPageCount: visionPages.length,
    textPageCount: pages.length - visionPages.length,
    totalTables: pages.reduce((sum, p) => sum + (p.tableImages?.length || 0), 0),
    totalMaps: pages.reduce((sum, p) => sum + (p.mapImages?.length || 0), 0),
    totalDiagrams: pages.reduce((sum, p) => sum + (p.diagramCrops?.length || 0), 0),
  };

  return { pages, fullText, meta };
}

// ═══════════════════════════════════════════════════════════════════════════════
// CONVENIENCE FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Check if OCR module is available (Python installed)
 */
async function isAvailable() {
  const pythonExe = await findPythonInterpreter();
  if (!pythonExe) return false;
  
  try {
    await fs.promises.access(CONFIG.scriptPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract only images (tables, maps, diagrams) from a page
 */
function extractPageImages(page) {
  const images = [];
  
  // Tables
  if (page.tableImages?.length) {
    for (const table of page.tableImages) {
      images.push({
        type: 'table',
        image: table.image,
        bbox: table.bbox,
        label: `Table (${table.row_count}x${table.col_count})`,
      });
    }
  }
  
  // Maps
  if (page.mapImages?.length) {
    for (const map of page.mapImages) {
      images.push({
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
        type: 'diagram',
        image: page.diagramCrops[i],
        bbox: null,
        label: `Diagram ${i + 1}`,
      });
    }
  }
  
  return images;
}

// ═══════════════════════════════════════════════════════════════════════════════
// HYBRID OCR (PaddleOCR + Gemini)
// ═══════════════════════════════════════════════════════════════════════════════

const HYBRID_CONFIG = {
  scriptPath: path.join(__dirname, 'hybridOcrGemini.py'),
};

/**
 * Check if hybrid OCR script is available
 */
async function isHybridAvailable() {
  const pythonExe = await findPythonInterpreter();
  if (!pythonExe) return false;
  
  try {
    await fs.promises.access(HYBRID_CONFIG.scriptPath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Extract PDF using Hybrid OCR (PaddleOCR → Gemini fallback)
 * 
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @param {Object} options
 * @param {string} options.geminiApiKey - Gemini API key (or set GEMINI_API_KEY env)
 * @param {boolean} options.useGemini - Force use Gemini (skip PaddleOCR check)
 * @returns {Promise<{pages: Array, errors: Array, success: boolean, stats: Object}>}
 */
async function extractWithHybridOcr(pdfBuffer, options = {}) {
  const errors = [];
  let tempFilePath = '';
  
  try {
    // Find Python interpreter
    const pythonExe = await findPythonInterpreter();
    if (!pythonExe) {
      errors.push({
        step: 'python-detection',
        err: 'No Python interpreter found'
      });
      return { pages: [], errors, success: false };
    }

    // Write PDF to temp file
    tempFilePath = path.join(
      os.tmpdir(),
      `hybrid_ocr_${Date.now()}_${Math.random().toString(36).substring(7)}.pdf`
    );
    await fs.promises.writeFile(tempFilePath, pdfBuffer);

    console.log(`[ocrExtractor] Using Python: ${pythonExe}`);
    console.log(`[ocrExtractor] Running Hybrid OCR (PaddleOCR + Gemini)...`);

    // Build command arguments
    const args = [HYBRID_CONFIG.scriptPath, tempFilePath];
    if (options.geminiApiKey) {
      args.push('--api-key', options.geminiApiKey);
    }
    if (options.useGemini) {
      args.push('--skip-gemini');
    }

    // Execute Python script
    const { stdout, stderr } = await execFileAsync(
      pythonExe,
      args,
      { maxBuffer: CONFIG.maxBuffer }
    );

    // Filter stderr - only log actual errors
    if (stderr) {
      const errorLines = stderr.split('\n')
        .filter(line => line.trim() && !line.includes('WARNING') && !line.includes('table detection error'))
        .join('\n');
      if (errorLines) {
        console.warn('[ocrExtractor] Python stderr:', errorLines.slice(0, 500));
      }
    }

    // Parse JSON output (skip log lines)
    let jsonStart = stdout.indexOf('{');
    let jsonText = jsonStart >= 0 ? stdout.slice(jsonStart) : stdout;

    let result;
    try {
      result = JSON.parse(jsonText);
    } catch (parseErr) {
      errors.push({ step: 'json-parse', err: `JSON parse failed: ${parseErr.message}` });
      return { pages: [], errors, success: false };
    }
    
    if (!result.success) {
      errors.push(...(result.errors || [{ step: 'python-script', err: 'Extraction failed' }]));
      return { pages: [], errors, success: false };
    }

    // Normalize pages
    const pages = (result.pages || []).map(page => ({
      pageIndex: page.pageIndex,
      text: page.text || '',
      extractionMethod: page.extractionMethod || 'unknown',
      confidence: page.confidence || 0,
      geminiUsed: page.geminiUsed || false,
      metadata: {
        ocrMethod: page.extractionMethod,
        confidence: page.confidence,
      }
    }));

    // Log summary
    console.log(`[ocrExtractor] Hybrid OCR completed:`);
    console.log(`  - Total pages: ${pages.length}`);
    console.log(`  - PaddleOCR: ${result.stats?.paddlePages || 0}`);
    console.log(`  - Gemini fallback: ${result.stats?.geminiPages || 0}`);
    console.log(`  - Fallback rate: ${result.stats?.geminiFallbackRate || 'N/A'}`);

    return {
      pages,
      errors,
      success: true,
      stats: result.stats || {},
    };

  } catch (err) {
    errors.push({ step: 'hybrid-ocr', err: err.message });
    console.error('[ocrExtractor] Hybrid OCR failed:', err.message);
    return { pages: [], errors, success: false };

  } finally {
    // Cleanup temp file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        await fs.promises.unlink(tempFilePath);
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SMART EXTRACTION (Auto-select best method)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Extract PDF using the best available method
 * 
 * Priority:
 * 1. Hybrid (PaddleOCR + Gemini) - if Gemini API key available
 * 2. Hybrid (PaddleOCR only) - if PaddleOCR available
 * 3. Original pythonPdfExtractor - fallback
 * 
 * @param {Buffer} pdfBuffer - PDF file buffer
 * @param {Object} options
 * @param {string} options.geminiApiKey - Gemini API key
 * @param {string} options.method - Force method: 'hybrid', 'original', or 'auto' (default)
 * @returns {Promise<{pages: Array, errors: Array, success: boolean}>}
 */
async function extractSmart(pdfBuffer, options = {}) {
  const method = options.method || 'auto';
  
  // If forced method
  if (method === 'hybrid') {
    return extractWithHybridOcr(pdfBuffer, options);
  }
  
  // Auto-select best method
  if (options.geminiApiKey) {
    console.log('[ocrExtractor] Auto: Using Hybrid OCR (PaddleOCR + Gemini)');
    return extractWithHybridOcr(pdfBuffer, options);
  }
  
  // Check if hybrid is available without API key
  const hybridAvail = await isHybridAvailable();
  if (hybridAvail && options.geminiApiKey) {
    console.log('[ocrExtractor] Auto: Using Hybrid OCR');
    return extractWithHybridOcr(pdfBuffer, options);
  }
  
  // Fallback to original extractor
  console.log('[ocrExtractor] Auto: Using original extractor');
  return extractWithOcr(pdfBuffer, options);
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  // Main extraction
  extractWithOcr,
  
  // Hybrid OCR (PaddleOCR + Gemini)
  extractWithHybridOcr,
  isHybridAvailable,
  
  // Smart extraction (auto-select)
  extractSmart,
  
  // Utilities
  isAvailable,
  assessPageQuality,
  detectBoundary,
  buildPageInfos,
  extractPageImages,
  
  // Constants
  CONFIG,
};
