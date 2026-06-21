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

function stripJsonFences(text) {
  return String(text || "")
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function getJsonCandidate(text) {
  const unfenced = stripJsonFences(text);
  const objectStart = unfenced.indexOf("{");
  const objectEnd = unfenced.lastIndexOf("}");

  if (objectStart !== -1 && objectEnd > objectStart) {
    return unfenced.slice(objectStart, objectEnd + 1);
  }

  const arrayStart = unfenced.indexOf("[");
  const arrayEnd = unfenced.lastIndexOf("]");

  if (arrayStart !== -1 && arrayEnd > arrayStart) {
    return unfenced.slice(arrayStart, arrayEnd + 1);
  }

  return unfenced;
}

function removeTrailingCommas(text) {
  return String(text || "").replace(/,\s*([}\]])/g, "$1");
}

function escapeBareControlCharsInStrings(text) {
  let output = "";
  let inString = false;
  let escaped = false;

  for (const char of String(text || "")) {
    if (!inString) {
      output += char;
      if (char === "\"") {
        inString = true;
      }
      continue;
    }

    if (escaped) {
      output += char;
      escaped = false;
      continue;
    }

    if (char === "\\") {
      output += char;
      escaped = true;
      continue;
    }

    if (char === "\"") {
      output += char;
      inString = false;
      continue;
    }

    if (char === "\n") {
      output += "\\n";
    } else if (char === "\r") {
      output += "\\r";
    } else if (char === "\t") {
      output += "\\t";
    } else {
      output += char;
    }
  }

  return output;
}

function startsJsonValue(char) {
  return char === "{"
    || char === "["
    || char === "\""
    || char === "-"
    || /[0-9tfn]/.test(char);
}

function startsJsonPrimitive(char) {
  return char === "-" || /[0-9tfn]/.test(char);
}

function completeJsonValue(stack) {
  const parent = stack[stack.length - 1];
  if (parent) {
    parent.expecting = "commaOrEnd";
  }
}

function insertMissingCommas(text) {
  const stack = [];
  let output = "";
  let inString = false;
  let escaped = false;
  let stringRole = null;

  const current = () => stack[stack.length - 1];

  for (let index = 0; index < String(text || "").length; index += 1) {
    let char = text[index];

    if (inString) {
      output += char;

      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
        const ctx = current();

        if (stringRole === "key" && ctx) {
          ctx.expecting = "colon";
        } else {
          completeJsonValue(stack);
        }

        stringRole = null;
      }

      continue;
    }

    if (/\s/.test(char)) {
      output += char;
      continue;
    }

    const ctx = current();
    if (ctx?.expecting === "commaOrEnd") {
      const isClosing =
        (ctx.type === "object" && char === "}") || (ctx.type === "array" && char === "]");
      const canStartNextValue =
        (ctx.type === "object" && char === "\"") || (ctx.type === "array" && startsJsonValue(char));

      if (!isClosing && char !== "," && canStartNextValue) {
        output += ",";
        ctx.expecting = ctx.type === "object" ? "keyOrEnd" : "valueOrEnd";
      }
    }

    if (char === "{") {
      output += char;
      stack.push({ type: "object", expecting: "keyOrEnd" });
      continue;
    }

    if (char === "[") {
      output += char;
      stack.push({ type: "array", expecting: "valueOrEnd" });
      continue;
    }

    if (char === "}" || char === "]") {
      output += char;
      stack.pop();
      completeJsonValue(stack);
      continue;
    }

    if (char === ":") {
      output += char;
      if (current()?.type === "object") {
        current().expecting = "value";
      }
      continue;
    }

    if (char === ",") {
      output += char;
      if (current()) {
        current().expecting = current().type === "object" ? "keyOrEnd" : "valueOrEnd";
      }
      continue;
    }

    if (char === "\"") {
      const active = current();
      inString = true;
      escaped = false;
      stringRole = active?.type === "object" && active.expecting === "keyOrEnd" ? "key" : "value";
      output += char;
      continue;
    }

    if (startsJsonPrimitive(char)) {
      let primitive = "";
      let cursor = index;

      while (cursor < text.length && !/[\s,\]\}]/.test(text[cursor])) {
        primitive += text[cursor];
        cursor += 1;
      }

      output += primitive;
      index = cursor - 1;
      completeJsonValue(stack);
      continue;
    }

    output += char;
  }

  return output;
}

