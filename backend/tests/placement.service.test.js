/*
 * Run:
 *    npm test -- --testPathPattern=placement.service.test.js
 */

require("dotenv").config({ path: "./.env.test", override: true });
const { sequelize, PlacementTopic, PlacementTestSession } = require("../src/models");
process.env.OPENAI_API_KEY = "";

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Get a valid test user ID. Creates one if it doesn't exist. */
async function getTestUserId() {
  const { User } = require("../src/models");
  let user = await User.findOne({ where: { email: "placement_test@example.com" } });
  if (!user) {
    const bcrypt = require("bcryptjs");
    user = await User.create({
      username: "placement_test_user",
      email: "placement_test@example.com",
      password_hash: await bcrypt.hash("testpassword123", 10),
      display_name: "Placement Test User",
      current_level: "beginner",
    });
  }
  return user.id;
}

// ─── Fixtures ───────────────────────────────────────────────────────────────

const VALID_TOPICS = [
  "greetings-basics",
  "family-friends",
  "daily-life",
  "food-drinks",
  "shopping-money",
  "travel-transportation",
];

const SAMPLE_ANSWERS = {
  sectionA: {
    1: "A",
    2: "A",
    3: "A",
    4: "A",
    5: "A",
  },
  sectionB: {
    1: { selected: "B", written: "basketball" },
    2: { selected: "B", written: "a scooter" },
    3: { selected: "A", written: "tape" },
    4: { selected: "A", written: "rubber bands" },
    5: { selected: "B", written: "across from" },
  },
  sectionC: {
    1: "your name",
    2: "How",
    3: "Nice to meet you",
    4: "at",
    5: "have",
  },
  sectionD: {
    1: "it was cold in the park",
    2: "i have a ruler in class",
    3: "she lives near the park",
  },
  sectionE: {
    1: "I am free on Saturday.",
    2: "No, I play soccer on Wednesday.",
    3: "I will swim on Sunday.",
    4: "No, I do homework on Monday.",
    5: "Yes, I am free on Tuesday.",
  },
  sectionF: {
    1: true,
    2: true,
    3: true,
  },
  sectionG: {
    1: "He was at school.",
    2: "She has some tape.",
    3: "It was cold and snowy.",
    4: "They live near the park.",
  },
};

// ─── Tests ───────────────────────────────────────────────────────────────────

describe("PlacementTopic Model", () => {
  beforeAll(async () => {
    // Tables already exist from migration SQL — no sync needed
  });

  afterAll(async () => {
    // Do not close — shared connection
  });

  test("should have seeded topics in DB", async () => {
    const count = await PlacementTopic.count({ where: { is_active: true } });
    expect(count).toBeGreaterThan(0);
  });

  test("should filter topics by age correctly", async () => {
    const { Op } = require("sequelize");
    const age = 12;
    const topics = await PlacementTopic.findAll({
      where: {
        is_active: true,
        min_age: { [Op.lte]: age },
        max_age: { [Op.gte]: age },
      },
    });
    expect(topics.length).toBeGreaterThan(0);
    topics.forEach((t) => {
      expect(t.min_age).toBeLessThanOrEqual(age);
      expect(t.max_age).toBeGreaterThanOrEqual(age);
    });
  });

  test("should find topic by slug", async () => {
    const topic = await PlacementTopic.findOne({ where: { slug: "daily-life" } });
    expect(topic).not.toBeNull();
    expect(topic.name).toBe("Daily Activities & Routines");
    const keywords =
      typeof topic.vocabulary_keywords === "string"
        ? JSON.parse(topic.vocabulary_keywords)
        : topic.vocabulary_keywords;
    expect(keywords).toBeInstanceOf(Array);
  });

  test("should return all 12 unit-mapped topics", async () => {
    const count = await PlacementTopic.count();
    expect(count).toBe(12);
  });
});

