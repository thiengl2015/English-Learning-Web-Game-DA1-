/**
 * pdfExtractor.js — Production-grade PDF extraction (REFACTORED v6.0)
 *
 * Multi-strategy parsing pipeline:
 *   Strategy 1 (primary):  pdf-parse  — fast, text-based
 *   Strategy 2 (fallback): pdfjs-dist — modern, handles corrupted PDFs better
 *   Strategy 3 (last resort): raw buffer inspection + safe text extraction
 *
 * Export: extractPages(pdfBuffer) → { pages, fullText, meta }
 *   meta: { strategy, pageCount, textLength, fallback, errors[] }
 */
const pdfParse = require('pdf-parse');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ─────────────────────────────────────────────────────────────
// 1. TEXT CLEANING LAYER  (prevents corrupted outputs like "___ ...")
// ─────────────────────────────────────────────────────────────

/**
 * Remove broken tokens, normalize whitespace, fix common PDF encoding issues.
 */
function cleanText(text) {
  if (typeof text !== 'string') return '';

  return text
    // ── Fix concatenated words ──────────────────────────────────
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/([.,:;!?])([A-Za-z])/g, '$1 $2')
    .replace(/(\d)([a-zA-Z])/g, '$1 $2')
    .replace(/([a-zA-Z])(\d)/g, '$1 $2')

    // ── Collapse excessive dots ─────────────────────────────────
    // "___ ..." or "...." or ".. ." → normalize to single space
    .replace(/\.{4,}/g, ' ')
    .replace(/\.\s+\.\s*\.\s*\.*/g, ' ')
    .replace(/_\.\s*/g, '_ ')
    .replace(/\s*_\s*/g, ' ____ ')

    // ── Remove broken tokens ────────────────────────────────────
    // Isolated single chars that are clearly noise
    .replace(/\s([a-z])\s(?=[a-z]\s)/gi, ' ')
    // Remove lines that are just whitespace/punctuation
    .replace(/^[ \t\r\n]+$/gm, '')
    // Remove very short lines (< 3 chars) surrounded by content
    .replace(/\n[ \t]{0,2}[^a-zA-Z0-9\n]{1,3}[ \t]{0,2}(?=\n)/g, '\n')

    // ── Normalize whitespace ────────────────────────────────────
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')

    // ── Fix common encoding artifacts ─────────────────────────
    .replace(/\u0000/g, '')         // null bytes
    .replace(/\uFFFD/g, '')         // replacement char
    .replace(/[^\x20-\x7E\n.,;:!?'"()\-–—_\[\]\/\\%&@#*+={}<>…]/g, ' ')
    // Restore some useful unicode
    .replace(/…/g, '...')
    .replace(/–/g, '-')
    .replace(/—/g, '-')

    .trim();
}

// ─────────────────────────────────────────────────────────────
// HELPER: Normalise PDF data to Uint8Array
// pdfjs-dist@4.x requires Uint8Array; Buffer is Node.js-specific.
// ─────────────────────────────────────────────────────────────
function toUint8Array(data) {
  if (!data) throw new Error("Empty PDF data");

  // 🚨 Critical: Node.js Buffer is a subclass of Uint8Array. 
  // pdfjs-dist legacy builds often perform strict checks (e.g. data instanceof Uint8Array && !Buffer.isBuffer(data))
  // We MUST return a pure Uint8Array constructor instance to bypass these checks.
  if (Buffer.isBuffer(data)) {
    return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  }

  if (data instanceof Uint8Array) return data;

  // ⚠️ handle case where data is a TypedArray or has an underlying buffer
  if (data?.buffer instanceof ArrayBuffer) {
    return new Uint8Array(data.buffer);
  }

  throw new Error("Unsupported PDF data type");
}

// ─────────────────────────────────────────────────────────────
// 2. PAGE RENDERING
// ─────────────────────────────────────────────────────────────

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
        text += '    '; // Preservation of table-like spacing
      } else if (xDiff > 5) {
        text += ' ';
      }
    }

    const fontName = (item.fontName || '').toLowerCase();
    const isBold = fontName.includes('bold') || fontName.includes('black') || fontName.includes('heavy');

    if (isBold) {
      text += `**${str.trim()}**`;
    } else {
      text += str;
    }

    lastY = y;
    lastX = x;
    lastWidth = str.length * (fontSize * 0.5); // Rough heuristic for char width
  }

  return text;
}

