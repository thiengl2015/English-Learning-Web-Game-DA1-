/**
 * hybridOcrWrapper.js — Node.js wrapper cho hybridOcr.py
 * 
 * Cung cấp interface để gọi Python hybrid OCR từ Node.js
 * với proper error handling, timeout, và caching.
 */

const { execFile } = require('child_process');
const util = require('util');
const execFileAsync = util.promisify(execFile);
const fs = require('fs');
const path = require('path');
const os = require('os');

const PYTHON_SCRIPT_PATH = path.join(__dirname, 'hybridOcr.py');

/**
 * Execute Python script với proper timeout và error handling
 */
async function execPython(scriptPath, args, options = {}) {
  const {
    timeout = 120_000,    // 2 phút default
    maxBuffer = 100 * 1024 * 1024,  // 100MB
    pythonExe = null
  } = options;
  
  // Find Python interpreter — prefer .venv if present (where packages are installed)
  if (!pythonExe) {
    const venvPython = path.join(__dirname, '..', '..', '.venv', process.platform === 'win32' ? 'Scripts' : 'bin', process.platform === 'win32' ? 'python.exe' : 'python');
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
        } catch {
          // Continue trying
        }
      }
    }

    if (!pythonExe) {
      throw new Error(`No Python interpreter found`);
    }
  }

  try {
    const { stdout, stderr } = await execFileAsync(
      pythonExe,
      [scriptPath, ...args],
      {
        timeout,
        maxBuffer,
        windowsHide: true
      }
    );
    
    if (stderr && !stderr.includes('WARNING')) {
      console.warn('[hybridOcrWrapper] Python stderr:', stderr.slice(0, 500));
    }
    
    return JSON.parse(stdout);
  } catch (err) {
    // Parse error from stdout/stderr if available
    const errorMsg = err.stdout || err.message || 'Unknown error';
    throw new Error(`Python execution failed: ${errorMsg}`);
  }
}

/**
 * Extract PDF using hybrid OCR pipeline
 * 
 * @param {Buffer|string} pdfBufferOrPath - PDF as Buffer or path to file
 * @param {Object} options
 * @param {string} options.lang - Language: 'en', 'vietnamese', 'ch', 'mixed'
 * @param {boolean} options.usePaddle - Use PaddleOCR (default: true)
 * @param {boolean} options.useTableTransformer - Use TableTransformer (default: false)
 * @returns {Promise<HybridOcrResult>}
 */
async function extractWithHybridOcr(pdfBufferOrPath, options = {}) {
  const {
    lang = 'en',
    usePaddle = true,
    useTableTransformer = false,
    timeout = 180_000,  // 3 phút cho full PDF
    tempDir = os.tmpdir()
  } = options;
  
  let tempFilePath = '';
  
  try {
    // Write buffer to temp file if needed
    if (Buffer.isBuffer(pdfBufferOrPath)) {
      const ext = '.pdf';
      tempFilePath = path.join(
        tempDir,
        `hybrid_ocr_${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`
      );
      await fs.promises.writeFile(tempFilePath, pdfBufferOrPath);
    } else {
      tempFilePath = pdfBufferOrPath;
    }
    
    // Build arguments
    const args = [tempFilePath];
    if (lang !== 'en') args.push('--lang', lang);
    if (!usePaddle) args.push('--no-paddle');
    if (useTableTransformer) args.push('--use-tables');
    
    // Execute
    console.log('[hybridOcrWrapper] Starting hybrid OCR extraction...');
    const startTime = Date.now();
    
    const result = await execPython(
      PYTHON_SCRIPT_PATH,
      args,
      { timeout }
    );
    
    const duration = Date.now() - startTime;
    console.log(`[hybridOcrWrapper] Extraction completed in ${duration}ms`);
    console.log(`[hybridOcrWrapper] Strategy: ${result.strategy}`);
    console.log(`[hybridOcrWrapper] Stats: ${JSON.stringify(result.stats)}`);
    
    if (result.errors?.length > 0) {
      console.warn('[hybridOcrWrapper] Errors:', result.errors);
    }
    
    return result;
    
  } finally {
    // Cleanup temp file
    if (tempFilePath && tempFilePath !== pdfBufferOrPath) {
      try {
        await fs.promises.unlink(tempFilePath);
      } catch {
        // Ignore cleanup errors
      }
    }
  }
}

/**
 * Check if PaddleOCR is available
 */
async function checkPaddleAvailability() {
  try {
    const testScript = `
import sys
try:
    from paddleocr import PaddleOCR
    print('ok')
except ImportError:
    print('missing')
except Exception as e:
    print(f'error: {e}')
`;
    
    const { stdout } = await execFileAsync(
      process.platform === 'win32' ? 'py' : 'python3',
      ['-c', testScript],
      { timeout: 30_000, windowsHide: true }
    );
    
    return stdout.trim() === 'ok';
  } catch {
    return false;
  }
}

/**
 * Convert hybrid OCR result to pdfExtractor-compatible format
 */
function toPdfExtractorFormat(hybridResult) {
  return {
    pages: hybridResult.pages.map(page => ({
      pageIndex: page.pageIndex,
      text: page.combinedText || page.text || '',
      rawText: page.rawText || '',
      textBlocks: page.textBlocks || [],
      tables: page.tables || [],
      imageCount: page.diagramCrops?.length || 0,
      diagramCrops: page.diagramCrops || [],
      metadata: {
        isScanned: page.metadata?.isScanned || false,
        ocrRecommended: page.metadata?.ocrRecommended || false,
        textDensity: page.metadata?.textDensity || 0,
        language: page.metadata?.language || 'en',
        hasTables: page.metadata?.hasTables || false,
        hasDiagrams: page.metadata?.hasDiagrams || false,
        extractionMethod: page.metadata?.extractionMethod || 'none',
        confidence: page.metadata?.confidence || 0,
      }
    })),
    errors: hybridResult.errors || [],
    stats: hybridResult.stats || {}
  };
}

module.exports = {
  extractWithHybridOcr,
  checkPaddleAvailability,
  toPdfExtractorFormat,
  execPython
};