describe("PlacementService - getTopics", () => {
  beforeAll(async () => {
    // Tables already exist from migration SQL
  });

  afterAll(async () => {
    // Do not close — shared connection
  });

  test("should reject invalid age (below 8)", async () => {
    const placementService = require("../src/services/placement.service");
    await expect(placementService.getTopics(null, 5)).rejects.toThrow(
      "Age must be between 8 and 18"
    );
  });

  test("should reject invalid age (above 18)", async () => {
    const placementService = require("../src/services/placement.service");
    await expect(placementService.getTopics(null, 20)).rejects.toThrow(
      "Age must be between 8 and 18"
    );
  });

  test("should return topics filtered by age", async () => {
    const placementService = require("../src/services/placement.service");
    const topics = await placementService.getTopics(null, 12);
    expect(topics.length).toBeGreaterThan(0);
    expect(topics[0]).toHaveProperty("slug");
    expect(topics[0]).toHaveProperty("name");
    expect(topics[0]).toHaveProperty("name_vi");
    expect(topics[0]).toHaveProperty("icon");
  });

  test("should include vocabulary_keywords when needed", async () => {
    const topics = await PlacementTopic.findAll({
      where: { slug: { [require("sequelize").Op.in]: VALID_TOPICS.slice(0, 3) } },
    });
    topics.forEach((t) => {
      const keywords =
        typeof t.vocabulary_keywords === "string"
          ? JSON.parse(t.vocabulary_keywords)
          : t.vocabulary_keywords;
      expect(Array.isArray(keywords)).toBe(true);
    });
  });
});

describe("PlacementService - generateTest", () => {
  let testUserId;

  beforeAll(async () => {
    // Tables already exist from migration SQL
    testUserId = await getTestUserId();
  });

  afterAll(async () => {
    // Do not close — shared connection
  });

  afterEach(async () => {
    // Clean up test sessions after each test
    await PlacementTestSession.destroy({ where: { user_id: testUserId } });
  });

  test("should reject invalid level", async () => {
    const placementService = require("../src/services/placement.service");
    await expect(
      placementService.generateTest(testUserId, {
        level: "expert",
        age: 12,
        topicSlugs: VALID_TOPICS.slice(0, 3),
      })
    ).rejects.toThrow("Invalid level");
  });

  test("should reject empty topic selection", async () => {
    const placementService = require("../src/services/placement.service");
    await expect(
      placementService.generateTest(testUserId, {
        level: "beginner",
        age: 12,
        topicSlugs: [],
      })
    ).rejects.toThrow("Select between 1 and 12 topic slugs");
  });

  test("should reject non-existent topics", async () => {
    const placementService = require("../src/services/placement.service");
    await expect(
      placementService.generateTest(testUserId, {
        level: "beginner",
        age: 12,
        topicSlugs: ["non-existent-1"],
      })
    ).rejects.toThrow("One or more topic slugs are invalid");
  });

  test("should generate test using fallback (no OpenAI)", async () => {
    const placementService = require("../src/services/placement.service");
    const result = await placementService.generateTest(testUserId, {
      level: "beginner",
      age: 12,
      topicSlugs: VALID_TOPICS.slice(0, 3),
    });

    expect(result).toHaveProperty("session_id");
    expect(result).toHaveProperty("topics");
    expect(result).toHaveProperty("questions");
    expect(result.topics.length).toBe(3);
    expect(result.questions).toHaveProperty("sectionA");
    expect(result.questions).toHaveProperty("sectionG");
    expect(result.questions.sectionA.length).toBe(5);
    expect(result.questions.sectionG.length).toBe(4);
  });

  test("should not leak correct answers to client", async () => {
    const placementService = require("../src/services/placement.service");
    const result = await placementService.generateTest(testUserId, {
      level: "beginner",
      age: 12,
      topicSlugs: VALID_TOPICS.slice(0, 3),
    });

    const questionStr = JSON.stringify(result.questions);
    expect(questionStr).not.toMatch(/correctAnswer/i);
    expect(questionStr).not.toMatch(/correctOption/i);
    expect(questionStr).not.toMatch(/correctOrder/i);
    expect(questionStr).not.toMatch(/writeAnswer/i);
  });

  test("should store questions_data with answers in DB", async () => {
    const placementService = require("../src/services/placement.service");
    const result = await placementService.generateTest(testUserId, {
      level: "intermediate",
      age: 15,
      topicSlugs: ["travel-transportation", "food-drinks", "entertainment-hobbies"],
    });

    const session = await PlacementTestSession.findByPk(result.session_id);
    expect(session).not.toBeNull();
    const questionsData =
      typeof session.questions_data === "string"
        ? JSON.parse(session.questions_data)
        : session.questions_data;
    expect(questionsData).toHaveProperty("sectionA");
    expect(session.level_input).toBe("intermediate");
    expect(session.age).toBe(15);
    expect(session.status).toBe("in-progress");
  });
});

