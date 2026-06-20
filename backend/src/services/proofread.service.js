/**
 * AI OCR + proofreading service.
 *
 * Image flow:
 * 1. Run the local hybrid OCR pipeline (PaddleOCR with Gemini fallback).
 * 2. Send extracted text to Gemini for proofreading JSON.
 * 3. Return OCR text, word/phrase annotations, corrected text, and rewrite ideas.
 */

"use strict";

const fs = require("fs");
const path = require("path");
const os = require("os");
const { execFile } = require("child_process");
const util = require("util");
const axios = require("axios");

const execFileAsync = util.promisify(execFile);

const PROJECT_ROOT = path.join(__dirname, "..", "..", "..");
const BACKEND_ROOT = path.join(__dirname, "..", "..");

const CONFIG = {
  ocr: {
    hybridScriptPath: path.join(PROJECT_ROOT, "ocr", "hybridOcrGemini.py"),
    maxBuffer: 50 * 1024 * 1024,
  },
  ai: {
    provider: "gemini",
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    temperature: 0.1,
    maxOutputTokens: Number(process.env.GEMINI_MAX_OUTPUT_TOKENS) || 8192,
  },
  pythonCandidates:
    process.platform === "win32"
      ? [
          { command: "py", args: ["-3.11"] },
          { command: "py", args: ["-3"] },
          { command: "py", args: [] },
          { command: "python3.11", args: [] },
          { command: "python3", args: [] },
          { command: "python", args: [] },
        ]
      : [
          { command: "python3.11", args: [] },
          { command: "python3", args: [] },
          { command: "python", args: [] },
        ],
};

function labelPython(candidate) {
  return [candidate.command, ...(candidate.args || [])].join(" ");
}

function getVenvPythonCandidates() {
  const candidates = [];
  const venvRoots = [
    path.join(PROJECT_ROOT, ".venv"),
    path.join(BACKEND_ROOT, ".venv"),
    path.join(PROJECT_ROOT, "ocr", ".venv"),
  ];

  for (const venvRoot of venvRoots) {
    const pythonPath = path.join(
      venvRoot,
      process.platform === "win32" ? "Scripts" : "bin",
      process.platform === "win32" ? "python.exe" : "python"
    );

    if (fs.existsSync(pythonPath)) {
      candidates.push({ command: pythonPath, args: [] });
    }
  }

  return candidates;
}

async function runPython(candidate, args, options = {}) {
  return execFileAsync(candidate.command, [...(candidate.args || []), ...args], options);
}

async function checkPythonPackages(candidate) {
  const probe = `
import importlib.util, json

def has_module(name):
    try:
        return importlib.util.find_spec(name) is not None
    except Exception:
        return False

info = {
    "pillow": has_module("PIL"),
    "numpy": has_module("numpy"),
    "paddleocr": has_module("paddleocr"),
    "gemini": has_module("google.generativeai"),
}
info["usable"] = info["pillow"] and info["numpy"] and (info["paddleocr"] or info["gemini"])
print(json.dumps(info))
`;

  try {
    const { stdout } = await runPython(candidate, ["-c", probe], {
      timeout: 10000,
      maxBuffer: 1024 * 1024,
    });
    const info = JSON.parse(stdout.trim());
    return Boolean(info.usable);
  } catch {
    return false;
  }
}

async function findPythonInterpreter() {
  const candidates = [...getVenvPythonCandidates(), ...CONFIG.pythonCandidates];

  for (const candidate of candidates) {
    if (await checkPythonPackages(candidate)) {
      return candidate;
    }
  }

  return null;
}

function extractJsonFromText(text) {
  const raw = String(text || "").trim();
  if (!raw) {
    throw new Error("Empty JSON response");
  }

  const unfenced = raw
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(unfenced);
  } catch {
    const first = unfenced.indexOf("{");
    const last = unfenced.lastIndexOf("}");
    if (first === -1 || last === -1 || last <= first) {
      throw new Error("No JSON object found in response");
    }
    return JSON.parse(unfenced.slice(first, last + 1));
  }
}

