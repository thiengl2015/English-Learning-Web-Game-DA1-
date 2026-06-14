/**
 * pdfExtractorV2.js — Hybrid OCR Pipeline
 * ============================================================================
 * 
 * Multi-strategy extraction với fallback thông minh:
 * 
 * Strategy Order:
 *   1. OCR (Python + pdfplumber) — Primary, table/map/diagram detection
 *   2. pdf-parse + pdfjs-dist — Text extraction fallback
 *   3. raw scan — Last resort
 * 
 * Features:
 *   - Table detection & cropping to images
 *   - Map detection & cropping to images
 *   - Diagram extraction (PyMuPDF)
 *   - Confidence scoring
 *   - Smart routing (text vs vision)
 *   - Works with Python 3.14+ (no PaddlePaddle dependency)
 * 
 * Export: extractPagesV2(pdfBuffer) → { pages, fullText, meta }
 */

const pdfParse = require('pdf-parse');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const util = require('util');
const execFileAsync = util.promisify(execFile);

// Lazy import cho OCR module
let ocrExtractor = null;
function getOcrExtractor() {
  if (!ocrExtractor) {
    try {
      ocrExtractor = require('./ocrExtractor');
    } catch (err) {
      console.warn('[pdfExtractorV2] ocrExtractor not available:', err.message);
      return null;
    }
  }
  return ocrExtractor;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEXT CLEANING LAYER
// ═══════════════════════════════════════════════════════════════════════════════

function cleanText(text) {
  if (typeof text !== 'string') return '';

  return text
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([.,:;!?])([A-Za-z])/g, '$1 $2')
    .replace(/(\d)([a-zA-Z])/g, '$1 $2')
    .replace(/([a-zA-Z])(\d)/g, '$1 $2')
    .replace(/([%$£€,;:!?])([a-zA-Z])/g, '$1 $2')
    .replace(/\.\s+\.\s*\.\s*\.*/g, ' ')
    .replace(/_\.\s*/g, '_ ')
    .replace(/\s*_\s*/g, ' ____ ')
    .replace(/^[ \t\r\n]+$/gm, '')
    .replace(/\n[ \t]{0,2}[^a-zA-Z0-9\n\s.()]{1,3}[ \t]{0,2}(?=\n)/g, '\n')
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\u0000/g, '')
    .replace(/\uFFFD/g, ' ')
    .trim();
}

