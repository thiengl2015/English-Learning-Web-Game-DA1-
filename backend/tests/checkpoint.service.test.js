/*
 * Run:
 *    npm test -- --testPathPattern=checkpoint.service.test.js
 */

require("dotenv").config({ path: "./.env.test", override: true });
const { sequelize, UnitTestConfig, UnitTestSession, QuestionCheckpoint } = require("../src/models");

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Get a valid test user ID. Creates one if it doesn't exist. */
async function getTestUserId() {
  const { User } = require("../src/models");
  let user = await User.findOne({ where: { email: "checkpoint_test@example.com" } });
  if (!user) {
    const bcrypt = require("bcryptjs");
    user = await User.create({
      username: "checkpoint_test_user",
      email: "checkpoint_test@example.com",
      password_hash: await bcrypt.hash("testpassword123", 10),
      display_name: "Checkpoint Test User",
      current_level: "beginner",
    });
  }
  return user.id;
}

/** Get question IDs for checkpoint-1, grouped by section, in display_order */
async function getQuestionIdsForCheckpoint1() {
  const questions = await QuestionCheckpoint.findAll({
    where: { checkpoint_id: "checkpoint-1", is_active: true },
    order: [["section", "ASC"], ["display_order", "ASC"]],
  });

  const ids = { A: [], B: [], C: [], D: [], E: [] };
  questions.forEach((q) => {
    ids[q.section].push(q.id);
  });
  return ids;
}

/** Build answers object using real question IDs from DB */
async function buildAnswersForCheckpoint1(answerFn) {
  const ids = await getQuestionIdsForCheckpoint1();
  const answers = { A: {}, B: {}, C: {}, D: {}, E: {} };

  ids.A.forEach((id, i) => { answers.A[id] = answerFn("A", i); });
  ids.B.forEach((id, i) => { answers.B[id] = answerFn("B", i); });
  ids.C.forEach((id, i) => { answers.C[id] = answerFn("C", i); });
  ids.D.forEach((id, i) => { answers.D[id] = answerFn("D", i); });
  ids.E.forEach((id, i) => { answers.E[id] = answerFn("E", i); });

  return answers;
}

// ─── Test Fixtures ────────────────────────────────────────────────────────────

// Correct answers for checkpoint-1 (from seeder)
// NOTE: question IDs in DB start from 1 but reset on each seeder run
// We use dynamic lookup in tests instead of hardcoded IDs
const CORRECT_ANSWERS_CP1 = {
  A: {
    1: { selected: "A" },
    2: { selected: "A" },
    3: { selected: "A" },
    4: { selected: "A" },
    5: { selected: "A" },
  },
  B: {
    1: { selected: "B", written: "basketball" },
    2: { selected: "B", written: "a scooter" },
    3: { selected: "A", written: "tape" },
    4: { selected: "A", written: "rubber bands" },
    5: { selected: "B", written: "across from" },
  },
  C: {
    1: { answers: { a1: "your name", b1: "Kate" } },
    2: { answers: { a1: "How", b1: "fine" } },
    3: { answers: { a1: "friend", b1: "Nice to meet you" } },
    4: { answers: { a1: "were", b1: "at" } },
    5: { answers: { a1: "have", b1: "have" } },
  },
  D: {
    1: { answer: "it was cold" },
    2: { answer: "i have a ruler" },
    3: { answer: "where does she live" },
  },
  E: {
    1: true,
    2: true,
  },
};

