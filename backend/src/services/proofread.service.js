/**
 * proofread.service.js — AI Proofreading Service
 * =============================================
 * 
 * Workflow:
 * 1. OCR image → extract text (PaddleOCR + Gemini)
 * 2. AI proofread → return error-coded JSON
 * 
 * Features:
 * - Grammar error detection
 * - Spelling error detection
 * - Vocabulary suggestions
 * - Error classification & explanations
 * - Word-by-word annotated response
 */

'use strict';

console.log('[DEBUG] GEMINI_API_KEY:', process.env.GEMINI_API_KEY ? 'SET' : 'NOT SET');

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const util = require('util');
const execFileAsync = util.promisify(execFile);

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIGURATION
// ═══════════════════════════════════════════════════════════════════════════════

const CONFIG = {
  // OCR settings
  ocr: {
    hybridScriptPath: path.join(__dirname, '..', '..', '..', 'ocr', 'hybridOcrGemini.py'),
    fallbackScriptPath: path.join(__dirname, '..', '..', '..', 'ocr', 'pythonPdfExtractor.py'),
    maxBuffer: 50 * 1024 * 1024, // 50MB
  },
  
  // AI settings
  ai: {
    model: 'gpt-4o',
    temperature: 0.1,
  },
  
  // Python interpreter candidates
  pythonCandidates: process.platform === 'win32'
    ? ['py -3.11', 'python3.11', 'py', 'python3', 'python']
    : ['python3.11', 'python3', 'python'],
};

console.log('[DEBUG] script path:', CONFIG.ocr.hybridScriptPath);
console.log('[DEBUG] script exists:', fs.existsSync(CONFIG.ocr.hybridScriptPath));

// ═══════════════════════════════════════════════════════════════════════════════
// PYTHON INTERPRETER
// ═══════════════════════════════════════════════════════════════════════════════

async function findPythonInterpreter() {
  const venvPython = path.join(__dirname, '..', '..', '..', '.venv',
    process.platform === 'win32' ? 'Scripts' : 'bin',
    process.platform === 'win32' ? 'python.exe' : 'python'
  );
  if (fs.existsSync(venvPython)) {
    const hasPackages = await checkPythonPackages(venvPython);
    if (hasPackages) return venvPython;
  }
  
  for (const candidate of CONFIG.pythonCandidates) {
    const hasPackages = await checkPythonPackages(candidate);
    if (hasPackages) return candidate;
  }
  return null;
}