function sliceFromFirstJson(text) {
  const unfenced = stripJsonFences(text);
  const objectStart = unfenced.indexOf("{");
  const arrayStart = unfenced.indexOf("[");
  const candidates = [objectStart, arrayStart].filter((index) => index !== -1);

  if (candidates.length === 0) {
    return unfenced;
  }

  return unfenced.slice(Math.min(...candidates));
}

/**
 * Close a JSON string that was cut off (e.g. Gemini hit maxOutputTokens
 * mid-array). Keeps the largest safely-closeable prefix and appends the
 * missing string/array/object terminators so partial proofreading data
 * survives instead of failing the whole response.
 */
function closeTruncatedJson(text) {
  const str = String(text || "");
  if (!str) return str;

  const stack = [];
  let inString = false;
  let escaped = false;
  let stringRole = null;
  let safeLen = 0;
  let safeStack = [];

  const top = () => stack[stack.length - 1];
  const recordSafe = (lengthAfter) => {
    safeLen = lengthAfter;
    safeStack = stack.map((entry) => entry.type);
  };

  for (let index = 0; index < str.length; index += 1) {
    const char = str[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
        const ctx = top();
        if (stringRole === "key") {
          if (ctx) ctx.expecting = "colon";
        } else {
          if (ctx) ctx.expecting = "commaOrEnd";
          recordSafe(index + 1);
        }
        stringRole = null;
      }
      continue;
    }

    if (/\s/.test(char)) continue;

    if (char === "\"") {
      const ctx = top();
      inString = true;
      escaped = false;
      stringRole = ctx && ctx.type === "object" && ctx.expecting !== "value" ? "key" : "value";
      continue;
    }

    if (char === "{") {
      stack.push({ type: "object", expecting: "keyOrEnd" });
      recordSafe(index + 1);
      continue;
    }

    if (char === "[") {
      stack.push({ type: "array", expecting: "valueOrEnd" });
      recordSafe(index + 1);
      continue;
    }

    if (char === "}" || char === "]") {
      stack.pop();
      const ctx = top();
      if (ctx) ctx.expecting = "commaOrEnd";
      recordSafe(index + 1);
      continue;
    }

    if (char === ":") {
      const ctx = top();
      if (ctx) ctx.expecting = "value";
      continue;
    }

    if (char === ",") {
      const ctx = top();
      if (ctx) ctx.expecting = ctx.type === "object" ? "key" : "value";
      recordSafe(index);
      continue;
    }

    if (startsJsonPrimitive(char)) {
      let cursor = index;
      while (cursor < str.length && !/[\s,\]\}]/.test(str[cursor])) {
        cursor += 1;
      }
      const ctx = top();
      if (ctx) ctx.expecting = "commaOrEnd";
      if (cursor < str.length) {
        recordSafe(cursor);
      }
      index = cursor - 1;
      continue;
    }
  }

  if (stack.length === 0) {
    return str;
  }

  let closers = "";
  for (let index = safeStack.length - 1; index >= 0; index -= 1) {
    closers += safeStack[index] === "object" ? "}" : "]";
  }

  return str.slice(0, safeLen).replace(/,\s*$/, "") + closers;
}

function buildJsonParseCandidates(text) {
  const candidate = getJsonCandidate(text);
  const escaped = escapeBareControlCharsInStrings(candidate);
  const commaFixed = insertMissingCommas(escaped);

  // Truncation-tolerant branch: keep everything from the first structural
  // character (do not assume a matching closing brace exists) and close any
  // unterminated string/array/object so partial results stay recoverable.
  const fromStart = insertMissingCommas(escapeBareControlCharsInStrings(sliceFromFirstJson(text)));
  const closed = closeTruncatedJson(fromStart);

  return [
    candidate,
    removeTrailingCommas(candidate),
    escaped,
    removeTrailingCommas(escaped),
    commaFixed,
    removeTrailingCommas(commaFixed),
    closed,
    removeTrailingCommas(closed),
  ].filter((item, index, list) => item && list.indexOf(item) === index);
}