function average(values) {
  const numbers = values.filter((value) => Number.isFinite(value));
  if (numbers.length === 0) return 0;
  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

function normalizeOcrPages(pages) {
  const safePages = Array.isArray(pages) ? pages : [];
  const pagesWithText = safePages.filter((page) => String(page?.text || "").trim());

  return {
    text: pagesWithText.map((page) => String(page.text).trim()).join("\n\n"),
    confidence: average(pagesWithText.map((page) => Number(page.confidence))),
    method:
      [...new Set(pagesWithText.map((page) => page.extractionMethod).filter(Boolean))].join("+") ||
      "unknown",
    geminiUsed: pagesWithText.some(
      (page) => Boolean(page.geminiUsed) || String(page.extractionMethod || "").includes("gemini")
    ),
  };
}

/**
 * Extract text from an uploaded image using Hybrid OCR (PaddleOCR + Gemini).
 */
async function extractTextFromImage(imageBuffer, geminiApiKey = null, originalFilename = "image.jpg") {
  const python = await findPythonInterpreter();
  if (!python) {
    return {
      success: false,
      error:
        "No usable Python OCR runtime found. Install pillow, numpy, and either paddleocr or google-generativeai in .venv; set GEMINI_API_KEY for Gemini OCR.",
      text: "",
    };
  }

  const ext = path.extname(originalFilename).toLowerCase() || ".jpg";
  const tempPath = path.join(
    os.tmpdir(),
    `proofread_${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`
  );

  try {
    await fs.promises.writeFile(tempPath, imageBuffer);

    const args = [CONFIG.ocr.hybridScriptPath, tempPath];
    if (geminiApiKey) {
      args.push("--api-key", geminiApiKey);
    }
    args.push("--pages", "0-1");

    console.log(`[proofread.service] OCR using ${labelPython(python)} on ${originalFilename}`);

    const { stdout, stderr } = await runPython(python, args, {
      maxBuffer: CONFIG.ocr.maxBuffer,
      timeout: 60000,
    });

    if (stderr) {
      console.warn("[proofread.service] OCR stderr:", stderr.slice(0, 2000));
    }

    const result = extractJsonFromText(stdout);
    const ocr = normalizeOcrPages(result.pages);

    if (!ocr.text) {
      return {
        success: false,
        error: Array.isArray(result.errors) && result.errors.length > 0
          ? result.errors.join("; ")
          : "OCR returned empty text",
        text: "",
      };
    }

    return {
      success: true,
      text: ocr.text,
      confidence: ocr.confidence,
      method: ocr.method,
      geminiUsed: ocr.geminiUsed,
    };
  } catch (err) {
    console.error("[proofread.service] OCR failed:", err.message);
    return { success: false, error: err.message, text: "" };
  } finally {
    if (fs.existsSync(tempPath)) {
      try {
        await fs.promises.unlink(tempPath);
      } catch {}
    }
  }
}

function buildProofreadPrompt(extractedText, options = {}) {
  const { language = "vietnamese", level = "intermediate" } = options;

  const systemPrompt = [
    "You are an expert English writing tutor for Vietnamese learners.",
    "Detect spelling, grammar, punctuation, word choice, and sentence-structure errors.",
    "Return only valid JSON. Do not include markdown or prose outside JSON.",
  ].join(" ");

  const userPrompt = `Proofread the OCR text below for a ${level} learner.

Text:
---
${extractedText}
---

Return this exact JSON shape:
{
  "originalText": "exact OCR text",
  "correctedText": "fully corrected text",
  "rewriteSuggestions": [
    "one improved rewrite of the whole text",
    "another natural rewrite if useful"
  ],
  "score": 0,
  "grade": "A-F",
  "words": [
    {
      "text": "token from original text",
      "index": 0,
      "isCorrect": true,
      "errorType": "grammar|spelling|punctuation|word_choice|sentence_structure|null",
      "reason": "short reason in ${language}",
      "correction": "corrected token or null",
      "suggestions": ["optional alternatives"]
    }
  ],
  "sentences": [
    {
      "original": "original sentence or phrase",
      "corrected": "corrected sentence or phrase",
      "corrections": [
        {
          "word": "wrong word or wrong grammar phrase",
          "corrected": "correction",
          "type": "grammar|spelling|punctuation|word_choice|sentence_structure",
          "explanation": "short explanation in ${language}"
        }
      ]
    }
  ],
  "summary": {
    "totalErrors": 0,
    "grammarErrors": 0,
    "spellingErrors": 0,
    "punctuationErrors": 0,
    "vocabularySuggestions": ["optional vocabulary suggestions"]
  },
  "feedback": "overall feedback in ${language}"
}

Important UI rules:
- Single wrong words should be marked as spelling, punctuation, or word_choice so the UI can color them red.
- Wrong grammar phrases should be marked as grammar or sentence_structure so the UI can underline them red.
- Include all original tokens in "words" when possible, not only incorrect tokens.`;

  return { systemPrompt, userPrompt };
}

function tokenizeWords(text) {
  return String(text || "")
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) => ({
      text: word,
      index,
      isCorrect: true,
      errorType: null,
      reason: null,
      correction: null,
      suggestions: [],
    }));
}