function toUint8Array(data) {
  if (!data) throw new Error("Empty PDF data");
  if (Buffer.isBuffer(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }
  if (data instanceof Uint8Array) return data;
  if (data?.buffer instanceof ArrayBuffer) {
    return new Uint8Array(data.buffer);
  }
  throw new Error("Unsupported PDF data type");
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE QUALITY ASSESSMENT
// ═══════════════════════════════════════════════════════════════════════════════

function assessPageQualityV2(pageData, imageCount = 0, ocrRecommended = false, pageMeta = {}) {
  const text = pageData.text || '';
  if (!text.trim().length) {
    return { qualityScore: 0, route: 'vision', hasLayoutIssues: false, features: { imageCount } };
  }

  const t = text.trim();
  const wordCount = t.split(/\s+/).length;
  const avgWordLen = wordCount > 0 ? t.length / wordCount : 0;

  const hasQuestionPattern = /(?:^|\n)\s*\d{1,3}\s*[.)]\s/m.test(t);
  const hasOptions = /\b[A-D]\s*[.)]\s/m.test(t);
  const hasTFNG = /\b(TRUE|FALSE|NOT\s*GIVEN|YES|NO)\b/i.test(t);
  const hasIeltsKeywords = /\b(question|section|passage|reading|listening|writing|speaking|choose|match|complete|answer)\b/i.test(t);
  
  // Noise detection
  const noiseChars = (t.match(/[^a-zA-Z0-9\s.,;:!?'"()\-–—_\[\]\/\\%&@#*+={}<>]/g) || []).length;
  const noiseRatio = noiseChars / t.length;

  // Table detection from structured data
  const hasTableStructure = pageData.tables?.length > 0 || /\t/.test(t) || /\s{3,}\w/.test(t);
  
  // PaddleOCR-specific scoring
  const confidence = pageMeta.confidence || 0;
  const hasTextBlocks = pageData.textBlocks?.length > 0;

  let qualityScore = 0;

  // Base quality from text length
  if (t.length >= 200) qualityScore += 0.2;
  else if (t.length >= 50) qualityScore += 0.1;

  // Question patterns
  if (hasQuestionPattern) qualityScore += 0.2;
  if (hasOptions || hasTFNG) qualityScore += 0.15;
  if (hasIeltsKeywords) qualityScore += 0.2;
  
  // Low noise = good extraction
  if (noiseRatio < 0.05) qualityScore += 0.15;
  else if (noiseRatio < 0.15) qualityScore += 0.05;
  
  // Reasonable word length
  if (avgWordLen >= 3 && avgWordLen <= 12) qualityScore += 0.1;
  
  // PaddleOCR confidence bonus
  if (hasTextBlocks && confidence > 0.8) qualityScore += 0.1;
  else if (hasTextBlocks && confidence > 0.6) qualityScore += 0.05;

  // Penalize for images on scanned pages
  if (imageCount > 0 && (pageMeta.isScanned || ocrRecommended)) {
    qualityScore -= 0.3;
  }

  qualityScore = Math.max(0, Math.min(qualityScore, 1.0));

  // Route decision
  let route = 'text';
  const hasLayoutIssues = hasTableStructure || (pageData.tables?.length > 0);
  
  // Route to vision if:
  // 1. OCR explicitly recommended (scanned page)
  // 2. Very low confidence from PaddleOCR
  // 3. No text but has images/diagrams
  if (ocrRecommended || (hasTextBlocks && confidence < 0.5) || t.length === 0) {
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
      hasTextBlocks,
      confidence,
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
// STRATEGY 0 — OCR EXTRACTOR (Python + pdfplumber)
// ═══════════════════════════════════════════════════════════════════════════════

async function extractWithOcr(buffer, options = {}) {
  const errors = [];
  let tempFilePath = '';

  try {
    // Try ocrExtractor module first
    const ocr = getOcrExtractor();
    if (!ocr) {
      errors.push({ step: 'ocr-extractor', err: 'ocrExtractor module not available' });
      return { pages: [], errors, success: false };
    }

    console.log('[pdfExtractorV2] Using ocrExtractor module...');
    const result = await ocr.extractWithOcr(buffer, options);

    if (!result.success) {
      errors.push(...(result.errors || [{ step: 'ocr-extraction', err: 'Extraction failed' }]));
      return { pages: [], errors, success: false };
    }

    // Convert to standardized format (matching pdfExtractorV2 PageInfo)
    const pages = result.pages.map(p => ({
      pageIndex: p.pageIndex,
      text: p.text || '',
      rawText: p.text || '',
      textBlocks: [],
      tables: p.tableImages || [],
      imageCount: p.imageCount || 0,
      diagramCrops: p.diagramCrops || [],
      tableImages: p.tableImages || [],
      mapImages: p.mapImages || [],
      metadata: {
        isScanned: p.metadata?.isScanned || false,
        ocrRecommended: p.metadata?.ocrRecommended || false,
        textDensity: p.metadata?.textDensity || 0,
        language: p.metadata?.language || 'en',
        hasTables: p.metadata?.hasTables || false,
        hasMaps: p.metadata?.hasMaps || false,
        hasDiagrams: (p.diagramCrops?.length || 0) > 0,
        extractionMethod: 'ocr-extractor',
        confidence: 0.9,
      }
    }));

    const tableCount = pages.reduce((s, p) => s + (p.tableImages?.length || 0), 0);
    const mapCount = pages.reduce((s, p) => s + (p.mapImages?.length || 0), 0);

    console.log(`[pdfExtractorV2] [STRATEGY 0] SUCCESS — ${pages.length} pages, tables=${tableCount}, maps=${mapCount}`);

    return { pages, errors, success: true };

  } catch (err) {
    errors.push({ step: 'ocr-extraction', err: err.message });
    console.warn('[pdfExtractorV2] [STRATEGY 0] FAILED:', err.message);
    return { pages: [], errors, success: false };
  }
}

// Backward compatibility alias
const extractWithHybridOcr = extractWithOcr;

// ═══════════════════════════════════════════════════════════════════════════════
// STRATEGY 1 — pdf-parse (fallback 1)
// ═══════════════════════════════════════════════════════════════════════════════

async function renderPage(pageData) {
  const textContent = await pageData.getTextContent();
  const items = textContent.items.sort((a, b) => {
    const yDiff = b.transform[5] - a.transform[5];
    if (Math.abs(yDiff) > 5) return yDiff;
    return a.transform[4] - b.transform[4];
  });

  let lastY, lastX, lastWidth, text = '';

  for (const item of items) {
    const str = item.str;
    if (!str.trim()) continue;

    const transform = item.transform || [0, 0, 0, 0, 0, 0];
    const x = transform[4];
    const y = transform[5];
    const fontSize = transform[0] || 10;

    if (lastY !== undefined && Math.abs(y - lastY) > 8) {
      text += '\n';
      lastX = undefined;
    } else if (lastX !== undefined) {
      const xDiff = x - (lastX + lastWidth);
      if (xDiff > 30) {
        text += '    ';
      } else if (xDiff > 5) {
        text += ' ';
      }
    }

    text += str;
    lastY = y;
    lastX = x;
    lastWidth = item.width !== undefined ? item.width : (str.length * (fontSize * 0.5));
  }

  return text;
}

async function extractWithPdfParse(buffer) {
  const errors = [];
  const pageTexts = [];
  let currentPageIdx = 0;

  try {
    const result = await pdfParse(buffer, {
      pagerender: async (pageData) => {
        try {
          const text = await renderPage(pageData);
          const cleaned = cleanText(text);
          pageTexts.push({ pageIndex: currentPageIdx, text: cleaned });
          currentPageIdx++;
          return cleaned;
        } catch (pageErr) {
          errors.push({ step: 'renderPage', page: currentPageIdx, err: pageErr.message });
          currentPageIdx++;
          return '';
        }
      },
      max: 0,
    });

    return {
      pages: pageTexts,
      info: result ? { numpages: result.numpages, info: result.info } : null,
      errors,
      success: true,
    };
  } catch (err) {
    errors.push({ step: 'pdfParse', err: err.message });
    return { pages: [], errors, success: false };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRATEGY 2 — pdfjs-dist (fallback 2)
// ═══════════════════════════════════════════════════════════════════════════════

async function extractWithPdfjs(buffer) {
  const errors = [];

  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const uint8Data = toUint8Array(buffer);

    const loadingTask = pdfjsLib.getDocument({
      data: uint8Data,
      stopAtErrors: false,
      disableAutoFetch: true,
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
      verbosity: 0,
    });

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('pdfjs-dist timeout after 30s')), 30_000)
    );

    const pdf = await Promise.race([loadingTask.promise, timeout]);
    const numPages = pdf.numPages;

    const pageTexts = [];
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      try {
        const page = await pdf.getPage(pageNum);
        const content = await page.getTextContent();
        let text = '';

        const items = content.items.sort((a, b) => {
          const yDiff = (b.transform?.[5] ?? 0) - (a.transform?.[5] ?? 0);
          if (Math.abs(yDiff) > 5) return yDiff;
          return (a.transform?.[4] ?? 0) - (b.transform?.[4] ?? 0);
        });

        let lastY;
        for (const item of items) {
          if (!item.str?.trim()) continue;
          const y = item.transform?.[5];
          if (lastY !== undefined && Math.abs(y - lastY) > 8) text += '\n';
          text += item.str + ' ';
          lastY = y;
        }

        pageTexts.push({ pageIndex: pageNum - 1, text: cleanText(text) });
      } catch (pageErr) {
        errors.push({ step: 'pdfjs-getPage', page: pageNum, err: pageErr.message });
        pageTexts.push({ pageIndex: pageNum - 1, text: '' });
      }
    }

    console.log('[pdfExtractorV2] Strategy 2 SUCCESS — ' + pageTexts.length + ' pages');
    return { pages: pageTexts, errors, success: true };
  } catch (err) {
    if (err.code === 'ERR_PACKAGE_PATH_NOT_EXPORTED' ||
        err.code === 'MODULE_NOT_FOUND') {
      errors.push({ step: 'pdfjs-dist', err: 'pdfjs-dist not installed' });
    } else {
      errors.push({ step: 'pdfjs-dist', err: err.message });
    }
    return { pages: [], errors, success: false };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// STRATEGY 3 — Raw buffer scan (last resort)
// ═══════════════════════════════════════════════════════════════════════════════

function extractRawText(buffer) {
  const errors = [];
  const MIN_WORD_LEN = 2;
  const MIN_TOTAL_WORDS = 3;

  try {
    let text = buffer.toString('utf8');
    const printableRatio = (text.match(/[a-zA-Z]{2,}/g) || []).join('').length / text.length;
    if (printableRatio < 0.1) {
      text = buffer.toString('latin1');
    }

    const wordRe = new RegExp(`[a-zA-Z0-9.,;:!?'"()\\-–—\\s]{${MIN_WORD_LEN},}`, 'g');
    const rawWords = text.match(wordRe) || [];

    if (rawWords.length < MIN_TOTAL_WORDS) {
      errors.push({ step: 'raw-scan', err: `Only ${rawWords.length} word sequences found` });
      return { text: '', errors, success: false };
    }

    const cleaned = cleanText(rawWords.join(' '));
    if (!cleaned.trim()) {
      errors.push({ step: 'raw-scan', err: 'Extracted text empty after cleaning' });
      return { pages: [], errors, success: false };
    }

    return { pages: [{ pageIndex: 0, text: cleaned }], errors, success: true };
  } catch (err) {
    errors.push({ step: 'raw-scan', err: err.message });
    return { pages: [], errors, success: false };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PDF VALIDATION
// ═══════════════════════════════════════════════════════════════════════════════

function validatePdfBuffer(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    return { valid: false, reason: 'Input is not a Buffer' };
  }

  const MIN_SIZE = 512;
  const MAX_SIZE = 200 * 1024 * 1024;

  if (buffer.length < MIN_SIZE) {
    return { valid: false, reason: `File too small (${buffer.length} bytes)` };
  }

  if (buffer.length > MAX_SIZE) {
    return { valid: false, reason: `File too large (${(buffer.length / 1024 / 1024).toFixed(1)}MB)` };
  }

  const magic = buffer.slice(0, 5).toString('ascii');
  if (!magic.startsWith('%PDF-')) {
    return { valid: false, reason: `Invalid PDF magic bytes: "${magic}"` };
  }

  const tail = buffer.slice(-1024).toString('binary');
  if (!tail.includes('%%EOF')) {
    return { valid: false, reason: 'Missing %%EOF marker' };
  }

  return { valid: true };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PAGE-TO-IMAGE RENDERING
// ═══════════════════════════════════════════════════════════════════════════════

async function renderPagesToImages(pdfBuffer, pageIndexes = []) {
  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const { createCanvas } = await import('@napi-rs/canvas');

    const uint8Data = toUint8Array(pdfBuffer);
    const loadingTask = pdfjsLib.getDocument({
      data: uint8Data,
      useSystemFonts: true,
      disableAutoFetch: true,
      useWorkerFetch: false,
      isEvalSupported: false,
      verbosity: 0,
    });

    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('pdfjs-dist load timeout after 30s')), 30_000)
    );

    const pdf = await Promise.race([loadingTask.promise, timeout]);
    const results = [];

    for (let i = 0; i < pdf.numPages; i++) {
      if (pageIndexes.length > 0 && !pageIndexes.includes(i)) continue;

      const page = await Promise.race([
        pdf.getPage(i + 1),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error(`Page ${i + 1} timeout`)), 10_000)
        ),
      ]);

      const viewport = page.getViewport({ scale: 1200 / page.getViewport({ scale: 1 }).width });
      const width = Math.round(viewport.width);
      const height = Math.round(viewport.height);

      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);

      const renderTask = page.render({ canvasContext: ctx, viewport, intent: 'display' });
      await renderTask.promise;

      const pngBuffer = canvas.toBuffer('image/png');
      results.push(pngBuffer.toString('base64'));

      page.cleanup();
    }

    pdf.destroy();
    return results;
  } catch (err) {
    console.warn('[pdfExtractorV2] [IMAGE] Page rendering failed:', err.message);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN: extractPagesV2
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Extract per-page data from PDF using hybrid OCR pipeline.
 * 
 * @param {Buffer} pdfBuffer
 * @param {Object} options
 * @param {string} options.lang - OCR language ('en', 'vietnamese', etc.)
 * @returns {Promise<{pages, fullText, meta}>}
 */
async function extractPagesV2(pdfBuffer, options = {}) {
  const allErrors = [];
  const startTime = Date.now();
  const strategyMetrics = {};

  // Validate
  const validation = validatePdfBuffer(pdfBuffer);
  if (!validation.valid) {
    console.error(`[pdfExtractorV2] VALIDATION FAILED: ${validation.reason}`);
    allErrors.push({ step: 'validation', err: validation.reason });
  }

  let finalResult;
  let result;

  // ═══ STRATEGY 0: Hybrid OCR (PaddleOCR) ═══
  console.log(`[pdfExtractorV2] [STRATEGY 0] Trying Hybrid OCR (PaddleOCR)...`);
  const s0Start = Date.now();
  result = await extractWithHybridOcr(pdfBuffer, options);
  strategyMetrics['hybrid-ocr'] = { duration: Date.now() - s0Start, success: result.success };
  allErrors.push(...result.errors);

  if (result.success && result.pages.length > 0) {
    console.log(`[pdfExtractorV2] [STRATEGY 0] SUCCESS — ${result.pages.length} pages`);
    finalResult = buildPageInfosV2(result.pages, 'hybrid-ocr', allErrors);
    if (result.stats) {
      finalResult.meta.strategyStats = result.stats;
    }
  } else {
    console.warn(`[pdfExtractorV2] [STRATEGY 0] FAILED — falling back to pdf-parse`);

    // ═══ STRATEGY 1: pdf-parse ═══
    console.log(`[pdfExtractorV2] [STRATEGY 1] Trying pdf-parse...`);
    const s1Start = Date.now();
    result = await extractWithPdfParse(pdfBuffer);
    strategyMetrics['pdf-parse'] = { duration: Date.now() - s1Start, success: result.success };
    allErrors.push(...result.errors);

    if (result.success && result.pages.length > 0) {
      console.log(`[pdfExtractorV2] [STRATEGY 1] SUCCESS — ${result.pages.length} pages`);
      finalResult = buildPageInfosV2(result.pages, 'pdf-parse', allErrors);
    } else {
      console.warn(`[pdfExtractorV2] [STRATEGY 1] FAILED — falling back to pdfjs-dist`);

      // ═══ STRATEGY 2: pdfjs-dist ═══
      console.log(`[pdfExtractorV2] [STRATEGY 2] Trying pdfjs-dist...`);
      const s2Start = Date.now();
      result = await extractWithPdfjs(pdfBuffer);
      strategyMetrics['pdfjs-dist'] = { duration: Date.now() - s2Start, success: result.success };
      allErrors.push(...result.errors);

      if (result.success && result.pages.length > 0) {
        console.log(`[pdfExtractorV2] [STRATEGY 2] SUCCESS — ${result.pages.length} pages`);
        finalResult = buildPageInfosV2(result.pages, 'pdfjs-dist', allErrors);
      } else {
        console.warn(`[pdfExtractorV2] [STRATEGY 2] FAILED — using raw scan`);

        // ═══ STRATEGY 3: Raw scan ═══
        result = extractRawText(pdfBuffer);
        allErrors.push(...result.errors);

        if (result.success && result.pages.length > 0) {
          console.warn("[pdfExtractorV2] Using raw-scan fallback — low quality");
          finalResult = buildPageInfosV2(result.pages, 'raw-scan', allErrors);
        } else {
          console.error(`[pdfExtractorV2] ALL STRATEGIES FAILED`);
          finalResult = buildPageInfosV2([], 'none', allErrors);
        }
      }
    }
  }

  // ═══ CONNECT VISION FALLBACK ═══
  const visionPageIndexes = finalResult.pages
    .filter(p => p.route === 'vision' && (!p.diagramCrops || p.diagramCrops.length === 0))
    .map(p => p.pageIndex);

  if (visionPageIndexes.length > 0) {
    console.log(`[pdfExtractorV2] [VISION] Rendering full page(s): ${visionPageIndexes.join(',')}`);
    try {
      const images = await renderPagesToImages(pdfBuffer, visionPageIndexes);
      visionPageIndexes.forEach((idx, imgArrIdx) => {
        const page = finalResult.pages.find(p => p.pageIndex === idx);
        if (page && images[imgArrIdx]) {
          page.image = images[imgArrIdx];
          console.log(`[pdfExtractorV2] [VISION] Page ${idx} render attached`);
        } else if (page) {
          page._visionFailed = true;
          if (page.text && page.text.trim().length > 50) {
            page.route = 'text';
            page.qualityScore = 0.5;
          }
        }
      });
    } catch (err) {
      console.warn('[pdfExtractorV2] [VISION] Rendering failed:', err.message);
    }
  }

  // ═══ FINAL METRICS ═══
  const totalDuration = Date.now() - startTime;
  const visionPageCount = finalResult.pages.filter(p => p.route === 'vision').length;
  const textPageCount = finalResult.pages.length - visionPageCount;
  const totalChars = finalResult.pages.reduce((sum, p) => sum + (p.text?.length || 0), 0);

  const estimatedTextTokens = Math.ceil(totalChars / 4);
  const estimatedVisionTokens = visionPageCount * 85;

  finalResult.meta = {
    ...finalResult.meta,
    time_ms: totalDuration,
    strategy_metrics: strategyMetrics,
    routing: {
      vision_pages: visionPageCount,
      text_pages: textPageCount,
      total_pages: finalResult.pages.length,
    },
    token_estimate: {
      text_tokens: estimatedTextTokens,
      vision_tokens: estimatedVisionTokens,
      total_tokens: estimatedTextTokens + estimatedVisionTokens,
      estimated_cost_usd: {
        text: (estimatedTextTokens / 1000) * 0.01,
        vision: (estimatedVisionTokens / 1000) * 3.75,
        total: (estimatedTextTokens / 1000) * 0.01 + (estimatedVisionTokens / 1000) * 3.75,
      }
    },
  };

  console.log(`[pdfExtractorV2] ══ EXTRACTION COMPLETE ══`);
  console.log(`  Strategy:        ${finalResult.meta.strategy}`);
  console.log(`  Pages:           ${finalResult.pages.length} (vision=${visionPageCount}, text=${textPageCount})`);
  console.log(`  Duration:        ${totalDuration}ms`);

  return finalResult;
}

/**
 * Build PageInfo array v2 — supports hybrid OCR structured data
 */
function buildPageInfosV2(rawPages, strategy, errors) {
  const pages = rawPages.map(pt => {
    const pageMeta = pt.metadata || {};
    const ocrRecommended = pageMeta.ocrRecommended || false;
    const isScanned = pageMeta.isScanned || false;

    // For hybrid OCR pages, use structured data quality
    const quality = assessPageQualityV2(
      pt,
      pt.imageCount || 0,
      ocrRecommended,
      { isScanned, textDensity: pageMeta.textDensity, confidence: pageMeta.confidence }
    );

    const boundary = detectBoundary(pt.text || '');

    return {
      pageIndex: pt.pageIndex,
      text: pt.text || '',
      rawText: pt.rawText || '',
      textBlocks: pt.textBlocks || [],
      tables: pt.tables || [],
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
      metadata: {
        isScanned,
        ocrRecommended,
        textDensity: pageMeta.textDensity || 0,
        language: pageMeta.language || 'en',
        hasTables: pageMeta.hasTables || (pt.tableImages?.length || 0) > 0,
        hasMaps: pageMeta.hasMaps || (pt.mapImages?.length || 0) > 0,
        hasDiagrams: pageMeta.hasDiagrams || (pt.diagramCrops?.length || 0) > 0,
        extractionMethod: pageMeta.extractionMethod || strategy,
        confidence: pageMeta.confidence || 0,
      }
    };
  });

  // Log vision pages
  const visionPages = pages.filter(p => p.route === 'vision');
  if (visionPages.length > 0) {
    console.info(`[pdfExtractorV2] Pages routed to VISION: ${visionPages.map(p => `p${p.pageIndex}`).join(', ')}`);
  }

  const fullText = pages.map(p => p.text).join('\n\n');
  const meta = {
    strategy,
    pageCount: pages.length,
    textLength: fullText.length,
    fallback: strategy !== 'hybrid-ocr',
    errors,
    visionPageCount: visionPages.length,
    textPageCount: pages.length - visionPages.length,
  };

  return { pages, fullText, meta };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HASHING
// ═══════════════════════════════════════════════════════════════════════════════

function computeHashes(pdfBuffer, fullText) {
  const hashRaw = crypto.createHash('md5').update(pdfBuffer).digest('hex');
  const normalized = (fullText || '').replace(/\s+/g, ' ').trim().toLowerCase();
  const hashText = crypto.createHash('md5').update(normalized).digest('hex');
  return { hashRaw, hashText };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  extractPagesV2,
  computeHashes,
  assessPageQuality: assessPageQualityV2,
  detectBoundary,
  cleanText,
  validatePdfBuffer,
};
