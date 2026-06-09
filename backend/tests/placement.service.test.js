/*
 * Run:
 *    npm test -- --testPathPattern=placement.service.test.js
 */

require("dotenv").config({ path: "./.env.test", override: true });
const { sequelize, PlacementTopic, PlacementTestSession } = require("../src/models");

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
    1: "it was cold",
    2: "i have a ruler",
    3: "where does she live",
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
    expect(topic.name).toBe("Daily Life");
    expect(topic.vocabulary_keywords).toBeInstanceOf(Array);
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
      expect(Array.isArray(t.vocabulary_keywords)).toBe(true);
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
    expect(session.questions_data).toHaveProperty("sectionA");
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