function normalizeErrorType(type) {
  const allowed = new Set([
    "grammar",
    "spelling",
    "punctuation",
    "word_choice",
    "sentence_structure",
    "null",
  ]);
  return allowed.has(type) ? type : null;
}

function normalizeProofreadResult(rawResult, originalText) {
  const result = rawResult && typeof rawResult === "object" ? rawResult : {};
  const words = Array.isArray(result.words) && result.words.length > 0
    ? result.words.map((word, index) => ({
        text: String(word?.text ?? ""),
        index: Number.isInteger(word?.index) ? word.index : index,
        isCorrect: Boolean(word?.isCorrect),
        errorType: normalizeErrorType(word?.errorType),
        reason: word?.reason ? String(word.reason) : null,
        correction: word?.correction ? String(word.correction) : null,
        suggestions: Array.isArray(word?.suggestions) ? word.suggestions.map(String) : [],
      }))
    : tokenizeWords(originalText);

  const sentences = Array.isArray(result.sentences)
    ? result.sentences.map((sentence) => ({
        original: String(sentence?.original || ""),
        corrected: String(sentence?.corrected || ""),
        corrections: Array.isArray(sentence?.corrections)
          ? sentence.corrections.map((correction) => ({
              word: correction?.word ? String(correction.word) : "",
              corrected: correction?.corrected ? String(correction.corrected) : "",
              type: correction?.type ? String(correction.type) : "",
              explanation: correction?.explanation ? String(correction.explanation) : "",
            }))
          : [],
      }))
    : [];

  const summary = result.summary && typeof result.summary === "object" ? result.summary : {};
  const incorrectWords = words.filter((word) => !word.isCorrect && word.errorType && word.errorType !== "null");

  return {
    originalText: String(result.originalText || originalText || ""),
    correctedText: String(result.correctedText || originalText || ""),
    rewriteSuggestions: Array.isArray(result.rewriteSuggestions)
      ? result.rewriteSuggestions.map(String).filter(Boolean).slice(0, 5)
      : [],
    score: Number.isFinite(Number(result.score)) ? Number(result.score) : null,
    grade: result.grade ? String(result.grade) : "N/A",
    words,
    sentences,
    summary: {
      totalErrors: Number.isFinite(Number(summary.totalErrors))
        ? Number(summary.totalErrors)
        : incorrectWords.length,
      grammarErrors: Number.isFinite(Number(summary.grammarErrors))
        ? Number(summary.grammarErrors)
        : incorrectWords.filter((word) => word.errorType === "grammar").length,
      spellingErrors: Number.isFinite(Number(summary.spellingErrors))
        ? Number(summary.spellingErrors)
        : incorrectWords.filter((word) => word.errorType === "spelling").length,
      punctuationErrors: Number.isFinite(Number(summary.punctuationErrors))
        ? Number(summary.punctuationErrors)
        : incorrectWords.filter((word) => word.errorType === "punctuation").length,
      vocabularySuggestions: Array.isArray(summary.vocabularySuggestions)
        ? summary.vocabularySuggestions.map(String).filter(Boolean)
        : [],
    },
    feedback: result.feedback ? String(result.feedback) : "",
  };
}

function createFallbackProofreadResult(text, reason) {
  return {
    originalText: text,
    correctedText: text,
    rewriteSuggestions: [],
    score: null,
    grade: "N/A",
    words: tokenizeWords(text),
    sentences: [
      {
        original: text,
        corrected: text,
        corrections: [],
      },
    ],
    summary: {
      totalErrors: 0,
      grammarErrors: 0,
      spellingErrors: 0,
      punctuationErrors: 0,
      vocabularySuggestions: [],
    },
    feedback: reason || "AI proofreading is unavailable, but OCR text was extracted successfully.",
  };
}