function extractJsonFromText(text) {
  const raw = String(text || "").trim();
  if (!raw) {
    throw new Error("Empty JSON response");
  }

  let lastError = null;
  for (const candidate of buildJsonParseCandidates(raw)) {
    try {
      return JSON.parse(candidate);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError || new Error("No JSON object found in response");
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

function normalizeUploadExtension(originalFilename) {
  const ext = path.extname(originalFilename || "").toLowerCase();
  const allowedImageExts = new Set([
    ".jpg",
    ".jpeg",
    ".jfif",
    ".png",
    ".gif",
    ".webp",
    ".bmp",
    ".tiff",
    ".tif",
  ]);

  if (!allowedImageExts.has(ext)) {
    return ".jpg";
  }

  return ext === ".jfif" ? ".jpg" : ext;
}

function redactSensitiveText(value, secrets = []) {
  let text = String(value || "");
  const uniqueSecrets = [...new Set(secrets.filter((secret) => typeof secret === "string" && secret.length > 4))];

  for (const secret of uniqueSecrets) {
    text = text.split(secret).join("[REDACTED]");
  }

  return text
    .replace(/(--api-key(?:=|\s+))("[^"]+"|'[^']+'|\S+)/gi, "$1[REDACTED]")
    .replace(/([?&]key=)[^&\s]+/gi, "$1[REDACTED]");
}

function sanitizeOcrError(err, geminiApiKey) {
  const raw = err?.stderr || err?.message || String(err || "OCR failed");
  return redactSensitiveText(raw, [geminiApiKey, process.env.GEMINI_API_KEY]);
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

  const ext = normalizeUploadExtension(originalFilename);
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
          ? redactSensitiveText(result.errors.join("; "), [geminiApiKey, process.env.GEMINI_API_KEY])
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
    const sanitizedError = sanitizeOcrError(err, geminiApiKey);
    console.error("[proofread.service] OCR failed:", sanitizedError);
    return { success: false, error: sanitizedError, text: "" };
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
- Keep JSON compact: "words" should contain incorrect tokens/phrases only. The server will tokenize correct original words locally.
- Do not repeat the original text back; the server already keeps the OCR text. Only return the fields above.
- Correct capitalization, contractions, articles, plurals, subject-verb agreement, tense, and sentence starts.
- Do not return totalErrors 0 unless the OCR text is already fully standard English.
- If correctedText differs from originalText, every changed original word or phrase must appear in "words" or "sentences.corrections".
- Use double-quoted valid JSON strings and escape any quote characters inside values.`;

  return { systemPrompt, userPrompt };
}

function buildCompactProofreadPrompt(extractedText, options = {}) {
  const { language = "vietnamese", level = "intermediate" } = options;

  const systemPrompt = [
    "You are an expert English writing tutor for Vietnamese learners.",
    "Return only one compact, valid JSON object.",
    "Do not include markdown or prose outside JSON.",
  ].join(" ");

  const userPrompt = `Proofread this OCR text for a ${level} learner.

Text:
---
${extractedText}
---

Return compact JSON in this exact shape. Include incorrect words/phrases only:
{
  "correctedText": "fully corrected text",
  "rewriteSuggestions": ["optional rewrite"],
  "score": 0,
  "grade": "A-F",
  "words": [
    {
      "text": "wrong original token or phrase",
      "index": 0,
      "isCorrect": false,
      "errorType": "grammar|spelling|punctuation|word_choice|sentence_structure",
      "reason": "short reason in ${language}",
      "correction": "correction",
      "suggestions": []
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
    "vocabularySuggestions": []
  },
  "feedback": "overall feedback in ${language}"
}

Rules:
- Do not list correct words.
- Do not repeat the original text back; the server already keeps the OCR text. Only return the fields above.
- Correct capitalization, contractions, articles, plurals, subject-verb agreement, tense, and sentence starts.
- Do not return totalErrors 0 unless the OCR text is already fully standard English.
- If correctedText differs from originalText, every changed original word or phrase must appear in words[] or sentences[].corrections.
- Put phrase-level grammar issues in sentences[].corrections so the UI can underline the full phrase.
- Put spelling, punctuation, and word-choice issues in words[] so the UI can color them red.
- Use valid JSON only. Escape quote characters inside strings.`;

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
  if (type === null || type === undefined) return null;

  const normalized = String(type)
    .trim()
    .toLowerCase()
    .replace(/[-\s]+/g, "_");

  if (!normalized || normalized === "null" || normalized === "none" || normalized === "correct") {
    return null;
  }

  const aliases = {
    wordchoice: "word_choice",
    vocabulary: "word_choice",
    vocabulary_choice: "word_choice",
    structure: "sentence_structure",
    sentence: "sentence_structure",
  };

  const canonical = aliases[normalized] || normalized;
  const allowed = new Set([
    "grammar",
    "spelling",
    "punctuation",
    "word_choice",
    "sentence_structure",
  ]);
  return allowed.has(canonical) ? canonical : null;
}

function normalizeBoolean(value, fallback = true) {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const lowered = value.trim().toLowerCase();
    if (lowered === "true") return true;
    if (lowered === "false") return false;
  }
  return fallback;
}

function normalizeComparableToken(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/^[^a-z0-9']+|[^a-z0-9']+$/g, "");
}

function splitComparableTokens(value) {
  return String(value || "")
    .split(/\s+/)
    .map(normalizeComparableToken)
    .filter(Boolean);
}

function findTokenPhrase(words, phrase, startIndex = 0, preferUnmarked = true) {
  const phraseTokens = Array.isArray(phrase) ? phrase : splitComparableTokens(phrase);
  if (phraseTokens.length === 0 || words.length === 0) {
    return -1;
  }

  const maxStart = words.length - phraseTokens.length;
  const search = (onlyUnmarked) => {
    for (let index = Math.max(0, startIndex); index <= maxStart; index += 1) {
      let matches = true;

      for (let offset = 0; offset < phraseTokens.length; offset += 1) {
        if (normalizeComparableToken(words[index + offset]?.text) !== phraseTokens[offset]) {
          matches = false;
          break;
        }
      }

      if (matches && (!onlyUnmarked || words.slice(index, index + phraseTokens.length).every((word) => word.isCorrect))) {
        return index;
      }
    }

    return -1;
  };

  if (preferUnmarked) {
    const unmarked = search(true);
    if (unmarked !== -1) return unmarked;
  }

  const fromStart = search(false);
  if (fromStart !== -1) return fromStart;

  if (startIndex > 0) {
    return findTokenPhrase(words, phraseTokens, 0, preferUnmarked);
  }

  return -1;
}

function applyWordAnnotation(words, startIndex, length, annotation) {
  if (startIndex < 0 || length <= 0) return;

  for (let offset = 0; offset < length; offset += 1) {
    const target = words[startIndex + offset];
    if (!target) continue;

    target.isCorrect = false;
    target.errorType = annotation.errorType;
    target.reason = annotation.reason || target.reason || null;
    target.correction = annotation.correction || target.correction || null;
    target.suggestions = annotation.suggestions?.length ? annotation.suggestions : target.suggestions || [];
  }
}

function normalizeRawWordAnnotation(word, index) {
  const errorType = normalizeErrorType(word?.errorType || word?.type);
  const isCorrect = normalizeBoolean(word?.isCorrect, !errorType);

  return {
    text: String(word?.text ?? word?.word ?? ""),
    index: Number.isInteger(word?.index) ? word.index : index,
    isCorrect,
    errorType,
    reason: word?.reason || word?.explanation ? String(word?.reason || word?.explanation) : null,
    correction: word?.correction || word?.corrected ? String(word?.correction || word?.corrected) : null,
    suggestions: Array.isArray(word?.suggestions) ? word.suggestions.map(String) : [],
  };
}

function applyRawWordAnnotations(baseWords, rawWords) {
  let searchStart = 0;

  rawWords.forEach((word, fallbackIndex) => {
    const annotation = normalizeRawWordAnnotation(word, fallbackIndex);
    if (!annotation.errorType || annotation.isCorrect) return;

    const phraseTokens = splitComparableTokens(annotation.text);
    if (phraseTokens.length === 0) return;

    let startIndex = -1;
    if (
      Number.isInteger(annotation.index)
      && annotation.index >= 0
      && annotation.index < baseWords.length
      && normalizeComparableToken(baseWords[annotation.index]?.text) === phraseTokens[0]
    ) {
      startIndex = annotation.index;
    }

    if (startIndex === -1) {
      startIndex = findTokenPhrase(baseWords, phraseTokens, searchStart);
    }

    if (startIndex !== -1) {
      applyWordAnnotation(baseWords, startIndex, phraseTokens.length, annotation);
      searchStart = startIndex + phraseTokens.length;
    }
  });
}

function normalizeSentenceCorrections(sentences) {
  return Array.isArray(sentences)
    ? sentences.map((sentence) => ({
        original: String(sentence?.original || ""),
        corrected: String(sentence?.corrected || ""),
        corrections: Array.isArray(sentence?.corrections)
          ? sentence.corrections.map((correction) => ({
              word: correction?.word ? String(correction.word) : "",
              corrected: correction?.corrected ? String(correction.corrected) : "",
              type: normalizeErrorType(correction?.type),
              explanation: correction?.explanation ? String(correction.explanation) : "",
            }))
          : [],
      }))
    : [];
}

function applySentenceCorrections(baseWords, sentences) {
  sentences.forEach((sentence) => {
    sentence.corrections.forEach((correction) => {
      const errorType = normalizeErrorType(correction.type);
      const phraseTokens = splitComparableTokens(correction.word);
      if (!errorType || phraseTokens.length === 0) return;

      const startIndex = findTokenPhrase(baseWords, phraseTokens, 0, true);
      if (startIndex === -1) return;

      applyWordAnnotation(baseWords, startIndex, phraseTokens.length, {
        errorType,
        reason: correction.explanation,
        correction: correction.corrected,
        suggestions: correction.corrected ? [correction.corrected] : [],
      });
    });
  });
}

function buildAnnotatedWords(rawWords, originalText, sentences) {
  const baseWords = tokenizeWords(originalText);
  if (baseWords.length === 0 && Array.isArray(rawWords) && rawWords.length > 0) {
    return rawWords.map((word, index) => normalizeRawWordAnnotation(word, index));
  }

  if (Array.isArray(rawWords) && rawWords.length > 0) {
    applyRawWordAnnotations(baseWords, rawWords);
  }

  applySentenceCorrections(baseWords, sentences);

  return baseWords;
}

function normalizeProofreadResult(rawResult, originalText) {
  const result = rawResult && typeof rawResult === "object" ? rawResult : {};
  // Prefer the authoritative source text (OCR output or user input) over any
  // value Gemini echoes back, so displayed tokens always match the real text
  // and the model never has to repeat the whole document.
  const original = String(originalText || result.originalText || "");
  const sentences = normalizeSentenceCorrections(result.sentences);
  const words = buildAnnotatedWords(result.words, original, sentences);

  const summary = result.summary && typeof result.summary === "object" ? result.summary : {};
  const incorrectWords = words.filter((word) => !word.isCorrect && word.errorType && word.errorType !== "null");

  return {
    originalText: original,
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
        : incorrectWords.filter((word) => word.errorType === "grammar" || word.errorType === "sentence_structure").length,
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

function countDetectedErrors(result) {
  if (!result) return 0;

  const summaryCount = Number(result.summary?.totalErrors);
  const wordCount = Array.isArray(result.words)
    ? result.words.filter((word) => !word.isCorrect && normalizeErrorType(word.errorType)).length
    : 0;
  const sentenceCount = Array.isArray(result.sentences)
    ? result.sentences.reduce(
        (sum, sentence) => sum + (Array.isArray(sentence.corrections) ? sentence.corrections.length : 0),
        0
      )
    : 0;

  return Math.max(Number.isFinite(summaryCount) ? summaryCount : 0, wordCount, sentenceCount);
}

function normalizedTextForComparison(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function looksLikeLikelyLearnerMistakes(text) {
  const source = String(text || "");
  const lowered = source.toLowerCase();
  const patterns = [
    /\bi\b/,
    /\bim\b/,
    /\b\d+\s+year old\b/,
    /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+year old\b/,
    /\bthere is\s+(\d+|many|some|several)\s+\w+s\b/,
    /\bthey are my parent\b/,
    /\bmy parent\b/,
    /\bit help\b/,
    /\bmany friend\b/,
    /\byesterday\s+i\s+go\b/,
  ];

  return patterns.some((pattern) => pattern.test(lowered));
}

function shouldRetryCompactProofread(result, originalText) {
  if (countDetectedErrors(result) > 0) return false;
  if (normalizedTextForComparison(result?.correctedText) !== normalizedTextForComparison(originalText)) {
    return true;
  }
  return looksLikeLikelyLearnerMistakes(originalText);
}

function createLocalCommonProofreadResult(text) {
  const originalText = String(text || "");
  let correctedText = originalText;
  const wordCorrections = [];
  const sentenceCorrections = [];
  const seen = new Set();

  const addCorrection = ({ matchText, corrected, type, explanation, wordLevel = false, position = null }) => {
    const source = String(matchText || "");
    const replacement = String(corrected || "");
    const key = `${position ?? "manual"}|${source.toLowerCase()}|${replacement.toLowerCase()}|${type}`;
    if (!source || !replacement || source === replacement || seen.has(key)) return;

    seen.add(key);
    if (wordLevel) {
      wordCorrections.push({
        text: source,
        index: 0,
        isCorrect: false,
        errorType: type,
        reason: explanation,
        correction: replacement,
        suggestions: [replacement],
      });
    }

    sentenceCorrections.push({
      word: source,
      corrected: replacement,
      type,
      explanation,
    });
  };

  const addRegexCorrections = (regex, buildCorrection, type, explanation, options = {}) => {
    for (const match of originalText.matchAll(regex)) {
      addCorrection({
        matchText: match[0],
        corrected: buildCorrection(match),
        type,
        explanation,
        wordLevel: Boolean(options.wordLevel),
        position: match.index,
      });
    }
  };

  addRegexCorrections(
    /\byesterday\s+i\s+go\b/gi,
    () => "yesterday I went",
    "grammar",
    "Sau yesterday cần dùng thì quá khứ."
  );
  addRegexCorrections(
    /\bthere is\s+(\d+|many|some|several)\s+(\w+s)\b/gi,
    (match) => `there are ${match[1]} ${match[2]}`,
    "grammar",
    "Dùng are với danh từ số nhiều."
  );
  addRegexCorrections(
    /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+year old\b/gi,
    (match) => `${match[1]} years old`,
    "grammar",
    "Khi nói tuổi cần dùng years old."
  );
  addRegexCorrections(
    /\bthey are my parent\b/gi,
    () => "they are my parents",
    "grammar",
    "Parent cần ở dạng số nhiều trong ngữ cảnh này."
  );
  addRegexCorrections(
    /\bit help\b/gi,
    () => "it helps",
    "grammar",
    "Chủ ngữ it cần động từ thêm s."
  );
  addRegexCorrections(
    /\bmany friend\b/gi,
    () => "many friends",
    "grammar",
    "Many đi với danh từ số nhiều."
  );
  addRegexCorrections(
    /\bim\b/g,
    () => "I'm",
    "spelling",
    "Dạng đúng là I'm.",
    { wordLevel: true }
  );
  addRegexCorrections(
    /\bi\b/g,
    () => "I",
    "punctuation",
    "Đại từ I luôn viết hoa.",
    { wordLevel: true }
  );
  if (/^hi\b/.test(originalText)) {
    addCorrection({
      matchText: "hi",
      corrected: "Hi",
      type: "punctuation",
      explanation: "Viết hoa chữ đầu câu.",
      wordLevel: true,
    });
  }

  correctedText = correctedText
    .replace(/\byesterday\s+i\s+go\b/gi, "yesterday I went")
    .replace(/\bthere is\s+(\d+|many|some|several)\s+(\w+s)\b/gi, "there are $1 $2")
    .replace(
      /\b(\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+year old\b/gi,
      "$1 years old"
    )
    .replace(/\bthey are my parent\b/gi, "they are my parents")
    .replace(/\bit help\b/gi, "it helps")
    .replace(/\bmany friend\b/gi, "many friends")
    .replace(/\bim\b/g, "I'm")
    .replace(/\bi\b/g, "I")
    .replace(/^hi\b/, "Hi");

  const totalErrors = sentenceCorrections.length;
  const grammarErrors = sentenceCorrections.filter((item) => (
    item.type === "grammar" || item.type === "sentence_structure"
  )).length;
  const spellingErrors = sentenceCorrections.filter((item) => item.type === "spelling").length;
  const punctuationErrors = sentenceCorrections.filter((item) => item.type === "punctuation").length;

  return normalizeProofreadResult(
    {
      originalText,
      correctedText,
      rewriteSuggestions: [],
      score: totalErrors > 0 ? Math.max(50, 100 - totalErrors * 6) : null,
      grade: totalErrors > 0 ? "B" : "N/A",
      words: wordCorrections,
      sentences: [
        {
          original: originalText,
          corrected: correctedText,
          corrections: sentenceCorrections,
        },
      ],
      summary: {
        totalErrors,
        grammarErrors,
        spellingErrors,
        punctuationErrors,
        vocabularySuggestions: [],
      },
      feedback: totalErrors > 0
        ? "AI proofreading returned no clear errors, so common learner mistakes were marked locally."
        : "",
    },
    originalText
  );
}

/**
 * Build the result shown when Gemini proofreading is fully unavailable
 * (broken JSON in both attempts, missing key, quota, etc.). Runs the local
 * common-mistake detector so the learner still sees typical spelling/grammar
 * marks instead of unannotated OCR text.
 */
function buildProofreadFallbackResult(text, reason) {
  const local = createLocalCommonProofreadResult(text);

  return {
    ...local,
    feedback:
      countDetectedErrors(local) > 0
        ? "AI proofreading was unavailable, so common learner mistakes were checked locally. Please review carefully."
        : reason || "AI proofreading is unavailable, but the OCR text was extracted successfully.",
  };
}

function extractGeminiResponseText(response) {
  const parts = response.data?.candidates?.[0]?.content?.parts || [];
  return parts.map((part) => part.text || "").join("").trim();
}

async function repairGeminiJsonResponse(malformedContent, options = {}) {
  const apiKey = options.geminiApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { success: false, error: "GEMINI_API_KEY not set" };
  }

  const model = options.model || CONFIG.ai.model;
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  const clippedContent = String(malformedContent || "").slice(0, 20000);
  const clippedOriginalText = String(options.originalText || "").slice(0, 12000);

  const prompt = `Repair the following malformed JSON into one valid JSON object.
Return only JSON. Do not add markdown.
Preserve the proofreading data and use this OCR text as the originalText if needed:
---
${clippedOriginalText}
---

Malformed JSON:
---
${clippedContent}
---`;

  try {
    const response = await axios.post(
      endpoint,
      {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          temperature: 0,
          maxOutputTokens: CONFIG.ai.maxOutputTokens,
          responseMimeType: "application/json",
        },
      },
      {
        params: { key: apiKey },
        timeout: 60000,
      }
    );

    const content = extractGeminiResponseText(response);
    if (!content) {
      return { success: false, error: "Empty Gemini JSON repair response" };
    }

    return { success: true, result: extractJsonFromText(content) };
  } catch (err) {
    const apiMessage =
      err.response?.data?.error?.message ||
      err.response?.data?.message ||
      err.message ||
      "Gemini JSON repair failed";
    return { success: false, error: apiMessage };
  }
}

async function callGeminiCompactProofread(text, options = {}) {
  const apiKey = options.geminiApiKey || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return { success: false, error: "GEMINI_API_KEY not set", provider: "gemini-compact" };
  }

  const model = options.model || CONFIG.ai.model;
  const { systemPrompt, userPrompt } = buildCompactProofreadPrompt(text, options);
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;
  // Keep the full token budget: the compact retry is the reliable path, so it
  // must not truncate sooner than the full attempt it is recovering from.
  const maxOutputTokens = CONFIG.ai.maxOutputTokens;

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
          temperature: 0,
          maxOutputTokens,
          responseMimeType: "application/json",
        },
      },
      {
        params: { key: apiKey },
        timeout: 60000,
      }
    );

    const content = extractGeminiResponseText(response);
    if (!content) {
      return { success: false, error: "Empty Gemini compact response", provider: "gemini-compact" };
    }

    try {
      const parsed = extractJsonFromText(content);
      return {
        success: true,
        result: normalizeProofreadResult(parsed, text),
        provider: "gemini-compact",
      };
    } catch (parseErr) {
      const repaired = await repairGeminiJsonResponse(content, {
        geminiApiKey: apiKey,
        model,
        originalText: text,
      });

      if (!repaired.success) {
        return {
          success: false,
          error: `${parseErr.message}; compact JSON repair failed: ${repaired.error}`,
          provider: "gemini-compact",
        };
      }

      return {
        success: true,
        result: normalizeProofreadResult(repaired.result, text),
        provider: "gemini-compact-repaired",
      };
    }
  } catch (err) {
    const apiMessage =
      err.response?.data?.error?.message ||
      err.response?.data?.message ||
      err.message ||
      "Gemini compact request failed";
    return { success: false, error: apiMessage, provider: "gemini-compact" };
  }
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

    const content = extractGeminiResponseText(response);
    if (!content) {
      return { success: false, error: "Empty Gemini response", provider: "gemini" };
    }

    let parsed;
    let provider = "gemini";

    try {
      parsed = extractJsonFromText(content);
    } catch (parseErr) {
      console.warn("[proofread.service] Gemini JSON parse failed, trying repair:", parseErr.message);
      const repaired = await repairGeminiJsonResponse(content, {
        geminiApiKey: apiKey,
        model,
        originalText: text,
      });

      if (!repaired.success) {
        console.warn("[proofread.service] Gemini JSON repair failed, trying compact retry:", repaired.error);
        const compact = await callGeminiCompactProofread(text, {
          ...options,
          geminiApiKey: apiKey,
          model,
        });

        if (compact.success) {
          return compact;
        }

        return {
          success: false,
          error: `${parseErr.message}; JSON repair failed: ${repaired.error}; compact retry failed: ${compact.error}`,
          provider: "gemini",
        };
      }

      parsed = repaired.result;
      provider = "gemini-repaired";
    }

    const normalized = normalizeProofreadResult(parsed, text);
    if (shouldRetryCompactProofread(normalized, text)) {
      console.warn("[proofread.service] Gemini returned no likely errors, trying compact retry");
      const compact = await callGeminiCompactProofread(text, {
        ...options,
        geminiApiKey: apiKey,
        model,
      });

      if (compact.success && countDetectedErrors(compact.result) > 0) {
        return compact;
      }
    }

    return {
      success: true,
      result: normalized,
      provider,
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

function estimateOcrQuality(ocrResult) {
  const textLength = String(ocrResult?.text || "").trim().length;
  const confidence = Number(ocrResult?.confidence);
  const method = String(ocrResult?.method || "unknown");
  const geminiBased = Boolean(ocrResult?.geminiUsed) || method.includes("gemini");
  const usableConfidence = Number.isFinite(confidence) ? confidence : null;

  let level = "medium";
  if (textLength < 10) {
    level = "low";
  } else if (!geminiBased && usableConfidence !== null) {
    if (usableConfidence >= 0.85) level = "high";
    else if (usableConfidence < 0.6) level = "low";
  } else if (geminiBased && textLength >= 40) {
    level = "high";
  }

  const labels = {
    high: "High",
    medium: "Medium",
    low: "Low",
  };

  const note = geminiBased
    ? "Gemini OCR recognized the handwriting, but its confidence is estimated because Gemini does not return exact OCR confidence."
    : "OCR confidence is based on the local OCR engine score.";

  return {
    level,
    label: labels[level],
    note,
    recognizedCharacters: textLength,
    confidence: usableConfidence,
    confidenceIsEstimated: geminiBased,
  };
}

function buildOcrPayload(ocrResult) {
  return {
    text: ocrResult.text,
    confidence: ocrResult.confidence,
    method: ocrResult.method,
    geminiUsed: ocrResult.geminiUsed,
    quality: estimateOcrQuality(ocrResult),
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
      result = buildProofreadFallbackResult(
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
      result: buildProofreadFallbackResult(
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
  __test: {
    extractJsonFromText,
    closeTruncatedJson,
    normalizeProofreadResult,
    estimateOcrQuality,
    normalizeUploadExtension,
    redactSensitiveText,
    buildProofreadPrompt,
    buildCompactProofreadPrompt,
    shouldRetryCompactProofread,
    countDetectedErrors,
    createLocalCommonProofreadResult,
    buildProofreadFallbackResult,
  },
};
