"use strict";

const CONTRACTION_REPLACEMENTS = [
  [/\bcan't\b/g, "cannot"],
  [/\bwon't\b/g, "will not"],
  [/\bn't\b/g, " not"],
  [/\bI'm\b/gi, "i am"],
  [/\bI've\b/gi, "i have"],
  [/\bI'll\b/gi, "i will"],
  [/\byou're\b/gi, "you are"],
  [/\byou've\b/gi, "you have"],
  [/\bhe's\b/gi, "he is"],
  [/\bshe's\b/gi, "she is"],
  [/\bit's\b/gi, "it is"],
  [/\bwe're\b/gi, "we are"],
  [/\bthey're\b/gi, "they are"],
];

const CONTEXT_STOP_WORDS = new Set([
  "a",
  "an",
  "the",
  "am",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "do",
  "does",
  "did",
  "have",
  "has",
  "had",
  "some",
  "any",
  "to",
  "at",
  "in",
  "on",
  "of",
  "for",
  "from",
  "with",
  "by",
  "and",
  "or",
  "but",
  "i",
  "you",
  "he",
  "she",
  "it",
  "we",
  "they",
  "my",
  "your",
  "his",
  "her",
  "our",
  "their",
  "this",
  "that",
  "these",
  "those",
  "there",
  "here",
  "please",
]);

function normalizeAnswerText(value) {
  let text = String(value ?? "").toLowerCase().normalize("NFKD");

  for (const [pattern, replacement] of CONTRACTION_REPLACEMENTS) {
    text = text.replace(pattern, replacement);
  }

  return text
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value) {
  const normalized = normalizeAnswerText(value);
  return normalized ? normalized.split(" ") : [];
}

function simplifyToken(token) {
  if (token.length > 4 && token.endsWith("ies")) {
    return `${token.slice(0, -3)}y`;
  }
  if (token.length > 4 && token.endsWith("ing")) {
    return token.slice(0, -3);
  }
  if (token.length > 3 && token.endsWith("ed")) {
    return token.slice(0, -2);
  }
  if (token.length > 3 && token.endsWith("es")) {
    return token.slice(0, -2);
  }
  if (token.length > 3 && token.endsWith("s")) {
    return token.slice(0, -1);
  }
  return token;
}

function contentTokens(value) {
  return tokenize(value)
    .filter((token) => token.length > 1 && !CONTEXT_STOP_WORDS.has(token))
    .map(simplifyToken);
}

function uniqueTokens(tokens) {
  return [...new Set(tokens)];
}

function getCandidateTexts(correctAnswer, acceptedAnswers = []) {
  const candidates = [];
  const push = (value) => {
    if (value == null) return;

    if (Array.isArray(value)) {
      value.forEach(push);
      return;
    }

    if (typeof value === "object") {
      push(value.answer);
      push(value.value);
      push(value.written);
      push(value.sampleAnswer);
      push(value.correctAnswer);
      push(value.transcript);
      push(value.acceptedAnswers);
      return;
    }

    candidates.push(String(value));
  };

  push(correctAnswer);
  push(acceptedAnswers);

  return candidates
    .map((candidate) => String(candidate ?? "").trim())
    .filter(Boolean);
}

function hasTokenOverlap(userTokens, expectedTokens) {
  const userSet = new Set(userTokens);
  return expectedTokens.filter((token) => userSet.has(token)).length;
}

function isContextEquivalent(userText, expectedText, options = {}) {
  const normalizedUser = normalizeAnswerText(userText);
  const normalizedExpected = normalizeAnswerText(expectedText);

  if (!normalizedUser || !normalizedExpected) return false;
  if (normalizedUser === normalizedExpected) return true;

  const userWords = tokenize(normalizedUser);
  const expectedWords = tokenize(normalizedExpected);

  if (
    userWords.length <= 2 &&
    expectedWords.length > userWords.length &&
    expectedWords.slice(0, userWords.length).join(" ") === normalizedUser
  ) {
    return true;
  }

  const userContent = uniqueTokens(contentTokens(normalizedUser));
  const expectedContent = uniqueTokens(contentTokens(normalizedExpected));

  if (!userContent.length || !expectedContent.length) {
    return false;
  }

  const matchedExpected = hasTokenOverlap(userContent, expectedContent);
  const matchedUser = hasTokenOverlap(expectedContent, userContent);
  const expectedCoverage = matchedExpected / expectedContent.length;
  const userCoverage = matchedUser / userContent.length;

  const minExpectedCoverage = options.minExpectedCoverage ?? 0.6;
  const minUserCoverage = options.minUserCoverage ?? 0.5;

  if (expectedCoverage >= minExpectedCoverage && userCoverage >= minUserCoverage) {
    return true;
  }

  const allowShortContextAnswer = options.allowShortContextAnswer !== false;
  const repeatsOnlyLeadingContext =
    userContent.length === 1 &&
    expectedContent.length > 1 &&
    userContent[0] === expectedContent[0];

  return (
    allowShortContextAnswer &&
    !repeatsOnlyLeadingContext &&
    userContent.length <= 2 &&
    matchedUser === userContent.length &&
    matchedExpected > 0
  );
}

function isExactTextMatch(userAnswer, correctAnswer, acceptedAnswers = []) {
  const normalizedUser = normalizeAnswerText(userAnswer);
  if (!normalizedUser) return false;

  return getCandidateTexts(correctAnswer, acceptedAnswers).some(
    (candidate) => normalizeAnswerText(candidate) === normalizedUser
  );
}

function isContextualTextMatch(userAnswer, correctAnswer, acceptedAnswers = [], options = {}) {
  const normalizedUser = normalizeAnswerText(userAnswer);
  if (!normalizedUser) return false;

  return getCandidateTexts(correctAnswer, acceptedAnswers).some((candidate) =>
    isContextEquivalent(normalizedUser, candidate, options)
  );
}

module.exports = {
  normalizeAnswerText,
  isExactTextMatch,
  isContextualTextMatch,
  getCandidateTexts,
};