describe("PlacementService - submitTest", () => {
  let testUserId;
  let testSessionId;

  beforeAll(async () => {
    // Tables already exist from migration SQL
    testUserId = await getTestUserId();
  });

  beforeEach(async () => {
    // Create a test session before each submit test
    const placementService = require("../src/services/placement.service");
    const result = await placementService.generateTest(testUserId, {
      level: "beginner",
      age: 12,
      topicSlugs: VALID_TOPICS.slice(0, 3),
    });
    testSessionId = result.session_id;
  });

  afterEach(async () => {
    await PlacementTestSession.destroy({ where: { user_id: testUserId } });
  });

  afterAll(async () => {
    // Do not close — shared connection
  });

  test("should reject non-existent session", async () => {
    const placementService = require("../src/services/placement.service");
    await expect(
      placementService.submitTest("non-existent-session-id", testUserId, {})
    ).rejects.toThrow("Placement test session not found");
  });

  test("should reject submitting twice", async () => {
    const placementService = require("../src/services/placement.service");
    await placementService.submitTest(testSessionId, testUserId, SAMPLE_ANSWERS);
    await expect(
      placementService.submitTest(testSessionId, testUserId, SAMPLE_ANSWERS)
    ).rejects.toThrow("Test has already been submitted");
  });

  test("should calculate score and CEFR level correctly", async () => {
    const placementService = require("../src/services/placement.service");
    const result = await placementService.submitTest(
      testSessionId,
      testUserId,
      SAMPLE_ANSWERS
    );

    expect(result).toHaveProperty("session_id");
    expect(result).toHaveProperty("score");
    expect(result).toHaveProperty("cefr_level");
    expect(result).toHaveProperty("section_scores");
    expect(result).toHaveProperty("total_correct");
    expect(result).toHaveProperty("total_possible");
    expect(typeof result.score).toBe("number");
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  test("should mark test as completed in DB", async () => {
    const placementService = require("../src/services/placement.service");
    await placementService.submitTest(testSessionId, testUserId, SAMPLE_ANSWERS);
    const session = await PlacementTestSession.findByPk(testSessionId);
    expect(session.status).toBe("completed");
    expect(session.score).not.toBeNull();
    expect(session.completed_at).not.toBeNull();
  });

  test("should update user current_level based on CEFR", async () => {
    const placementService = require("../src/services/placement.service");
    const { User } = require("../src/models");
    await User.update({ current_level: "beginner" }, { where: { id: testUserId } });

    await placementService.submitTest(testSessionId, testUserId, SAMPLE_ANSWERS);
    const user = await User.findByPk(testUserId);
    expect(["beginner", "intermediate", "advanced"]).toContain(user.current_level);
  });
});

describe("PlacementService - flexible answer matching", () => {
  let placementService;

  beforeAll(() => {
    placementService = require("../src/services/placement.service");
  });

  test("should ignore punctuation for written answers", () => {
    const question = { id: 1, correctOrder: "where does she live" };

    expect(
      placementService.scoreQuestion("sectionD", question, { 1: "Where does she live?" })
    ).toBe(true);
  });

  test("should accept context-equivalent short answers in read/write sections", () => {
    const question = {
      id: 1,
      correctAnswer: "Grace swims at the pool on Sunday.",
      acceptedAnswers: ["She swims at the pool on Sunday."],
    };

    expect(placementService.scoreQuestion("sectionE", question, { 1: "at the pool" })).toBe(true);
    expect(placementService.scoreQuestion("sectionE", question, { 1: "Grace plays soccer" })).toBe(false);
  });

  test("should accept spoken answers that match the hint context", () => {
    const question = {
      id: 1,
      sampleAnswer: "He was at school.",
      acceptedAnswers: ["At school.", "School."],
    };

    expect(placementService.scoreQuestion("sectionG", question, { 1: "school" })).toBe(true);
  });
});

describe("PlacementService - topic unlock awards", () => {
  let placementService;
  let originalFindAll;
  let originalMarkUnitsCompletedWithStars;

  beforeAll(() => {
    placementService = require("../src/services/placement.service");
    originalFindAll = PlacementTopic.findAll;
    originalMarkUnitsCompletedWithStars = placementService.markUnitsCompletedWithStars;
  });

  afterEach(() => {
    PlacementTopic.findAll = originalFindAll;
    placementService.markUnitsCompletedWithStars = originalMarkUnitsCompletedWithStars;
  });

  test("should unlock 80 percent topics and keep checking later eligible topics", async () => {
    PlacementTopic.findAll = jest.fn(async () => [
      { slug: "topic-1", unit_id: 1, unit_order: 1 },
      { slug: "topic-2", unit_id: 2, unit_order: 2 },
    ]);
    placementService.markUnitsCompletedWithStars = jest.fn(async (_userId, unitAwards) => ({
      unlocked_units: Object.keys(unitAwards).map(Number),
      lessons_completed: 0,
      units_completed: 0,
      stars_awarded_by_unit: unitAwards,
      crowns_awarded_by_unit: unitAwards,
    }));

    const result = await placementService.unlockUnitsForPlacement({
      userId: "user-1",
      selectedTopicSlugs: ["topic-1", "topic-2", "topic-3"],
      topicScores: {
        "topic-1": { correct: 4, total: 5 },
        "topic-2": { correct: 5, total: 5 },
        "topic-3": { correct: 3, total: 5 },
      },
    });

    expect(result.passed_topics).toEqual(["topic-1", "topic-2"]);
    expect(result.perfect_topics).toEqual(["topic-2"]);
    expect(result.unlocked_units).toEqual([1, 2]);
    expect(result.stars_awarded_by_unit).toEqual({ 1: 1, 2: 3 });
  });

  test("should stop unlocking when an earlier topic is below 80 percent", async () => {
    PlacementTopic.findAll = jest.fn(async () => []);
    placementService.markUnitsCompletedWithStars = jest.fn(async () => ({
      unlocked_units: [],
      lessons_completed: 0,
      units_completed: 0,
      stars_awarded_by_unit: {},
      crowns_awarded_by_unit: {},
    }));

    const result = await placementService.unlockUnitsForPlacement({
      userId: "user-1",
      selectedTopicSlugs: ["topic-1", "topic-2"],
      topicScores: {
        "topic-1": { correct: 3, total: 5 },
        "topic-2": { correct: 5, total: 5 },
      },
    });

    expect(result.passed_topics).toEqual([]);
    expect(result.unlocked_units).toEqual([]);
    expect(PlacementTopic.findAll).not.toHaveBeenCalled();
    expect(placementService.markUnitsCompletedWithStars).not.toHaveBeenCalled();
  });
});

describe("PlacementService - getResult", () => {
  let testUserId;
  let testSessionId;

  beforeAll(async () => {
    // Tables already exist from migration SQL
    testUserId = await getTestUserId();
  });

  beforeEach(async () => {
    const placementService = require("../src/services/placement.service");
    const result = await placementService.generateTest(testUserId, {
      level: "beginner",
      age: 12,
      topicSlugs: VALID_TOPICS.slice(0, 3),
    });
    testSessionId = result.session_id;
    await placementService.submitTest(testSessionId, testUserId, SAMPLE_ANSWERS);
  });

  afterEach(async () => {
    await PlacementTestSession.destroy({ where: { user_id: testUserId } });
  });

  afterAll(async () => {
    // Do not close — shared connection
  });

  test("should return full result details", async () => {
    const placementService = require("../src/services/placement.service");
    const result = await placementService.getResult(testSessionId, testUserId);

    expect(result).toHaveProperty("session_id");
    expect(result).toHaveProperty("score");
    expect(result).toHaveProperty("section_scores");
    expect(result).toHaveProperty("cefr_level");
    expect(result).toHaveProperty("cefr_description");
    expect(result).toHaveProperty("recommendations");
    expect(Array.isArray(result.recommendations)).toBe(true);
  });

  test("should reject non-existent session", async () => {
    const placementService = require("../src/services/placement.service");
    await expect(
      placementService.getResult("fake-id", testUserId)
    ).rejects.toThrow("Placement test session not found");
  });
});

describe("PlacementService - getHistory", () => {
  let testUserId;

  beforeAll(async () => {
    // Tables already exist from migration SQL
    testUserId = await getTestUserId();
  });

  afterAll(async () => {
    // Do not close — shared connection
  });

  afterEach(async () => {
    await PlacementTestSession.destroy({ where: { user_id: testUserId } });
  });

  test("should return empty list when no sessions exist", async () => {
    const placementService = require("../src/services/placement.service");
    const result = await placementService.getHistory(testUserId, { limit: 5, page: 1 });
    expect(result.sessions).toBeInstanceOf(Array);
    expect(result.pagination).toHaveProperty("total");
  });

  test("should return sessions in descending order", async () => {
    const placementService = require("../src/services/placement.service");
    // Create 3 sessions
    for (let i = 0; i < 3; i++) {
      const result = await placementService.generateTest(testUserId, {
        level: "beginner",
        age: 12,
        topicSlugs: VALID_TOPICS.slice(0, 3),
      });
      await placementService.submitTest(result.session_id, testUserId, SAMPLE_ANSWERS);
    }
    const result = await placementService.getHistory(testUserId, { limit: 10 });
    expect(result.sessions.length).toBeGreaterThanOrEqual(3);
  });
});

describe("CEFR Level Mapping", () => {
  test("mapScoreToCEFR: score 0-20 maps to A1", () => {
    const placementService = require("../src/services/placement.service");
    expect(placementService.mapScoreToCEFR(0)).toBe("A1");
    expect(placementService.mapScoreToCEFR(15)).toBe("A1");
    expect(placementService.mapScoreToCEFR(20)).toBe("A1");
  });

  test("mapScoreToCEFR: score 21-40 maps to A2", () => {
    const placementService = require("../src/services/placement.service");
    expect(placementService.mapScoreToCEFR(21)).toBe("A2");
    expect(placementService.mapScoreToCEFR(35)).toBe("A2");
    expect(placementService.mapScoreToCEFR(40)).toBe("A2");
  });

  test("mapScoreToCEFR: score 41-60 maps to B1", () => {
    const placementService = require("../src/services/placement.service");
    expect(placementService.mapScoreToCEFR(41)).toBe("B1");
    expect(placementService.mapScoreToCEFR(55)).toBe("B1");
    expect(placementService.mapScoreToCEFR(60)).toBe("B1");
  });

  test("mapScoreToCEFR: score 61-80 maps to B2", () => {
    const placementService = require("../src/services/placement.service");
    expect(placementService.mapScoreToCEFR(61)).toBe("B2");
    expect(placementService.mapScoreToCEFR(75)).toBe("B2");
    expect(placementService.mapScoreToCEFR(80)).toBe("B2");
  });

  test("mapScoreToCEFR: score 81-100 maps to C1", () => {
    const placementService = require("../src/services/placement.service");
    expect(placementService.mapScoreToCEFR(81)).toBe("C1");
    expect(placementService.mapScoreToCEFR(95)).toBe("C1");
    expect(placementService.mapScoreToCEFR(100)).toBe("C1");
  });
});

// Close shared connection after all tests
afterAll(async () => {
  await sequelize.close();
});
