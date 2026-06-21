"use strict";

const proofreadService = require("../src/services/proofread.service");

describe("proofread.service normalization helpers", () => {
  const {
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
  } = proofreadService.__test;

  test("repairs missing commas between JSON array elements", () => {
    const malformed = `{
      "originalText": "I has a apple.",
      "correctedText": "I have an apple.",
      "rewriteSuggestions": []
      "words": [
        { "text": "I", "index": 0, "isCorrect": true, "errorType": null }
        { "text": "has", "index": 1, "isCorrect": false, "errorType": "grammar" }
      ],
      "sentences": [],
      "summary": { "totalErrors": 1 },
      "feedback": "Check subject verb agreement."
    }`;

    const parsed = extractJsonFromText(malformed);

    expect(parsed.rewriteSuggestions).toEqual([]);
    expect(parsed.words).toHaveLength(2);
    expect(parsed.words[1].text).toBe("has");
  });

  test("applies sentence corrections to original OCR tokens", () => {
    const result = normalizeProofreadResult(
      {
        originalText: "I has a aple.",
        correctedText: "I have an apple.",
        words: [],
        sentences: [
          {
            original: "I has a aple.",
            corrected: "I have an apple.",
            corrections: [
              {
                word: "has a",
                corrected: "have an",
                type: "grammar",
                explanation: "Use the correct verb and article.",
              },
              {
                word: "aple",
                corrected: "apple",
                type: "spelling",
                explanation: "Missing one p.",
              },
            ],
          },
        ],
      },
      "I has a aple."
    );

    expect(result.words.map((word) => word.text)).toEqual(["I", "has", "a", "aple."]);
    expect(result.words[1].errorType).toBe("grammar");
    expect(result.words[2].errorType).toBe("grammar");
    expect(result.words[3].errorType).toBe("spelling");
  });

  test("marks Gemini OCR confidence as estimated", () => {
    const quality = estimateOcrQuality({
      text: "I has a apple. My teacher are kind. We likes English every day.",
      confidence: 1,
      method: "gemini",
      geminiUsed: true,
    });

    expect(quality.level).toBe("high");
    expect(quality.confidenceIsEstimated).toBe(true);
  });

  test("treats JFIF uploads as JPEG images", () => {
    expect(normalizeUploadExtension("handwriting.jfif")).toBe(".jpg");
    expect(normalizeUploadExtension("handwriting.JFIF")).toBe(".jpg");
  });

  test("redacts Gemini API keys from OCR errors", () => {
    const text = "Command failed: python script.py image.jfif --api-key SECRET12345 --pages 0-1";

    expect(redactSensitiveText(text, ["SECRET12345"])).toBe(
      "Command failed: python script.py image.jfif --api-key [REDACTED] --pages 0-1"
    );
  });

  test("asks Gemini for compact incorrect-only annotations", () => {
    const fullPrompt = buildProofreadPrompt("I has a apple.").userPrompt;
    const compactPrompt = buildCompactProofreadPrompt("I has a apple.").userPrompt;

    expect(fullPrompt).toContain('"words" should contain incorrect tokens/phrases only');
    expect(compactPrompt).toContain("Do not list correct words.");
  });

  test("retries compact proofreading when zero-error output looks suspicious", () => {
    const originalText = "im twelve year old and yesterday i go to school.";
    const result = {
      correctedText: originalText,
      summary: { totalErrors: 0 },
      words: [],
      sentences: [],
    };

    expect(shouldRetryCompactProofread(result, originalText)).toBe(true);
    expect(countDetectedErrors(result)).toBe(0);
  });

  test("recovers proofreading data from a truncated Gemini array", () => {
    // Gemini hit maxOutputTokens mid-array: the second word object is cut off
    // inside a string and there is no closing "]" or "}".
    const truncated = `{
      "correctedText": "I have an apple. My teacher is kind.",
      "rewriteSuggestions": [],
      "words": [
        { "text": "has", "index": 1, "isCorrect": false, "errorType": "grammar", "correction": "have" },
        { "text": "ki`;

    const parsed = extractJsonFromText(truncated);

    expect(parsed.correctedText).toBe("I have an apple. My teacher is kind.");
    expect(parsed.words[0].text).toBe("has");
    expect(parsed.words[0].errorType).toBe("grammar");
  });

  test("closeTruncatedJson keeps the largest valid prefix", () => {
    expect(JSON.parse(closeTruncatedJson('{"a":[1,2,3'))).toEqual({ a: [1, 2] });
    expect(JSON.parse(closeTruncatedJson('{"words":[{"text":"a"},{"text":"b'))).toEqual({
      words: [{ text: "a" }, {}],
    });
    // Already valid JSON is returned untouched.
    expect(closeTruncatedJson('{"a":1}')).toBe('{"a":1}');
  });

  test("uses the OCR text, not Gemini's echoed original, for displayed tokens", () => {
    const result = normalizeProofreadResult(
      {
        originalText: "completely different echoed text",
        correctedText: "I have an apple.",
        words: [],
        sentences: [],
      },
      "I has a aple."
    );

    expect(result.originalText).toBe("I has a aple.");
    expect(result.words.map((word) => word.text)).toEqual(["I", "has", "a", "aple."]);
  });

  test("prompts no longer ask Gemini to echo the original text", () => {
    const fullPrompt = buildProofreadPrompt("I has a apple.").userPrompt;
    const compactPrompt = buildCompactProofreadPrompt("I has a apple.").userPrompt;

    expect(fullPrompt).not.toContain('"originalText": "exact OCR text"');
    expect(compactPrompt).not.toContain('"originalText": "exact OCR text"');
    expect(fullPrompt).toContain("Do not repeat the original text back");
    expect(compactPrompt).toContain("Do not repeat the original text back");
  });

  test("local fallback marks common learner mistakes when AI is unavailable", () => {
    const fallback = buildProofreadFallbackResult(
      "im twelve year old and yesterday i go to school.",
      "AI proofreading is unavailable"
    );

    expect(countDetectedErrors(fallback)).toBeGreaterThan(0);
    expect(fallback.feedback).toContain("common learner mistakes were checked locally");

    const marked = fallback.words.filter((word) => !word.isCorrect && word.errorType);
    expect(marked.length).toBeGreaterThan(0);
  });

  test("local fallback shows the reason when no common mistakes are found", () => {
    const fallback = buildProofreadFallbackResult(
      "The weather is nice today.",
      "AI proofreading is unavailable"
    );

    expect(countDetectedErrors(fallback)).toBe(0);
    expect(fallback.feedback).toBe("AI proofreading is unavailable");
    expect(createLocalCommonProofreadResult("The weather is nice today.").summary.totalErrors).toBe(0);
  });
});