// ─────────────────────────────────────────────────────────────
// 3. SMART SCORING (Rule-based, no threshold)
// ─────────────────────────────────────────────────────────────

function assessPageQuality(pageText) {
  if (!pageText || pageText.trim().length === 0) {
    return { qualityScore: 0, route: 'vision', hasLayoutIssues: false, features: {} };
  }

  const t = pageText.trim();
  const wordCount = t.split(/\s+/).length;
  const avgWordLen = wordCount > 0 ? t.length / wordCount : 0;

  const hasQuestionPattern = /(?:^|\n)\s*\d{1,3}\s*[.)]\s/m.test(t);
  const hasOptions = /\b[A-D]\s*[.)]\s/m.test(t);
  const hasTFNG = /\b(TRUE|FALSE|NOT\s*GIVEN|YES|NO)\b/i.test(t);
  const hasIeltsKeywords = /\b(question|section|passage|reading|listening|writing|choose|match|complete|answer)\b/i.test(t);

  // Noise
  const noiseChars = (t.match(/[^a-zA-Z0-9\s.,;:!?'"()\-–—_\[\]\/\\%&@#*+={}<>]/g) || []).length;
  const noiseRatio = noiseChars / t.length;

  // Multi-column / table detection
  const lines = t.split('\n').filter(l => l.trim().length > 0);
  const shortLines = lines.filter(l => l.trim().length < 20 && l.trim().length > 0);
  const shortLineRatio = lines.length > 0 ? shortLines.length / lines.length : 0;
  const hasMultiColumn = shortLineRatio > 0.5 && lines.length > 10;
  const hasTableStructure = /\t/.test(t) || /\s{3,}\w/.test(t);

  // ── Scoring ──
  let qualityScore = 0;
  if (t.length >= 200) qualityScore += 0.2;
  else if (t.length >= 50) qualityScore += 0.1;
  if (hasQuestionPattern) qualityScore += 0.2;
  if (hasOptions || hasTFNG) qualityScore += 0.15;
  if (hasIeltsKeywords) qualityScore += 0.2;
  if (noiseRatio < 0.05) qualityScore += 0.15;
  else if (noiseRatio < 0.15) qualityScore += 0.05;
  if (avgWordLen >= 3 && avgWordLen <= 12) qualityScore += 0.1;
  qualityScore = Math.min(qualityScore, 1.0);

  const hasLayoutIssues = hasMultiColumn || hasTableStructure;
  let route = 'text';

  // Force vision for severe layout issues even if text is somewhat readable
  if (hasTableStructure && qualityScore < 0.7) {
    route = 'vision';
  } else if (t.length < 50 || noiseRatio > 0.3 || (wordCount > 5 && avgWordLen < 2.5)) {
    route = 'vision';
  } else if (!hasQuestionPattern && !hasIeltsKeywords && qualityScore < 0.4) {
    route = 'vision';
  }

  return {
    qualityScore,
    route,
    hasLayoutIssues,
    features: {
      hasQuestionPattern,
      hasOptions,
      hasTFNG,
      hasIeltsKeywords,
      noiseRatio: +noiseRatio.toFixed(3),
      avgWordLen: +avgWordLen.toFixed(1),
      hasMultiColumn,
      hasTableStructure,
      wordCount,
      charCount: t.length,
    },
  };
}

// ─────────────────────────────────────────────────────────────
// 4. SEMANTIC BOUNDARY DETECTION
// ─────────────────────────────────────────────────────────────

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

// ─────────────────────────────────────────────────────────────
// 5. STRATEGY 1 — pdf-parse (primary)
// ─────────────────────────────────────────────────────────────

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
      // Try to be more lenient with corrupted PDFs
      max: 0, // parse all pages
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

// ─────────────────────────────────────────────────────────────
// 6. STRATEGY 2 — pdfjs-dist (fallback)
//    Handles corrupted PDFs that pdf-parse cannot read.
//    Uses dynamic import() for ESM-only package (v4.x).
// ─────────────────────────────────────────────────────────────

async function extractWithPdfjs(buffer) {
  const errors = [];

  try {
    // Dynamic import — required because pdfjs-dist@4.x is ESM-only (no CommonJS)
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');

    // Fix: pdfjs-dist@4.x requires Uint8Array, not Node.js Buffer
    const uint8Data = toUint8Array(buffer);
    console.log('[pdfExtractor] Strategy 2 using Uint8Array (length=' + uint8Data.length + ')');

    const loadingTask = pdfjsLib.getDocument({
      data: uint8Data,
      stopAtErrors: false,      // 🚨 Critical: handle corrupted PDFs with bad XRef entries
      disableAutoFetch: true,   // 🚨 Critical: prevent unnecessary network/file fetches
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

    console.log('[pdfExtractor] Strategy 2 SUCCESS — ' + pageTexts.length + ' pages');
    return { pages: pageTexts, errors, success: true };
  } catch (err) {
    // Distinguish ENOENT (module not found) from actual parse errors
    if (err.code === 'ERR_PACKAGE_PATH_NOT_EXPORTED' ||
      err.code === 'MODULE_NOT_FOUND' ||
      err.message?.includes('Cannot find module')) {
      errors.push({ step: 'pdfjs-dist', err: 'pdfjs-dist not installed — install with: npm install pdfjs-dist' });
    } else {
      errors.push({ step: 'pdfjs-dist', err: err.message });
    }
    console.warn('[pdfExtractor] Strategy 2 FAILED — ' + (errors[errors.length - 1]?.err || 'unknown error'));
    return { pages: [], errors, success: false };
  }
}

// ─────────────────────────────────────────────────────────────
// 7. STRATEGY 3 — Raw buffer scan (last resort)
//    Extracts any readable ASCII/Unicode text from binary buffer
// ─────────────────────────────────────────────────────────────

function extractRawText(buffer) {
  const errors = [];
  const MIN_WORD_LEN = 2;
  const MIN_TOTAL_WORDS = 3;

  try {
    // Try UTF-8 first
    let text = buffer.toString('utf8');

    // If mostly garbage (high ratio of non-printable), try latin1
    const printableRatio = (text.match(/[a-zA-Z]{2,}/g) || []).join('').length / text.length;
    if (printableRatio < 0.1) {
      text = buffer.toString('latin1');
    }

    // Extract readable word sequences separated by whitespace/newlines
    // Build regex dynamically so MIN_WORD_LEN is interpolated (not literal)
    const wordRe = new RegExp(`[a-zA-Z0-9.,;:!?'"()\\-–—\\s]{${MIN_WORD_LEN},}`, 'g');
    const rawWords = text.match(wordRe) || [];

    if (rawWords.length < MIN_TOTAL_WORDS) {
      errors.push({ step: 'raw-scan', err: `Only ${rawWords.length} word sequences found — likely not a valid text document` });
      return { text: '', errors, success: false };
    }

    const cleaned = cleanText(rawWords.join(' '));

    if (!cleaned.trim()) {
      errors.push({ step: 'raw-scan', err: 'Extracted text empty after cleaning' });
      return { text: '', errors, success: false };
    }

    // Treat raw text as a single synthetic page
    const syntheticPage = {
      pageIndex: 0,
      text: cleaned,
    };

    return { pages: [syntheticPage], errors, success: true };
  } catch (err) {
    errors.push({ step: 'raw-scan', err: err.message });
    return { pages: [], errors, success: false };
  }
}

// ─────────────────────────────────────────────────────────────
// 8. PDF VALIDATION LAYER
// ─────────────────────────────────────────────────────────────

/**
 * Basic validation before parsing — catches obviously bad files early.
 * Returns { valid: boolean, reason?: string }
 */
function validatePdfBuffer(buffer) {
  if (!Buffer.isBuffer(buffer)) {
    return { valid: false, reason: 'Input is not a Buffer' };
  }

  const MIN_SIZE = 512;       // 512 bytes — absolute minimum for any PDF
  const MAX_SIZE = 200 * 1024 * 1024; // 200MB hard limit

  if (buffer.length < MIN_SIZE) {
    return { valid: false, reason: `File too small (${buffer.length} bytes < ${MIN_SIZE} bytes minimum)` };
  }

  if (buffer.length > MAX_SIZE) {
    return { valid: false, reason: `File too large (${(buffer.length / 1024 / 1024).toFixed(1)}MB > 200MB limit)` };
  }

  // Check for PDF magic bytes: "%PDF-"
  const magic = buffer.slice(0, 5).toString('ascii');
  if (!magic.startsWith('%PDF-')) {
    return { valid: false, reason: `Invalid PDF magic bytes: "${magic}" — file may be corrupted or not a PDF` };
  }

  // Check for end-of-PDF marker "%%EOF"
  const tail = buffer.slice(-1024).toString('binary');
  if (!tail.includes('%%EOF')) {
    return { valid: false, reason: 'Missing %%EOF marker — PDF may be truncated or corrupted' };
  }

  return { valid: true };
}

// ─────────────────────────────────────────────────────────────
// 9. MAIN: extractPages — Multi-strategy orchestrator
// ─────────────────────────────────────────────────────────────

/**
 * Extract per-page data from a PDF using the best available strategy.
 *
 * Strategy order:
 *   1. pdf-parse  (primary — fast, good quality)
 *   2. pdfjs-dist (fallback — handles corrupted PDFs)
 *   3. raw scan   (last resort — recovers any readable text)
 *
 * @param {Buffer} pdfBuffer
 * @returns {Promise<{ pages: PageInfo[], fullText: string, meta: Meta }>}
 *
 * PageInfo: { pageIndex, text, qualityScore, route, hasLayoutIssues, detectedBoundary, features }
 * Meta:    { strategy, pageCount, textLength, fallback, errors[] }
 */
async function extractPages(pdfBuffer) {
  const allErrors = [];

  // ── Validate early ────────────────────────────────────────
  const validation = validatePdfBuffer(pdfBuffer);
  if (!validation.valid) {
    console.error(`[pdfExtractor] VALIDATION FAILED: ${validation.reason}`);
    allErrors.push({ step: 'validation', err: validation.reason });
  }

  // ── Strategy 1: pdf-parse ─────────────────────────────────
  console.log(`[pdfExtractor] [STRATEGY 1] Trying pdf-parse (primary parser)...`);
  let result = await extractWithPdfParse(pdfBuffer);
  allErrors.push(...result.errors);

  let finalResult;
  if (result.success && result.pages.length > 0) {
    const textLen = result.pages.reduce((s, p) => s + (p.text?.length || 0), 0);
    console.log(`[pdfExtractor] [STRATEGY 1] SUCCESS — ${result.pages.length} pages, ${textLen} chars`);
    finalResult = buildPageInfos(result.pages, 'pdf-parse', allErrors);
  } else {
    console.warn(`[pdfExtractor] [STRATEGY 1] FAILED — ${result.errors[0]?.err || 'no pages extracted'}`);
    console.log(`[pdfExtractor] [STRATEGY 2] Trying pdfjs-dist (fallback parser)...`);

    // ── Strategy 2: pdfjs-dist ─────────────────────────────────
    result = await extractWithPdfjs(pdfBuffer);
    allErrors.push(...result.errors);

    if (result.success && result.pages.length > 0) {
      const textLen = result.pages.reduce((s, p) => s + (p.text?.length || 0), 0);
      console.log(`[pdfExtractor] [STRATEGY 2] SUCCESS — ${result.pages.length} pages, ${textLen} chars (fallback used)`);
      finalResult = buildPageInfos(result.pages, 'pdfjs-dist', allErrors);
    } else {
      console.warn(`[pdfExtractor] [STRATEGY 2] FAILED — ${result.errors[0]?.err || 'no pages extracted'}`);
      console.log(`[pdfExtractor] [STRATEGY 3] Trying raw buffer scan (last resort)...`);

      // ── Strategy 3: raw scan ───────────────────────────────────
      result = extractRawText(pdfBuffer);
      allErrors.push(...result.errors);

      if (result.success && result.pages.length > 0) {
        const textLen = result.pages.reduce((s, p) => s + (p.text?.length || 0), 0);
        console.warn("[pdfExtractor] Using raw-scan fallback — low quality extraction");
        finalResult = buildPageInfos(result.pages, 'raw-scan', allErrors);
      } else {
        console.error(`[pdfExtractor] ALL STRATEGIES FAILED — ${allErrors.length} error(s)`);
        finalResult = buildPageInfos([], 'none', allErrors);
      }
    }
  }

  // ─── CONNECT VISION FALLBACK — OPTIMIZATION ────────────────
  // If any page is marked for 'vision', convert ONLY those pages to images
  const visionPageIndexes = finalResult.pages
    .filter(p => p.route === 'vision')
    .map(p => p.pageIndex);

  if (visionPageIndexes.length > 0) {
    console.log(`[pdfExtractor] [VISION] Converting ${visionPageIndexes.length} page(s) to images (indices: ${visionPageIndexes.join(',')})`);
    try {
      const images = await convertPagesToImages(pdfBuffer, visionPageIndexes);
      // Map images back to their pages
      visionPageIndexes.forEach((idx, imgArrIdx) => {
        const page = finalResult.pages.find(p => p.pageIndex === idx);
        if (page && images[imgArrIdx]) {
          page.image = images[imgArrIdx];
          console.log(`[pdfExtractor] [VISION] Page ${idx} image attached OK`);
        }
      });
    } catch (err) {
      console.warn('[pdfExtractor] [VISION] Conversion failed:', err.message);
    }
  }

  return finalResult;
}

/**
 * Build PageInfo array + meta from raw page texts.
 */
function buildPageInfos(rawPages, strategy, errors) {
  const pages = rawPages.map((pt) => {
    const quality = assessPageQuality(pt.text);
    const boundary = detectBoundary(pt.text);
    return {
      pageIndex: pt.pageIndex,
      text: pt.text,
      qualityScore: quality.qualityScore,
      route: quality.route,
      hasLayoutIssues: quality.hasLayoutIssues,
      detectedBoundary: boundary,
      features: quality.features,
      image: null, // placeholder, filled above if needed
    };
  });

  const fullText = pages.map(p => p.text).join('\n\n');
  const meta = {
    strategy,
    pageCount: pages.length,
    textLength: fullText.length,
    fallback: strategy !== 'pdf-parse',
    errors,
  };

  console.log(`[pdfExtractor] Final build: strategy=${strategy} pages=${pages.length} chars=${fullText.length}`);
  return { pages, fullText, meta };
}


// ─────────────────────────────────────────────────────────────
// 10. IMAGE CONVERSION
// ─────────────────────────────────────────────────────────────

async function convertPagesToImages(pdfBuffer, pageIndexes = []) {
  try {
    const pdfImg = require('pdf-img-convert');
    const allImages = await pdfImg.convert(pdfBuffer, { width: 1200 });

    if (pageIndexes.length === 0) {
      return allImages.map(img => Buffer.from(img).toString('base64'));
    }
    return pageIndexes
      .filter(idx => idx < allImages.length)
      .map(idx => Buffer.from(allImages[idx]).toString('base64'));
  } catch (err) {
    console.warn('[pdfExtractor] Image conversion failed:', err.message);
    return [];
  }
}

// ─────────────────────────────────────────────────────────────
// 11. HASHING
// ─────────────────────────────────────────────────────────────

function computeHashes(pdfBuffer, fullText) {
  const hashRaw = crypto.createHash('md5').update(pdfBuffer).digest('hex');
  const normalized = (fullText || '').replace(/\s+/g, ' ').trim().toLowerCase();
  const hashText = crypto.createHash('md5').update(normalized).digest('hex');
  return { hashRaw, hashText };
}

// ─────────────────────────────────────────────────────────────
// EXPORTS
// ─────────────────────────────────────────────────────────────

module.exports = {
  extractPages,
  convertPagesToImages,
  computeHashes,
  assessPageQuality,
  detectBoundary,
  cleanText,         // exported for reuse in ieltsParser
  validatePdfBuffer, // exported for reuse in controller
};