async function checkPythonPackages(pythonExe) {
  const packages = ['paddleocr', 'paddlepaddle', 'google'];
  try {
    const { stdout } = await execFileAsync(pythonExe, ['-c', 
      'import paddleocr; import google.generativeai as gemini; print("OK")'
    ], { timeout: 10000 });
    return stdout.includes('OK');
  } catch {
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// OCR FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Extract text from image using Hybrid OCR (PaddleOCR + Gemini)
 * 
 * @param {Buffer} imageBuffer - Image file buffer
 * @param {string|null} geminiApiKey - Gemini API key
 * @param {string} originalFilename - Original filename to preserve extension (e.g. 'photo.jpg')
 */
async function extractTextFromImage(imageBuffer, geminiApiKey = null, originalFilename = 'image.jpg') {
  console.log('[DEBUG] geminiApiKey received in extractText:', geminiApiKey ? 'SET' : 'NULL');
  console.log('[DEBUG] originalFilename:', originalFilename);

  const pythonExe = await findPythonInterpreter();
  console.log('[DEBUG] pythonExe:', pythonExe);
  if (!pythonExe) {
    return { success: false, error: 'No Python interpreter found', text: '' };
  }

  // ✅ Giữ đúng extension của file gốc để Python nhận diện đúng loại file
  const ext = path.extname(originalFilename).toLowerCase() || '.jpg';
  const tempPath = path.join(
    os.tmpdir(),
    `proofread_${Date.now()}_${Math.random().toString(36).substring(7)}${ext}`
  );
  
  try {
    await fs.promises.writeFile(tempPath, imageBuffer);
    console.log('[DEBUG] tempPath:', tempPath);

    // Build command — split properly for Windows "py -3.11" style
    const scriptPath = CONFIG.ocr.hybridScriptPath;
    let cmd, cmdArgs;
    
    if (pythonExe.includes(' ')) {
      const parts = pythonExe.split(' ');
      cmd = parts[0];
      cmdArgs = [...parts.slice(1), scriptPath, tempPath];
    } else {
      cmd = pythonExe;
      cmdArgs = [scriptPath, tempPath];
    }
    
    if (geminiApiKey) {
      cmdArgs.push('--api-key', geminiApiKey);
    }

    cmdArgs.push('--pages', '0-1');

    console.log('[DEBUG] final cmdArgs:', JSON.stringify(cmdArgs));
    
    try {
      const { stdout, stderr } = await execFileAsync(cmd, cmdArgs, {
        maxBuffer: CONFIG.ocr.maxBuffer,
        timeout: 60000
      });
      
      console.log('[proofread.service] OCR stderr FULL:', stderr || 'EMPTY');
      
      // Parse JSON from stdout
      const jsonStart = stdout.indexOf('{');
      const jsonText = jsonStart >= 0 ? stdout.slice(jsonStart) : stdout;
      
      console.log('[proofread.service] OCR stdout preview:', jsonText.substring(0, 300));

      let result;
      try {
        result = JSON.parse(jsonText);
      } catch {
        return { success: false, error: 'OCR output parse failed', text: '' };
      }

      if (!result.success || !result.pages || result.pages.length === 0) {
        return { success: false, error: 'OCR extraction failed', text: '' };
      }

      const page = result.pages[0];
      const text = page.text || '';
      const confidence = page.confidence || 0;

      console.log('[DEBUG] OCR page result:', JSON.stringify(page));
      console.log('[DEBUG] geminiUsed:', page.geminiUsed, '| text length:', text.length);

      if (!text) {
        return { success: false, error: 'OCR returned empty text', text: '' };
      }

      return {
        success: true,
        text,
        confidence,
        method: page.extractionMethod || 'unknown',
        geminiUsed: page.geminiUsed || false
      };

    } catch (err) {
      console.error('[proofread.service] execFile ERROR:', err.message);
      console.error('[proofread.service] execFile STDERR:', err.stderr || 'none');
      console.error('[proofread.service] execFile STDOUT:', err.stdout || 'none');
      return { success: false, error: err.message, text: '' };
    } finally {
      // Cleanup temp file
      if (fs.existsSync(tempPath)) {
        try { await fs.promises.unlink(tempPath); } catch {}
      }
    }
  } catch (err) {
    console.error('[proofread.service] extractTextFromImage error:', err.message);
    return { success: false, error: err.message, text: '' };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// AI PROOFREAD PROMPT
// ═══════════════════════════════════════════════════════════════════════════════

function buildProofreadPrompt(extractedText, options = {}) {
  const { language = 'vietnamese', level = 'intermediate' } = options;
  
  const systemPrompt = `You are an expert English writing tutor. Analyze the text for:
1. Grammar errors (verb tenses, subject-verb agreement, article usage, prepositions, etc.)
2. Spelling errors
3. Punctuation errors
4. Word choice / vocabulary issues
5. Sentence structure problems

Return a detailed JSON response with word-level annotations.`;

  const userPrompt = `Please proofread this text:

---
${extractedText}
---

Requirements:
- Analyze word-by-word
- Classify each error by type: "grammar", "spelling", "punctuation", "word_choice", "sentence_structure"
- Provide corrections with brief explanations
- Suggest better vocabulary when appropriate
- Rate the overall writing quality

IMPORTANT: Return ONLY valid JSON in this exact format (no markdown, no explanation):

{
  "originalText": "the exact original text",
  "correctedText": "the fully corrected text",
  "score": 0-100,
  "grade": "A-F",
  "words": [
    {
      "text": "word",
      "index": 0,
      "isCorrect": true,
      "errorType": "grammar|spelling|punctuation|word_choice|sentence_structure|null",
      "reason": "brief explanation of error (in ${language})",
      "correction": "corrected word or null",
      "suggestions": ["alternative1", "alternative2"]
    }
  ],
  "sentences": [
    {
      "original": "original sentence",
      "corrected": "corrected sentence",
      "corrections": [
        {
          "word": "original word",
          "corrected": "corrected word",
          "type": "error type",
          "explanation": "why this is wrong (in ${language})"
        }
      ]
    }
  ],
  "summary": {
    "totalErrors": 0,
    "grammarErrors": 0,
    "spellingErrors": 0,
    "punctuationErrors": 0,
    "vocabularySuggestions": ["suggestion1", "suggestion2"]
  },
  "feedback": "overall feedback in ${language}"
}`;

  return { systemPrompt, userPrompt };
}

// ═══════════════════════════════════════════════════════════════════════════════
// AI PROOFREAD SERVICE
// ═══════════════════════════════════════════════════════════════════════════════

async function callAIProofread(text, options = {}) {
  let OpenAI;
  try {
    ({ default: OpenAI } = require('openai'));
  } catch {
    try {
      const openaiModule = require('openai');
      OpenAI = openaiModule.default || openaiModule;
    } catch {
      return { success: false, error: 'OpenAI not configured' };
    }
  }
  
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { success: false, error: 'OPENAI_API_KEY not set' };
  }

  const client = new OpenAI({ apiKey });
  const { systemPrompt, userPrompt } = buildProofreadPrompt(text, options);

  try {
    const response = await client.chat.completions.create({
      model: CONFIG.ai.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: CONFIG.ai.temperature,
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) {
      return { success: false, error: 'Empty AI response' };
    }

    let result;
    try {
      const jsonText = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      result = JSON.parse(jsonText);
    } catch (parseErr) {
      return { success: false, error: `JSON parse failed: ${parseErr.message}`, rawResponse: content };
    }

    return { success: true, result };

  } catch (err) {
    return { success: false, error: err.message };
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PROOFREAD FUNCTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Full proofread pipeline: OCR → AI Proofread
 * 
 * @param {Buffer} imageBuffer - Image file buffer
 * @param {Object} options
 * @param {string} options.geminiApiKey - Gemini API key for OCR
 * @param {string} options.language - Feedback language (default: 'vietnamese')
 * @param {string} options.level - Student level (default: 'intermediate')
 * @param {string} options.originalFilename - Original uploaded filename (e.g. 'photo.jpg')
 */
async function proofreadImage(imageBuffer, options = {}) {
  const errors = [];
  const startTime = Date.now();

  try {
    // ═══ Step 1: OCR ═══
    console.log('[proofread.service] Step 1: OCR extraction...');
    
    const ocrResult = await extractTextFromImage(
      imageBuffer,
      options.geminiApiKey || process.env.GEMINI_API_KEY,
      options.originalFilename || 'image.jpg'   // ✅ truyền filename xuống
    );

    if (!ocrResult.success || !ocrResult.text) {
      errors.push({ step: 'ocr', error: ocrResult.error || 'OCR failed' });
      return {
        success: false,
        message: 'Proofread failed',
        errors,
        processingTime: Date.now() - startTime
      };
    }

    console.log(`[proofread.service] OCR done: ${ocrResult.text.length} chars (${ocrResult.method})`);

    // ═══ Step 2: AI Proofread ═══
    console.log('[proofread.service] Step 2: AI proofreading...');

    const proofreadResult = await callAIProofread(ocrResult.text, {
      language: options.language || 'vietnamese',
      level: options.level || 'intermediate'
    });

    if (!proofreadResult.success) {
      errors.push({ step: 'proofread', error: proofreadResult.error });
      return {
        success: false,
        errors,
        ocrResult: {
          text: ocrResult.text,
          confidence: ocrResult.confidence,
          method: ocrResult.method
        },
        processingTime: Date.now() - startTime
      };
    }

    console.log(`[proofread.service] Proofread done: ${proofreadResult.result.summary?.totalErrors || 0} errors found`);

    // ═══ Step 3: Return combined result ═══
    return {
      success: true,
      errors: [],
      ocr: {
        text: ocrResult.text,
        confidence: ocrResult.confidence,
        method: ocrResult.method,
        geminiUsed: ocrResult.geminiUsed
      },
      result: proofreadResult.result,
      processingTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };

  } catch (err) {
    errors.push({ step: 'unknown', error: err.message });
    console.error('[proofread.service] Error:', err);
    return {
      success: false,
      errors,
      processingTime: Date.now() - startTime
    };
  }
}

/**
 * Just OCR (no AI proofread) - useful for testing
 */
async function ocrOnly(imageBuffer, geminiApiKey = null, originalFilename = 'image.jpg') {
  return extractTextFromImage(imageBuffer, geminiApiKey, originalFilename);
}

/**
 * Just proofread text (already have text, skip OCR)
 */
async function proofreadText(text, options = {}) {
  const proofreadResult = await callAIProofread(text, options);
  
  if (!proofreadResult.success) {
    return { success: false, error: proofreadResult.error };
  }

  return {
    success: true,
    result: proofreadResult.result,
    processingTime: 0
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  proofreadImage,
  proofreadText,
  ocrOnly,
  extractTextFromImage,
  callAIProofread,
  findPythonInterpreter,
  CONFIG,
};