// All wrong answers
const ALL_WRONG_ANSWERS = {
  A: {
    1: { selected: "B" },
    2: { selected: "B" },
    3: { selected: "B" },
    4: { selected: "B" },
    5: { selected: "B" },
  },
  B: {
    1: { selected: "A", written: "wrong" },
    2: { selected: "A", written: "wrong" },
    3: { selected: "B", written: "wrong" },
    4: { selected: "B", written: "wrong" },
    5: { selected: "A", written: "wrong" },
  },
  C: {
    1: { answer: "wrong" },
    2: { answer: "wrong" },
    3: { answer: "wrong" },
    4: { answer: "wrong" },
    5: { answer: "wrong" },
  },
  D: {
    1: { answer: "wrong answer" },
    2: { answer: "wrong answer" },
    3: { answer: "wrong answer" },
  },
  E: {
    1: false,
    2: false,
  },
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("UnitTestConfig & QuestionCheckpoint Models", () => {
  afterAll(async () => {
    // Do not close — shared connection
  });

  test("should have seeded checkpoint configs", async () => {
    const count = await UnitTestConfig.count({
      where: { test_type: "checkpoint", is_active: true },
    });
    expect(count).toBe(2);
  });

  test("should have seeded 40 checkpoint questions (20 per checkpoint)", async () => {
    const count = await QuestionCheckpoint.count({ where: { is_active: true } });
    expect(count).toBe(40);
  });

  test("checkpoint-1 should have 20 questions", async () => {
    const count = await QuestionCheckpoint.count({
      where: { checkpoint_id: "checkpoint-1", is_active: true },
    });
    expect(count).toBe(20);
  });

  test("checkpoint-2 should have 20 questions", async () => {
    const count = await QuestionCheckpoint.count({
      where: { checkpoint_id: "checkpoint-2", is_active: true },
    });
    expect(count).toBe(20);
  });

  test("should have correct section distribution (5A+5B+5C+3D+2E=20)", async () => {
    const sections = ["A", "B", "C", "D", "E"];
    const expected = { A: 5, B: 5, C: 5, D: 3, E: 2 };

    for (const section of sections) {
      const count = await QuestionCheckpoint.count({
        where: { checkpoint_id: "checkpoint-1", section, is_active: true },
      });
      expect(count).toBe(expected[section]);
    }
  });
});

describe("CheckpointService - getCheckpoints", () => {
  afterAll(async () => {
    // Do not close — shared connection
  });

  test("should return list of checkpoints", async () => {
    const checkpointService = require("../src/services/checkpoint.service");
    const checkpoints = await checkpointService.getCheckpoints();
    expect(Array.isArray(checkpoints)).toBe(true);
    expect(checkpoints.length).toBeGreaterThan(0);
  });

  test("should include required fields", async () => {
    const checkpointService = require("../src/services/checkpoint.service");
    const checkpoints = await checkpointService.getCheckpoints();
    checkpoints.forEach((cp) => {
      expect(cp).toHaveProperty("id");
      expect(cp).toHaveProperty("title");
      expect(cp).toHaveProperty("units_covered");
      expect(cp).toHaveProperty("pass_threshold");
      expect(cp).toHaveProperty("total_score");
    });
  });

  test("checkpoint-1 should cover units 1-5", async () => {
    const checkpointService = require("../src/services/checkpoint.service");
    const checkpoints = await checkpointService.getCheckpoints();
    const cp1 = checkpoints.find((cp) => cp.id === "checkpoint-1");
    expect(cp1.units_covered).toEqual([1, 2, 3, 4, 5]);
  });

  test("checkpoint-2 should cover units 6-10", async () => {
    const checkpointService = require("../src/services/checkpoint.service");
    const checkpoints = await checkpointService.getCheckpoints();
    const cp2 = checkpoints.find((cp) => cp.id === "checkpoint-2");
    expect(cp2.units_covered).toEqual([6, 7, 8, 9, 10]);
  });
});

describe("CheckpointService - getCheckpoint", () => {
  afterAll(async () => {
    // Do not close — shared connection
  });

  test("should throw if checkpoint not found", async () => {
    const checkpointService = require("../src/services/checkpoint.service");
    await expect(checkpointService.getCheckpoint("non-existent")).rejects.toThrow(
      "Checkpoint not found"
    );
  });

  test("should return questions grouped by section", async () => {
    const checkpointService = require("../src/services/checkpoint.service");
    const result = await checkpointService.getCheckpoint("checkpoint-1");
    expect(result).toHaveProperty("sections");
    expect(result).toHaveProperty("questions");
    expect(result.questions).toHaveProperty("A");
    expect(result.questions).toHaveProperty("B");
    expect(result.questions).toHaveProperty("C");
    expect(result.questions).toHaveProperty("D");
    expect(result.questions).toHaveProperty("E");
  });

  test("should NOT include correct answers", async () => {
    const checkpointService = require("../src/services/checkpoint.service");
    const result = await checkpointService.getCheckpoint("checkpoint-1");
    const qStr = JSON.stringify(result.questions);
    expect(qStr).not.toMatch(/correct_answer/i);
    expect(qStr).not.toMatch(/correctAnswer/i);
  });

  test("should return correct question counts per section", async () => {
    const checkpointService = require("../src/services/checkpoint.service");
    const result = await checkpointService.getCheckpoint("checkpoint-1");
    expect(result.sections.A.count).toBe(5);
    expect(result.sections.B.count).toBe(5);
    expect(result.sections.C.count).toBe(5);
    expect(result.sections.D.count).toBe(3);
    expect(result.sections.E.count).toBe(2);
  });
});

describe("CheckpointService - startSession", () => {
  let testUserId;

  beforeAll(async () => {
    testUserId = await getTestUserId();
  });

  afterAll(async () => {
    // Do not close — shared connection
  });

  afterEach(async () => {
    await UnitTestSession.destroy({
      where: { user_id: testUserId, test_id: "checkpoint-1" },
    });
  });

  test("should throw if checkpoint not found", async () => {
    const checkpointService = require("../src/services/checkpoint.service");
    await expect(
      checkpointService.startSession(testUserId, "non-existent")
    ).rejects.toThrow("Checkpoint not found");
  });

  test("should create new session", async () => {
    const checkpointService = require("../src/services/checkpoint.service");
    const result = await checkpointService.startSession(testUserId, "checkpoint-1");
    expect(result).toHaveProperty("session_id");
    expect(result).toHaveProperty("checkpoint_id", "checkpoint-1");
    expect(result).toHaveProperty("status", "in_progress");
    expect(result.is_resumed).toBe(false);
  });

  test("should resume existing in_progress session", async () => {
    const checkpointService = require("../src/services/checkpoint.service");
    const first = await checkpointService.startSession(testUserId, "checkpoint-1");
    const second = await checkpointService.startSession(testUserId, "checkpoint-1");
    expect(second.session_id).toBe(first.session_id);
    expect(second.is_resumed).toBe(true);
  });
});

describe("CheckpointService - submitCheckpoint (scoring)", () => {
  let testUserId;
  let testSessionId;
  // Dynamic answers built from real question IDs from DB
  let correctAnswers;
  let wrongAnswers;
  let partialCorrectAnswers; // 80%
  let partialWrongAnswers;    // 75%

  beforeAll(async () => {
    testUserId = await getTestUserId();
  });

  // Build answers in beforeEach to ensure fresh question IDs each test
  beforeEach(async () => {
    const checkpointService = require("../src/services/checkpoint.service");
    const result = await checkpointService.startSession(testUserId, "checkpoint-1");
    testSessionId = result.session_id;

    // Build answers dynamically using real question IDs from DB (fresh each test)
    correctAnswers = await buildAnswersForCheckpoint1((section, idx) => {
      const fixtures = {
        A: { selected: "A" },
        B: [
          { selected: "B", written: "basketball" },
          { selected: "B", written: "a scooter" },
          { selected: "A", written: "tape" },
          { selected: "A", written: "rubber bands" },
          { selected: "B", written: "across from" },
        ],
        C: [
          { answers: { a1: "your name", b1: "Kate" } },
          { answers: { a1: "How", b1: "fine" } },
          { answers: { a1: "friend", b1: "Nice to meet you" } },
          { answers: { a1: "were", b1: "at" } },
          { answers: { a1: "have", b1: "have" } },
        ],
        D: [
          { answer: "it was cold" },
          { answer: "i have a ruler" },
          { answer: "where does she live" },
        ],
        E: [true, true],
      };
      return fixtures[section][idx];
    });

    wrongAnswers = await buildAnswersForCheckpoint1((section, idx) => {
      const fixtures = {
        A: { selected: "B" },
        B: { selected: "A", written: "wrong" },
        C: { answer: "wrong" },
        D: { answer: "wrong answer" },
        E: false,
      };
      return fixtures[section];
    });

    // 80%: A + B correct, C + D wrong, E half
    partialCorrectAnswers = await buildAnswersForCheckpoint1((section, idx) => {
      const fixtures = {
        A: { selected: "A" },
        B: [
          { selected: "B", written: "basketball" },
          { selected: "B", written: "a scooter" },
          { selected: "A", written: "tape" },
          { selected: "A", written: "rubber bands" },
          { selected: "B", written: "across from" },
        ],
        C: { answer: "wrong" },
        D: { answer: "wrong" },
        E: [true, false],
      };
      return fixtures[section][idx];
    });

    // 75%: A 4/5, B correct, C + D wrong, E half
    partialWrongAnswers = await buildAnswersForCheckpoint1((section, idx) => {
      const fixtures = {
        A: [
          { selected: "B" }, // wrong
          { selected: "A" },
          { selected: "A" },
          { selected: "A" },
          { selected: "A" },
        ],
        B: [
          { selected: "B", written: "basketball" },
          { selected: "B", written: "a scooter" },
          { selected: "A", written: "tape" },
          { selected: "A", written: "rubber bands" },
          { selected: "B", written: "across from" },
        ],
        C: { answer: "wrong" },
        D: { answer: "wrong" },
        E: [true, false],
      };
      return fixtures[section][idx];
    });
  });

  afterEach(async () => {
    await UnitTestSession.destroy({
      where: { user_id: testUserId, test_id: "checkpoint-1" },
    });
  });

  afterAll(async () => {
    // Do not close — shared connection
  });

  test("should throw if session not found", async () => {
    const checkpointService = require("../src/services/checkpoint.service");
    await expect(
      checkpointService.submitCheckpoint(99999, testUserId, {})
    ).rejects.toThrow("Checkpoint session not found");
  });

  test("should reject submitting twice", async () => {
    const checkpointService = require("../src/services/checkpoint.service");
    await checkpointService.submitCheckpoint(testSessionId, testUserId, correctAnswers);
    await expect(
      checkpointService.submitCheckpoint(testSessionId, testUserId, correctAnswers)
    ).rejects.toThrow("Checkpoint has already been submitted");
  });

  test("should score 20/20 with all correct answers", async () => {
    const checkpointService = require("../src/services/checkpoint.service");
    const result = await checkpointService.submitCheckpoint(
      testSessionId,
      testUserId,
      correctAnswers
    );
    expect(result.score).toBe(20);
    expect(result.total_possible).toBe(20);
    expect(result.score_percentage).toBe(100);
    expect(result.passed).toBe(true);
  });

  test("should score 0/20 with all wrong answers", async () => {
    const checkpointService = require("../src/services/checkpoint.service");
    const result = await checkpointService.submitCheckpoint(
      testSessionId,
      testUserId,
      wrongAnswers
    );
    expect(result.score).toBe(0);
    expect(result.score_percentage).toBe(0);
    expect(result.passed).toBe(false);
  });

  test("should pass at exactly 80% (16/20)", async () => {
    const checkpointService = require("../src/services/checkpoint.service");
    const result = await checkpointService.submitCheckpoint(
      testSessionId,
      testUserId,
      partialCorrectAnswers
    );
    expect(result.score).toBe(16);
    expect(result.score_percentage).toBe(80);
    expect(result.passed).toBe(true);
  });

  test("should fail at 79% (15/20)", async () => {
    const checkpointService = require("../src/services/checkpoint.service");
    const result = await checkpointService.submitCheckpoint(
      testSessionId,
      testUserId,
      partialWrongAnswers
    );
    expect(result.score).toBe(15);
    expect(result.score_percentage).toBe(75);
    expect(result.passed).toBe(false);
  });

  test("should calculate section scores correctly", async () => {
    const checkpointService = require("../src/services/checkpoint.service");
    const result = await checkpointService.submitCheckpoint(
      testSessionId,
      testUserId,
      correctAnswers
    );
    // A: 5x1=5, B: 5x1=5, C: 5x1=5, D: 3x1=3, E: 2x1=2 => total 20
    expect(result.section_scores.A).toEqual({ correct: 5, total: 5 });
    expect(result.section_scores.B).toEqual({ correct: 5, total: 5 });
    expect(result.section_scores.C).toEqual({ correct: 5, total: 5 });
    expect(result.section_scores.D).toEqual({ correct: 3, total: 3 });
    expect(result.section_scores.E).toEqual({ correct: 2, total: 2 });
  });

  test("should handle partial answers", async () => {
    const checkpointService = require("../src/services/checkpoint.service");
    // Only answer 2 questions in section A
    const ids = await getQuestionIdsForCheckpoint1();
    const partial = { A: {} };
    partial.A[ids.A[0]] = { selected: "A" };
    partial.A[ids.A[1]] = { selected: "A" };

    const result = await checkpointService.submitCheckpoint(
      testSessionId,
      testUserId,
      partial
    );
    expect(result.score).toBe(2); // 2 correct from section A
    expect(result.passed).toBe(false);
  });

  test("should mark session as completed in DB", async () => {
    const checkpointService = require("../src/services/checkpoint.service");
    await checkpointService.submitCheckpoint(testSessionId, testUserId, correctAnswers);
    const session = await UnitTestSession.findByPk(testSessionId);
    expect(session.status).toBe("completed");
    expect(session.score).toBe(20);
    expect(session.pass).toBe(true);
    expect(session.completed_at).not.toBeNull();
  });

  test("should accept timeSpentSeconds", async () => {
    const checkpointService = require("../src/services/checkpoint.service");
    const result = await checkpointService.submitCheckpoint(
      testSessionId,
      testUserId,
      correctAnswers,
      300
    );
    expect(result.time_spent_seconds).toBe(300);
    const session = await UnitTestSession.findByPk(testSessionId);
    expect(session.time_spent_seconds).toBe(300);
  });
});

describe("CheckpointService - checkAnswer (question type logic)", () => {
  let checkpointService;

  beforeAll(() => {
    checkpointService = require("../src/services/checkpoint.service");
  });

  test("match: should accept correct letter", () => {
    const correct = { selected: "A" };
    expect(checkpointService.checkAnswer("match", { selected: "A" }, correct)).toBe(true);
    expect(checkpointService.checkAnswer("match", { selected: "a" }, correct)).toBe(true);
    expect(checkpointService.checkAnswer("match", { selected: "B" }, correct)).toBe(false);
  });

  test("listen_write: should require both selected AND written correct", () => {
    const correct = { selected: "B", written: "basketball" };
    expect(
      checkpointService.checkAnswer("listen_write", { selected: "B", written: "basketball" }, correct)
    ).toBe(true);
    expect(
      checkpointService.checkAnswer("listen_write", { selected: "B", written: "wrong" }, correct)
    ).toBe(false);
    expect(
      checkpointService.checkAnswer("listen_write", { selected: "A", written: "basketball" }, correct)
    ).toBe(false);
  });

  test("fill_blank: case-insensitive", () => {
    const correct = { answer: "your name" };
    expect(checkpointService.checkAnswer("fill_blank", { answer: "your name" }, correct)).toBe(true);
    expect(checkpointService.checkAnswer("fill_blank", { answer: "YOUR NAME" }, correct)).toBe(true);
    expect(checkpointService.checkAnswer("fill_blank", { answer: "wrong" }, correct)).toBe(false);
  });

  test("fill_blank: supports multiple blanks in one dialogue", () => {
    const correct = { answers: { a1: "your name", b1: "Kate" } };
    expect(
      checkpointService.checkAnswer(
        "fill_blank",
        { answers: { a1: "Your Name", b1: "kate" } },
        correct
      )
    ).toBe(true);
    expect(
      checkpointService.checkAnswer(
        "fill_blank",
        { answers: { a1: "your name", b1: "Scott" } },
        correct
      )
    ).toBe(false);
  });

  test("unscramble: case-insensitive, trimmed", () => {
    const correct = { answer: "it was cold" };
    expect(checkpointService.checkAnswer("unscramble", { answer: "it was cold" }, correct)).toBe(true);
    expect(checkpointService.checkAnswer("unscramble", { answer: "It Was Cold" }, correct)).toBe(true);
    expect(checkpointService.checkAnswer("unscramble", { answer: "cold was it" }, correct)).toBe(false);
  });

  test("read_speak: any confirmed answer scores", () => {
    const correct = { confirmed: true };
    expect(checkpointService.checkAnswer("read_speak", true, correct)).toBe(true);
    expect(checkpointService.checkAnswer("read_speak", { confirmed: true }, correct)).toBe(true);
    expect(checkpointService.checkAnswer("read_speak", false, correct)).toBe(false);
  });
});

describe("CheckpointService - getResult", () => {
  let testUserId;
  let testSessionId;
  let correctAnswers;

  beforeAll(async () => {
    testUserId = await getTestUserId();
    correctAnswers = await buildAnswersForCheckpoint1((section, idx) => {
      const fixtures = {
        A: { selected: "A" },
        B: [
          { selected: "B", written: "basketball" },
          { selected: "B", written: "a scooter" },
          { selected: "A", written: "tape" },
          { selected: "A", written: "rubber bands" },
          { selected: "B", written: "across from" },
        ],
        C: [
          { answers: { a1: "your name", b1: "Kate" } },
          { answers: { a1: "How", b1: "fine" } },
          { answers: { a1: "friend", b1: "Nice to meet you" } },
          { answers: { a1: "were", b1: "at" } },
          { answers: { a1: "have", b1: "have" } },
        ],
        D: [
          { answer: "it was cold" },
          { answer: "i have a ruler" },
          { answer: "where does she live" },
        ],
        E: [true, true],
      };
      return fixtures[section][idx];
    });
  });

  beforeEach(async () => {
    const checkpointService = require("../src/services/checkpoint.service");
    const result = await checkpointService.startSession(testUserId, "checkpoint-1");
    testSessionId = result.session_id;
    await checkpointService.submitCheckpoint(testSessionId, testUserId, correctAnswers);
  });

  afterEach(async () => {
    await UnitTestSession.destroy({
      where: { user_id: testUserId, test_id: "checkpoint-1" },
    });
  });

  afterAll(async () => {
    // Do not close — shared connection
  });

  test("should return full result details", async () => {
    const checkpointService = require("../src/services/checkpoint.service");
    const result = await checkpointService.getResult(testSessionId, testUserId);
    expect(result).toHaveProperty("session_id");
    expect(result).toHaveProperty("score", 20);
    expect(result).toHaveProperty("passed", true);
    expect(result).toHaveProperty("section_scores");
    expect(result).toHaveProperty("details_by_section");
  });

  test("should throw if session not found", async () => {
    const checkpointService = require("../src/services/checkpoint.service");
    await expect(checkpointService.getResult(99999, testUserId)).rejects.toThrow(
      "Checkpoint session not found"
    );
  });

  test("should throw if session not completed", async () => {
    const { User } = require("../src/models");
    const newUser = await User.create({
      username: "temp_cp_user",
      email: "temp_cp_" + Date.now() + "@example.com",
      password_hash: require("bcryptjs").hashSync("test", 10),
      display_name: "Temp",
    });
    const checkpointService = require("../src/services/checkpoint.service");
    const result = await checkpointService.startSession(newUser.id, "checkpoint-1");
    await expect(
      checkpointService.getResult(result.session_id, newUser.id)
    ).rejects.toThrow("Checkpoint has not been completed yet");
    await UnitTestSession.destroy({ where: { user_id: newUser.id } });
    await newUser.destroy();
  });

  test("should include question content in details", async () => {
    const checkpointService = require("../src/services/checkpoint.service");
    const result = await checkpointService.getResult(testSessionId, testUserId);
    expect(result.details_by_section.A[0]).toHaveProperty("questionContent");
  });
});

describe("CheckpointService - getHistory", () => {
  let testUserId;

  beforeAll(async () => {
    testUserId = await getTestUserId();
  });

  afterAll(async () => {
    // Do not close — shared connection
  });

  afterEach(async () => {
    await UnitTestSession.destroy({
      where: { user_id: testUserId, test_type: "checkpoint" },
    });
  });

  test("should return empty when no sessions", async () => {
    const checkpointService = require("../src/services/checkpoint.service");
    const result = await checkpointService.getHistory(testUserId);
    expect(result.sessions).toBeInstanceOf(Array);
    expect(result.pagination).toHaveProperty("total");
  });

  test("should return sessions in descending order", async () => {
    const checkpointService = require("../src/services/checkpoint.service");
    // Create 2 sessions
    for (let i = 0; i < 2; i++) {
      const result = await checkpointService.startSession(testUserId, "checkpoint-1");
      await checkpointService.submitCheckpoint(result.session_id, testUserId, CORRECT_ANSWERS_CP1);
    }
    const result = await checkpointService.getHistory(testUserId);
    expect(result.sessions.length).toBeGreaterThanOrEqual(2);
  });

  test("should support pagination", async () => {
    const checkpointService = require("../src/services/checkpoint.service");
    const result = await checkpointService.getHistory(testUserId, { limit: 1, page: 1 });
    expect(result.pagination.limit).toBe(1);
    expect(result.pagination.page).toBe(1);
  });
});

// Close shared connection after all tests
afterAll(async () => {
  await sequelize.close();
});