async function callGeminiProofread(text, options = {}) {
  const apiKey = options.geminiApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { success: false, error: "GEMINI_API_KEY not set", provider: "gemini" };
  }

  const model = options.model || CONFIG.ai.model;
  const { systemPrompt, userPrompt } = buildProofreadPrompt(text, options);
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  try {
    const response = await axios.post(
      endpoint,
      {
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
          },
        ],
        generationConfig: {
          temperature: CONFIG.ai.temperature,
          maxOutputTokens: CONFIG.ai.maxOutputTokens,
          responseMimeType: "application/json",
        },
      },
      {
        params: { key: apiKey },
        timeout: 60000,
      }
    );

    const parts = response.data?.candidates?.[0]?.content?.parts || [];
    const content = parts.map((part) => part.text || "").join("").trim();
    if (!content) {
      return { success: false, error: "Empty Gemini response", provider: "gemini" };
    }

    const parsed = extractJsonFromText(content);
    return {
      success: true,
      result: normalizeProofreadResult(parsed, text),
      provider: "gemini",
    };
  } catch (err) {
    const apiMessage =
      err.response?.data?.error?.message ||
      err.response?.data?.message ||
      err.message ||
      "Gemini request failed";
    return { success: false, error: apiMessage, provider: "gemini" };
  }
}

async function callAIProofread(text, options = {}) {
  return callGeminiProofread(text, options);
}

function buildOcrPayload(ocrResult) {
  return {
    text: ocrResult.text,
    confidence: ocrResult.confidence,
    method: ocrResult.method,
    geminiUsed: ocrResult.geminiUsed,
  };
}

async function proofreadImage(imageBuffer, options = {}) {
  const errors = [];
  const startTime = Date.now();

  try {
    console.log("[proofread.service] Step 1: OCR extraction");

    const ocrResult = await extractTextFromImage(
      imageBuffer,
      options.geminiApiKey || process.env.GEMINI_API_KEY,
      options.originalFilename || "image.jpg"
    );

    if (!ocrResult.success || !ocrResult.text) {
      errors.push({ step: "ocr", error: ocrResult.error || "OCR failed" });
      return {
        success: false,
        message: "OCR failed",
        errors,
        processingTime: Date.now() - startTime,
      };
    }

    console.log(`[proofread.service] OCR done: ${ocrResult.text.length} chars (${ocrResult.method})`);
    console.log("[proofread.service] Step 2: Gemini proofreading");

    const proofreadResult = await callAIProofread(ocrResult.text, {
      language: options.language || "vietnamese",
      level: options.level || "intermediate",
      geminiApiKey: options.geminiApiKey || process.env.GEMINI_API_KEY,
    });

    let result = proofreadResult.result;
    let proofreadProvider = proofreadResult.provider || "gemini";

    if (!proofreadResult.success) {
      errors.push({ step: "proofread", error: proofreadResult.error });
      result = createFallbackProofreadResult(
        ocrResult.text,
        `OCR completed, but AI proofreading is unavailable: ${proofreadResult.error}`
      );
      proofreadProvider = "local-fallback";
    }

    return {
      success: true,
      errors,
      ocr: buildOcrPayload(ocrResult),
      result,
      proofreadProvider,
      processingTime: Date.now() - startTime,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    errors.push({ step: "unknown", error: err.message });
    console.error("[proofread.service] Error:", err);
    return {
      success: false,
      errors,
      processingTime: Date.now() - startTime,
    };
  }
}

async function ocrOnly(imageBuffer, geminiApiKey = null, originalFilename = "image.jpg") {
  return extractTextFromImage(imageBuffer, geminiApiKey, originalFilename);
}

async function proofreadText(text, options = {}) {
  const startTime = Date.now();
  const proofreadResult = await callAIProofread(text, options);

  if (!proofreadResult.success) {
    return {
      success: true,
      errors: [{ step: "proofread", error: proofreadResult.error }],
      result: createFallbackProofreadResult(
        text,
        `AI proofreading is unavailable: ${proofreadResult.error}`
      ),
      proofreadProvider: "local-fallback",
      processingTime: Date.now() - startTime,
    };
  }

  return {
    success: true,
    errors: [],
    result: proofreadResult.result,
    proofreadProvider: proofreadResult.provider,
    processingTime: Date.now() - startTime,
  };
}

module.exports = {
  proofreadImage,
  proofreadText,
  ocrOnly,
  extractTextFromImage,
  callAIProofread,
  findPythonInterpreter,
  CONFIG,
};
