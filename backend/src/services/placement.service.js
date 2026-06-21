const {
  Lesson,
  LessonProgress,
  PlacementTestSession,
  PlacementTopic,
  User,
  UserProgress,
} = require("../models");
const openaiService = require("./openai.service");
const missionService = require("./mission.service");
const { Op } = require("sequelize");
const { isContextualTextMatch } = require("../utils/answer.util");

const REQUIRED_SECTIONS = [
  "sectionA",
  "sectionB",
  "sectionC",
  "sectionD",
  "sectionE",
  "sectionF",
  "sectionG",
];
const PLACEMENT_TOPIC_PASS_RATIO = 0.8;

const SECTION_TOTALS = {
  sectionA: 5,
  sectionB: 5,
  sectionC: 5,
  sectionD: 3,
  sectionE: 5,
  sectionF: 3,
  sectionG: 4,
};

const FALLBACK_UNIT_BY_SLUG = {
  "greetings-basics": 1,
  greetings: 1,
  "family-friends": 2,
  family: 2,
  "daily-life": 3,
  routines: 3,
  "daily-activities": 3,
  "food-drinks": 4,
  "food-restaurants": 4,
  food: 4,
  "shopping-money": 5,
  shopping: 5,
  travel: 6,
  "travel-transportation": 6,
  "weather-seasons": 7,
  "weather-nature": 7,
  weather: 7,
  "home-living": 8,
  home: 8,
  "work-career": 9,
  "jobs-future": 9,
  work: 9,
  "health-fitness": 10,
  "health-body": 10,
  health: 10,
  "technology-internet": 11,
  technology: 11,
  "entertainment-hobbies": 12,
  "sports-hobbies": 12,
  "movies-music": 12,
  hobbies: 12,
};

function parseJSON(value, fallback = null) {
  if (value == null) return fallback;
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch (error) {
    return fallback;
  }
}

function isTextAnswerCorrect(userAnswer, correctAnswer, acceptedAnswers = []) {
  return isContextualTextMatch(userAnswer, correctAnswer, acceptedAnswers);
}

function stripAnswerFields(question) {
  const copy = { ...question };
  delete copy.correctAnswer;
  delete copy.correctOption;
  delete copy.writeAnswer;
  delete copy.correctOrder;
  delete copy.matchAnswer;
  delete copy.sampleAnswer;
  delete copy.acceptedAnswers;
  return copy;
}

function getQuestionAnswerForReview(section, question) {
  if (section === "sectionA") {
    return { selected: question.matchAnswer || question.correctAnswer || "" };
  }

  if (section === "sectionB") {
    return {
      selected: question.correctOption || "",
      written: question.writeAnswer || question.audioText || "",
      acceptedAnswers: question.acceptedAnswers || [],
    };
  }

  if (section === "sectionC") {
    return {
      answer: question.correctAnswer || "",
      acceptedAnswers: question.acceptedAnswers || [],
    };
  }

  if (section === "sectionD") {
    return {
      answer: question.correctOrder || "",
      acceptedAnswers: question.acceptedAnswers || [],
    };
  }

  if (section === "sectionE") {
    return {
      answer: question.correctAnswer || "",
      acceptedAnswers: question.acceptedAnswers || [],
    };
  }

  if (section === "sectionF") {
    return { answer: question.word || question.audioText || "" };
  }

  if (section === "sectionG") {
    return {
      answer: question.sampleAnswer || question.correctAnswer || "",
      acceptedAnswers: question.acceptedAnswers || [],
    };
  }

  return null;
}

class PlacementService {
  getUnitIdForTopic(topic) {
    return Number(topic?.unit_id || FALLBACK_UNIT_BY_SLUG[topic?.slug]) || null;
  }

  getUnitOrderForTopic(topic) {
    return Number(topic?.unit_order || this.getUnitIdForTopic(topic)) || 999;
  }

  serializeTopic(topic) {
    const unitId = this.getUnitIdForTopic(topic);
    return {
      id: topic.id,
      name: topic.name,
      name_vi: topic.name_vi,
      slug: topic.slug,
      icon: topic.icon,
      difficulty_range: topic.difficulty_range,
      unit_id: unitId,
      unit_order: Number(topic.unit_order || unitId || 999),
    };
  }

  sortTopicsByUnit(topics) {
    return [...topics].sort((a, b) => {
      const unitDiff = this.getUnitOrderForTopic(a) - this.getUnitOrderForTopic(b);
      if (unitDiff !== 0) return unitDiff;
      return String(a.name).localeCompare(String(b.name));
    });
  }

  async getTopics(userId, age) {
    const where = { is_active: true };

    if (age !== undefined && age !== null && age !== "") {
      const parsedAge = Number(age);
      if (!Number.isInteger(parsedAge) || parsedAge < 8 || parsedAge > 18) {
        throw new Error("Age must be between 8 and 18");
      }

      where.min_age = { [Op.lte]: parsedAge };
      where.max_age = { [Op.gte]: parsedAge };
    }

    const topics = await PlacementTopic.findAll({
      where,
      attributes: [
        "id",
        "name",
        "name_vi",
        "slug",
        "icon",
        "difficulty_range",
        "unit_id",
        "unit_order",
      ],
    });

    return this.sortTopicsByUnit(topics)
      .map((topic) => this.serializeTopic(topic))
      .filter((topic) => topic.unit_id);
  }

  async generateTest(userId, { level, age, topicSlugs }) {
    const effectiveLevel = level || "intermediate";
    const effectiveAge = age ? Number(age) : 12;

    if (!["beginner", "intermediate", "advanced"].includes(effectiveLevel)) {
      throw new Error("Invalid level. Must be beginner, intermediate, or advanced.");
    }
    if (!Number.isInteger(effectiveAge) || effectiveAge < 8 || effectiveAge > 18) {
      throw new Error("Age must be between 8 and 18.");
    }
    if (!Array.isArray(topicSlugs) || topicSlugs.length < 1 || topicSlugs.length > 12) {
      throw new Error("Select between 1 and 12 topic slugs.");
    }

    const uniqueTopicSlugs = [...new Set(topicSlugs.map((slug) => String(slug).trim()).filter(Boolean))];
    if (!uniqueTopicSlugs.length) {
      throw new Error("At least one topic slug is required.");
    }

    const topics = await PlacementTopic.findAll({
      where: {
        slug: { [Op.in]: uniqueTopicSlugs },
        is_active: true,
      },
    });

    if (topics.length !== uniqueTopicSlugs.length) {
      throw new Error("One or more topic slugs are invalid or inactive.");
    }

    const orderedTopics = this.sortTopicsByUnit(topics);
    const orderedTopicSlugs = orderedTopics.map((topic) => topic.slug);
    const topicNames = orderedTopics
      .map((topic) => `${topic.slug}: ${topic.name} (Unit ${this.getUnitIdForTopic(topic)})`)
      .join(", ");
    const allKeywords = orderedTopics.flatMap((topic) => parseJSON(topic.vocabulary_keywords, []) || []);

    let vocabTier = "basic everyday vocabulary";
    if (effectiveAge >= 13) vocabTier = "intermediate vocabulary appropriate for teens";
    if (effectiveAge >= 16) vocabTier = "upper-intermediate vocabulary for high school students";

    let grammarComplexity = "simple present tense, basic questions, short answers";
    if (effectiveLevel === "intermediate") {
      grammarComplexity =
        "present/past simple, present continuous, basic comparatives, simple conjunctions";
    }
    if (effectiveLevel === "advanced") {
      grammarComplexity =
        "mixed tenses, modals, conditionals, relative clauses, natural connected answers";
    }

    const prompt = `You are an expert English teacher creating a placement test for a Vietnamese student.

Student profile:
- Age: ${effectiveAge} years old
- Self-reported level: ${effectiveLevel}
- Selected topics in unit order: ${topicNames}
- Allowed topicSlug values: ${orderedTopicSlugs.join(", ")}
- Vocabulary focus: ${allKeywords.slice(0, 50).join(", ")}

Instructions:
Generate a comprehensive English placement test with exactly 7 sections and 30 scored questions. All content must be in English.
The vocabulary should be ${vocabTier}.
Grammar complexity: ${grammarComplexity}.
Every scored question MUST include a "topicSlug" from the allowed topicSlug values. Distribute the selected topics as evenly as possible across the 30 questions.

IMPORTANT: Return ONLY a valid JSON object. No markdown, no explanation, no text before or after.

JSON structure must be:
{
  "title": "Placement Test",
  "sectionAOptions": [
    { "letter": "A", "text": "A short natural answer option" },
    { "letter": "B", "text": "A short natural answer option" },
    { "letter": "C", "text": "A short natural answer option" },
    { "letter": "D", "text": "A short natural answer option" },
    { "letter": "E", "text": "A short natural answer option" }
  ],
  "sectionA": [
    { "id": 1, "topicSlug": "one-selected-topic-slug", "question": "A natural English question (5-12 words)", "matchAnswer": "A" }
  ],
  "sectionB": [
    { "id": 1, "topicSlug": "one-selected-topic-slug", "audioText": "single vocabulary word or short phrase", "optionAImg": "plain English visual label, not an emoji", "optionBImg": "plain English visual label, not an emoji", "correctOption": "A", "writeAnswer": "the audioText", "acceptedAnswers": ["Optional alternate spelling or short answer"] }
  ],
  "sectionC": [
    { "id": 1, "topicSlug": "one-selected-topic-slug", "lineA": "Speaker A line with ___ placeholder", "lineB": "Speaker B response line", "blankInA": true, "options": ["correct answer", "distractor 1", "distractor 2"], "correctAnswer": "correct answer", "acceptedAnswers": ["Optional equivalent answer"] }
  ],
  "sectionD": [
    { "id": 1, "topicSlug": "one-selected-topic-slug", "scrambled": ["all", "words", "needed", "here"], "correctOrder": "all words needed here", "acceptedAnswers": ["Optional punctuation/capitalization variant"], "image": "short visual label, not an emoji" }
  ],
  "sectionETable": [
    { "header": "person/time", "detail": "activity or hobby / place" }
  ],
  "sectionE": [
    { "id": 1, "topicSlug": "one-selected-topic-slug", "question": "A question about the table", "correctAnswer": "Full natural answer sentence", "acceptedAnswers": ["Optional alternate correct answer"] }
  ],
  "sectionF": [
    { "id": 1, "topicSlug": "one-selected-topic-slug", "word": "single action word or phrase", "audioText": "same as word field", "image": "short visual label or emoji" }
  ],
  "sectionG": [
    { "id": 1, "topicSlug": "one-selected-topic-slug", "question": "An open-ended speaking prompt", "hint": "one word hint", "sampleAnswer": "model answer using grammar from the level", "acceptedAnswers": ["Optional alternate correct answer"] }
  ]
}

Requirements per section:
- sectionA: exactly 5 read-and-match questions and exactly 5 answer options in sectionAOptions (A-E).
- sectionB: exactly 5 listen, circle, and write questions.
- sectionC: exactly 5 choose-and-write dialogue completion questions.
- sectionB optionAImg and optionBImg must be readable English labels (for example "basketball", "red apple", "bus station"), not emoji-only icons.
- sectionD: exactly 3 unscramble-and-speak questions. The scrambled array must have 3-6 words and include every word needed to make one complete sentence, including articles, auxiliaries, and prepositions. Do not provide clue fragments with missing words.
- sectionETable: exactly 7 columns. Each column must have a header and detail. It should represent person/time and activity or hobby/place information.
- sectionE: exactly 5 read-and-write-answer questions about sectionETable.
- sectionF: exactly 3 listen-and-repeat cards.
- sectionG: exactly 4 read-and-speak prompts.
- For any written or spoken answer, include acceptedAnswers when a shorter or reworded response is naturally correct in context. Scoring will ignore punctuation, so do not rely on punctuation as the only difference.

Return ONLY the JSON object, nothing else.`;

    let questionsData;
    let tokensUsed = 0;

    try {
      if (openaiService.isConfigured()) {
        const result = await openaiService.generateJSON(prompt, {
          max_tokens: 5000,
          temperature: 0.75,
        });
        questionsData = result.data;
        tokensUsed = result.tokens_used;
      } else {
        questionsData = this.getFallbackQuestions(orderedTopics);
      }
    } catch (error) {
      console.error("OpenAI placement test generation failed, using fallback:", error.message);
      questionsData = this.getFallbackQuestions(orderedTopics);
    }

    questionsData = this.normalizeGeneratedQuestions(questionsData, orderedTopicSlugs);

    const session = await PlacementTestSession.create({
      user_id: userId,
      age: effectiveAge,
      level_input: effectiveLevel,
      selected_topics: orderedTopicSlugs,
      questions_data: questionsData,
      status: "in-progress",
    });

    return {
      session_id: session.id,
      topics: orderedTopics.map((topic) => this.serializeTopic(topic)),
      level: effectiveLevel,
      age: effectiveAge,
      questions: this.sanitizeQuestions(questionsData),
      tokens_used: tokensUsed,
    };
  }

  normalizeGeneratedQuestions(data, topicSlugs) {
    const fallback = this.getFallbackQuestions(topicSlugs.map((slug, index) => ({
      slug,
      name: slug,
      unit_id: index + 1,
      unit_order: index + 1,
      vocabulary_keywords: [],
    })));

    let normalized = data && typeof data === "object" ? { ...data } : fallback;

    for (const section of REQUIRED_SECTIONS) {
      if (!Array.isArray(normalized[section]) || normalized[section].length !== SECTION_TOTALS[section]) {
        normalized = fallback;
        break;
      }
    }

    if (!Array.isArray(normalized.sectionAOptions) || normalized.sectionAOptions.length !== 5) {
      normalized.sectionAOptions = fallback.sectionAOptions;
    }

    if (!Array.isArray(normalized.sectionETable) || normalized.sectionETable.length !== 7) {
      const firstContext = Array.isArray(normalized.sectionE?.[0]?.contextTable)
        ? normalized.sectionE[0].contextTable
        : null;
      normalized.sectionETable = firstContext && firstContext.length === 7
        ? firstContext.map((item) => ({
            header: item.header || item.day || item.person || item.time || "",
            detail: item.detail || item.activity || item.hobby || item.place || "",
          }))
        : fallback.sectionETable;
    }

    const topicCycle = topicSlugs.length ? topicSlugs : ["general"];
    let questionIndex = 0;
    for (const section of REQUIRED_SECTIONS) {
      normalized[section] = normalized[section].map((question, index) => {
        const topicSlug = topicCycle.includes(question.topicSlug)
          ? question.topicSlug
          : topicCycle[questionIndex % topicCycle.length];
        questionIndex += 1;
        return {
          id: question.id ?? index + 1,
          ...question,
          topicSlug,
        };
      });
    }

    normalized.title = normalized.title || "Placement Test";
    return normalized;
  }

  sanitizeQuestions(data) {
    const sanitized = {
      title: data.title || "Placement Test",
      sectionAOptions: data.sectionAOptions || [],
      sectionETable: data.sectionETable || [],
    };

    for (const section of REQUIRED_SECTIONS) {
      sanitized[section] = (data[section] || []).map((question) => stripAnswerFields(question));
    }

    return sanitized;
  }

  getFallbackQuestions(topicsInput = []) {
    const topics = topicsInput.length
      ? topicsInput
      : [{ slug: "greetings-basics" }, { slug: "family-friends" }, { slug: "daily-life" }];
    const topicSlugs = topics.map((topic) => topic.slug);
    const topicAt = (index) => topicSlugs[index % topicSlugs.length];

    return {
      title: "Placement Test",
      sectionAOptions: [
        { letter: "A", text: "It was cold and snowy." },
        { letter: "B", text: "Yes, please." },
        { letter: "C", text: "They were in the art room." },
        { letter: "D", text: "She has some tape." },
        { letter: "E", text: "She lives near the park." },
      ],
      sectionA: [
        { id: 1, topicSlug: topicAt(0), question: "How was the weather yesterday?", matchAnswer: "A", correctAnswer: "A" },
        { id: 2, topicSlug: topicAt(1), question: "Where does she live?", matchAnswer: "E", correctAnswer: "E" },
        { id: 3, topicSlug: topicAt(2), question: "Where were they yesterday?", matchAnswer: "C", correctAnswer: "C" },
        { id: 4, topicSlug: topicAt(3), question: "What does she have?", matchAnswer: "D", correctAnswer: "D" },
        { id: 5, topicSlug: topicAt(4), question: "Do you want some cookies?", matchAnswer: "B", correctAnswer: "B" },
      ],
      sectionB: [
        { id: 1, topicSlug: topicAt(5), audioText: "basketball", optionAImg: "football", optionBImg: "basketball", correctOption: "B", writeAnswer: "basketball" },
        { id: 2, topicSlug: topicAt(6), audioText: "rubber bands", optionAImg: "rubber bands", optionBImg: "pencil", correctOption: "A", writeAnswer: "rubber bands" },
        { id: 3, topicSlug: topicAt(7), audioText: "a scooter", optionAImg: "bike", optionBImg: "scooter", correctOption: "B", writeAnswer: "a scooter" },
        { id: 4, topicSlug: topicAt(8), audioText: "tape", optionAImg: "tape", optionBImg: "glue", correctOption: "A", writeAnswer: "tape" },
        { id: 5, topicSlug: topicAt(9), audioText: "across from", optionAImg: "next to", optionBImg: "across from", correctOption: "B", writeAnswer: "across from" },
      ],
      sectionC: [
        { id: 1, topicSlug: topicAt(10), lineA: "Hi, I'm Scott. What's ___?", lineB: "I'm Kate. Nice to meet you!", blankInA: true, options: ["your name", "you name", "name your"], correctAnswer: "your name" },
        { id: 2, topicSlug: topicAt(11), lineA: "Hello! ___ are you?", lineB: "I'm fine, thanks!", blankInA: true, options: ["How", "What", "Where"], correctAnswer: "How" },
        { id: 3, topicSlug: topicAt(12), lineA: "Hi, Anna! This is my friend Sarah.", lineB: "___, Anna!", blankInA: false, options: ["Nice to meet you", "How are you", "Goodbye"], correctAnswer: "Nice to meet you" },
        { id: 4, topicSlug: topicAt(13), lineA: "Where were you yesterday?", lineB: "I was ___ the library.", blankInA: false, options: ["at", "in", "on"], correctAnswer: "at" },
        { id: 5, topicSlug: topicAt(14), lineA: "Do you have a ruler?", lineB: "Yes, I ___ one.", blankInA: false, options: ["have", "has", "had"], correctAnswer: "have" },
      ],
      sectionD: [
        { id: 1, topicSlug: topicAt(15), scrambled: ["cold", "in", "the", "park", "was", "it"], correctOrder: "it was cold in the park", image: "cold park" },
        { id: 2, topicSlug: topicAt(16), scrambled: ["ruler", "a", "have", "I", "in", "class"], correctOrder: "I have a ruler in class", image: "school ruler" },
        { id: 3, topicSlug: topicAt(17), scrambled: ["lives", "she", "near", "the", "park"], correctOrder: "she lives near the park", image: "home near park" },
      ],
      sectionETable: [
        { header: "Anna / Monday", detail: "homework / home" },
        { header: "Ben / Tuesday", detail: "free / park" },
        { header: "Cara / Wednesday", detail: "soccer / field" },
        { header: "Dan / Thursday", detail: "housework / house" },
        { header: "Eva / Friday", detail: "music / classroom" },
        { header: "Finn / Saturday", detail: "free / home" },
        { header: "Grace / Sunday", detail: "swimming / pool" },
      ],
      sectionE: [
        { id: 1, topicSlug: topicAt(18), question: "What does Finn do on Saturday?", correctAnswer: "Finn is free on Saturday.", acceptedAnswers: ["He is free on Saturday."] },
        { id: 2, topicSlug: topicAt(19), question: "Can Cara come over on Wednesday?", correctAnswer: "No, Cara plays soccer on Wednesday.", acceptedAnswers: ["No, she plays soccer on Wednesday."] },
        { id: 3, topicSlug: topicAt(20), question: "Where does Grace swim on Sunday?", correctAnswer: "Grace swims at the pool on Sunday.", acceptedAnswers: ["She swims at the pool on Sunday."] },
        { id: 4, topicSlug: topicAt(21), question: "Who does housework on Thursday?", correctAnswer: "Dan does housework on Thursday.", acceptedAnswers: ["Dan does."] },
        { id: 5, topicSlug: topicAt(22), question: "What does Eva do on Friday?", correctAnswer: "Eva has music on Friday.", acceptedAnswers: ["She has music on Friday."] },
      ],
      sectionF: [
        { id: 1, topicSlug: topicAt(23), word: "riding a bike", audioText: "riding a bike", image: "bike" },
        { id: 2, topicSlug: topicAt(24), word: "swimming", audioText: "swimming", image: "swim" },
        { id: 3, topicSlug: topicAt(25), word: "playing soccer", audioText: "playing soccer", image: "soccer" },
      ],
      sectionG: [
        { id: 1, topicSlug: topicAt(26), question: "Where was he this morning?", hint: "school", sampleAnswer: "He was at school.", correctAnswer: "He was at school." },
        { id: 2, topicSlug: topicAt(27), question: "What does she have?", hint: "tape", sampleAnswer: "She has some tape.", correctAnswer: "She has some tape." },
        { id: 3, topicSlug: topicAt(28), question: "How was the weather yesterday?", hint: "cold", sampleAnswer: "It was cold and snowy.", correctAnswer: "It was cold and snowy." },
        { id: 4, topicSlug: topicAt(29), question: "Where do they live?", hint: "park", sampleAnswer: "They live near the park.", correctAnswer: "They live near the park." },
      ],
    };
  }

  scoreQuestion(section, question, answers) {
    const questionId = String(question.id);

    if (section === "sectionA") {
      const correct = question.matchAnswer || question.correctAnswer;
      return String(answers?.[questionId] || "").toUpperCase().trim() === String(correct || "").toUpperCase().trim();
    }

    if (section === "sectionB") {
      const answer = answers?.[questionId] || answers?.[question.id] || {};
      const selectedOk =
        String(answer.selected || "").toUpperCase().trim() ===
        String(question.correctOption || "").toUpperCase().trim();
      const writtenOk = isTextAnswerCorrect(
        answer.written,
        question.writeAnswer,
        question.acceptedAnswers || []
      );
      return selectedOk && writtenOk;
    }

    if (section === "sectionC") {
      return isTextAnswerCorrect(
        answers?.[questionId] ?? answers?.[question.id],
        question.correctAnswer,
        question.acceptedAnswers || []
      );
    }

    if (section === "sectionD") {
      return isTextAnswerCorrect(
        answers?.[questionId] ?? answers?.[question.id],
        question.correctOrder,
        question.acceptedAnswers || []
      );
    }

    if (section === "sectionE") {
      return isTextAnswerCorrect(
        answers?.[questionId] ?? answers?.[question.id],
        question.correctAnswer,
        question.acceptedAnswers || []
      );
    }

    if (section === "sectionF") {
      return answers?.[questionId] === true || answers?.[question.id] === true;
    }

    if (section === "sectionG") {
      return isTextAnswerCorrect(
        answers?.[questionId] ?? answers?.[question.id],
        question.sampleAnswer || question.correctAnswer,
        question.acceptedAnswers || []
      );
    }

    return false;
  }

  async submitTest(sessionId, userId, answersData) {
    const session = await PlacementTestSession.findOne({
      where: { id: sessionId, user_id: userId },
    });

    if (!session) {
      throw new Error("Placement test session not found.");
    }
    if (session.status === "completed") {
      throw new Error("Test has already been submitted.");
    }

    const questions = parseJSON(session.questions_data, {}) || {};
    const answers = answersData || {};
    const selectedTopicSlugs = parseJSON(session.selected_topics, []) || [];

    const sectionScores = {};
    const answerReview = {};
    const topicScores = {};
    let totalCorrect = 0;
    let totalPossible = 0;

    for (const section of REQUIRED_SECTIONS) {
      const qList = Array.isArray(questions[section]) ? questions[section] : [];
      const sectionAnswers = answers[section] || {};
      answerReview[section] = [];
      let correct = 0;

      qList.forEach((question) => {
        const topicSlug = question.topicSlug || selectedTopicSlugs[totalPossible % Math.max(selectedTopicSlugs.length, 1)];
        if (!topicScores[topicSlug]) topicScores[topicSlug] = { correct: 0, total: 0 };

        const isCorrect = this.scoreQuestion(section, question, sectionAnswers);
        const questionId = String(question.id);
        const userAnswer = sectionAnswers?.[questionId] ?? sectionAnswers?.[question.id] ?? null;

        if (isCorrect) {
          correct += 1;
          topicScores[topicSlug].correct += 1;
        }
        topicScores[topicSlug].total += 1;

        answerReview[section].push({
          questionId: question.id,
          section,
          topicSlug,
          userAnswer,
          correctAnswer: getQuestionAnswerForReview(section, question),
          isCorrect,
          score: isCorrect ? 1 : 0,
        });
      });

      sectionScores[section] = { correct, total: qList.length };
      totalCorrect += correct;
      totalPossible += qList.length;
    }

    const score = totalPossible > 0 ? Math.round((totalCorrect / totalPossible) * 100) : 0;
    const passed = score >= 60;
    const cefrLevel = this.mapScoreToCEFR(score);
    const unlockProgress = await this.unlockUnitsForPlacement({
      userId,
      selectedTopicSlugs,
      topicScores,
      totalCorrect,
      totalPossible,
    });
    const completedAt = new Date();

    await session.update({
      answers_data: answers,
      section_scores: sectionScores,
      unlock_progress: unlockProgress,
      score,
      passed,
      cefr_level: cefrLevel,
      status: "completed",
      completedAt,
    });

    const user = await User.findByPk(userId);
    if (user) {
      const levelMap = {
        A1: "beginner",
        A2: "beginner",
        B1: "intermediate",
        B2: "advanced",
        C1: "advanced",
      };
      const mappedLevel = levelMap[cefrLevel] || user.current_level;
      await user.update({ current_level: mappedLevel });
    }

    await missionService.updateProgress(userId, "test-participation", 1);
    await missionService.updateProgress(userId, "placement-first", 1);
    if (score === 100) {
      await missionService.updateProgress(userId, "placement-perfect", 1);
    }

    return {
      session_id: sessionId,
      score,
      section_scores: sectionScores,
      topic_scores: topicScores,
      unlock_progress: unlockProgress,
      answer_review: answerReview,
      passed,
      cefr_level: cefrLevel,
      total_correct: totalCorrect,
      total_possible: totalPossible,
      message: unlockProgress.unlocked_units.length
        ? `Unlocked ${unlockProgress.unlocked_units.length} unit(s) from your placement topics.`
        : "No placement units were unlocked yet. Keep practicing and try again.",
    };
  }

  async unlockUnitsForPlacement({ userId, selectedTopicSlugs, topicScores }) {
    const passedTopicSlugs = [];
    const perfectTopicSlugs = [];
    const topicAwardBySlug = new Map();

    for (const topicSlug of selectedTopicSlugs) {
      const topicScore = topicScores[topicSlug];
      const ratio = topicScore && topicScore.total > 0 ? topicScore.correct / topicScore.total : 0;

      if (ratio >= PLACEMENT_TOPIC_PASS_RATIO) {
        passedTopicSlugs.push(topicSlug);
        topicAwardBySlug.set(topicSlug, ratio === 1 ? 3 : 1);
      } else {
        break;
      }

      if (ratio === 1) {
        perfectTopicSlugs.push(topicSlug);
      }
    }

    if (!passedTopicSlugs.length) {
      return {
        selected_topics: selectedTopicSlugs,
        mastered_topics: [],
        passed_topics: [],
        perfect_topics: [],
        unlocked_units: [],
        lessons_completed: 0,
        units_completed: 0,
        stars_awarded_per_lesson: 1,
        crowns_awarded_per_unit: 1,
        stars_awarded_by_unit: {},
        crowns_awarded_by_unit: {},
      };
    }

    const topics = await PlacementTopic.findAll({
      where: { slug: { [Op.in]: passedTopicSlugs } },
      attributes: ["slug", "name", "unit_id", "unit_order"],
    });

    const unitStarAwards = {};
    this.sortTopicsByUnit(topics).forEach((topic) => {
      const unitId = this.getUnitIdForTopic(topic);
      if (!Number.isInteger(unitId) || unitId <= 0) return;

      const award = topicAwardBySlug.get(topic.slug) || 1;
      unitStarAwards[unitId] = Math.max(unitStarAwards[unitId] || 0, award);
    });

    const progress = await this.markUnitsCompletedWithStars(userId, unitStarAwards);
    const maxAward = Object.values(unitStarAwards).reduce(
      (max, award) => Math.max(max, award),
      0
    );

    return {
      selected_topics: selectedTopicSlugs,
      mastered_topics: passedTopicSlugs,
      passed_topics: passedTopicSlugs,
      perfect_topics: perfectTopicSlugs,
      unlocked_units: progress.unlocked_units,
      lessons_completed: progress.lessons_completed,
      units_completed: progress.units_completed,
      stars_awarded_per_lesson: maxAward || 1,
      crowns_awarded_per_unit: maxAward || 1,
      stars_awarded_by_unit: progress.stars_awarded_by_unit,
      crowns_awarded_by_unit: progress.crowns_awarded_by_unit,
    };
  }

  async markUnitsCompletedWithStars(userId, unitStarAwards) {
    const unitIds = Object.keys(unitStarAwards)
      .map((unitId) => Number(unitId))
      .filter((unitId) => Number.isInteger(unitId) && unitId > 0);

    if (!unitIds.length) {
      return {
        unlocked_units: [],
        lessons_completed: 0,
        units_completed: 0,
        stars_awarded_by_unit: {},
        crowns_awarded_by_unit: {},
      };
    }

    const lessons = await Lesson.findAll({
      where: { unit_id: { [Op.in]: unitIds } },
      attributes: ["id", "unit_id"],
      order: [
        ["unit_id", "ASC"],
        ["order_index", "ASC"],
      ],
    });

    if (!lessons.length) {
      return {
        unlocked_units: unitIds,
        lessons_completed: 0,
        units_completed: 0,
        stars_awarded_by_unit: unitStarAwards,
        crowns_awarded_by_unit: unitStarAwards,
      };
    }

    const lessonIds = lessons.map((lesson) => lesson.id);
    const existingProgress = await LessonProgress.findAll({
      where: {
        user_id: userId,
        lesson_id: { [Op.in]: lessonIds },
      },
    });

    const progressByLessonId = new Map(
      existingProgress.map((progress) => [Number(progress.lesson_id), progress])
    );
    const lessonsByUnitId = new Map();

    lessons.forEach((lesson) => {
      const unitId = Number(lesson.unit_id);
      if (!lessonsByUnitId.has(unitId)) lessonsByUnitId.set(unitId, []);
      lessonsByUnitId.get(unitId).push(lesson);
    });

    const wasUnitCompleted = new Map();
    lessonsByUnitId.forEach((unitLessons, unitId) => {
      wasUnitCompleted.set(
        unitId,
        unitLessons.every((lesson) => progressByLessonId.get(Number(lesson.id))?.status === "completed")
      );
    });

    const completedAt = new Date();
    let newlyCompletedLessons = 0;

    for (const lesson of lessons) {
      const progress = progressByLessonId.get(Number(lesson.id));
      const targetStars = Math.max(1, Math.min(3, Number(unitStarAwards[lesson.unit_id]) || 1));

      if (progress) {
        if (progress.status !== "completed") {
          newlyCompletedLessons += 1;
        }

        await progress.update({
          unit_id: lesson.unit_id,
          status: "completed",
          stars_earned: Math.max(progress.stars_earned || 0, targetStars),
          xp_earned: progress.xp_earned || 0,
          completed_at: completedAt,
          first_completed_at: progress.first_completed_at || completedAt,
        });
      } else {
        newlyCompletedLessons += 1;
        await LessonProgress.create({
          user_id: userId,
          unit_id: lesson.unit_id,
          lesson_id: lesson.id,
          status: "completed",
          stars_earned: targetStars,
          is_review: false,
          xp_earned: 0,
          correct_count: 0,
          total_count: 0,
          completed_at: completedAt,
          first_completed_at: completedAt,
        });
      }
    }

    let newlyCompletedUnits = 0;
    lessonsByUnitId.forEach((unitLessons, unitId) => {
      if (!wasUnitCompleted.get(unitId) && unitLessons.length > 0) {
        newlyCompletedUnits += 1;
      }
    });

    if (newlyCompletedLessons > 0 || newlyCompletedUnits > 0) {
      const [userProgress] = await UserProgress.findOrCreate({
        where: { user_id: userId },
        defaults: { user_id: userId },
      });

      userProgress.lessons_completed =
        (userProgress.lessons_completed || 0) + newlyCompletedLessons;
      userProgress.units_completed =
        (userProgress.units_completed || 0) + newlyCompletedUnits;
      await userProgress.save();
    }

    return {
      unlocked_units: unitIds,
      lessons_completed: newlyCompletedLessons,
      units_completed: newlyCompletedUnits,
      stars_awarded_by_unit: unitStarAwards,
      crowns_awarded_by_unit: unitStarAwards,
    };
  }

  mapScoreToCEFR(score) {
    if (score <= 20) return "A1";
    if (score <= 40) return "A2";
    if (score <= 60) return "B1";
    if (score <= 80) return "B2";
    return "C1";
  }

  buildAnswerReview(questions, answers, selectedTopicSlugs) {
    const answerReview = {};
    let totalPossible = 0;

    for (const section of REQUIRED_SECTIONS) {
      const qList = Array.isArray(questions[section]) ? questions[section] : [];
      const sectionAnswers = answers[section] || {};

      answerReview[section] = qList.map((question) => {
        const topicSlug =
          question.topicSlug ||
          selectedTopicSlugs[totalPossible % Math.max(selectedTopicSlugs.length, 1)];
        const questionId = String(question.id);
        const userAnswer = sectionAnswers?.[questionId] ?? sectionAnswers?.[question.id] ?? null;
        const isCorrect = this.scoreQuestion(section, question, sectionAnswers);

        totalPossible += 1;

        return {
          questionId: question.id,
          section,
          topicSlug,
          userAnswer,
          correctAnswer: getQuestionAnswerForReview(section, question),
          isCorrect,
          score: isCorrect ? 1 : 0,
        };
      });
    }

    return answerReview;
  }

  async getResult(sessionId, userId) {
    const session = await PlacementTestSession.findOne({
      where: { id: sessionId, user_id: userId },
    });

    if (!session) {
      throw new Error("Placement test session not found.");
    }

    const cefrDescriptions = {
      A1: "Beginner - You can understand and use familiar everyday expressions and very basic phrases.",
      A2: "Elementary - You can communicate in simple and routine tasks requiring direct exchange of information.",
      B1: "Intermediate - You can deal with most situations likely to arise while traveling.",
      B2: "Upper-Intermediate - You can interact with native speakers with sufficient fluency and spontaneity.",
      C1: "Advanced - You can express ideas fluently and spontaneously without much obvious searching for expressions.",
    };

    const recommendations = {
      A1: ["Start with Unit 1 - Basic greetings and introductions", "Practice everyday vocabulary", "Focus on present simple tense"],
      A2: ["Continue with basic sentence structures", "Learn common phrasal verbs", "Practice past simple tense"],
      B1: ["Work on intermediate grammar structures", "Expand vocabulary in chosen topics", "Practice reading short passages"],
      B2: ["Focus on complex sentence structures", "Work on writing skills", "Practice conditional tenses"],
      C1: ["Focus on fluency and natural expression", "Learn idiomatic expressions", "Practice advanced reading and writing"],
    };

    return {
      session_id: session.id,
      score: session.score,
      section_scores: parseJSON(session.section_scores, session.section_scores),
      unlock_progress: parseJSON(session.unlock_progress, session.unlock_progress),
      answer_review: this.buildAnswerReview(
        parseJSON(session.questions_data, {}) || {},
        parseJSON(session.answers_data, {}) || {},
        parseJSON(session.selected_topics, []) || []
      ),
      passed: session.passed,
      cefr_level: session.cefr_level,
      cefr_description: cefrDescriptions[session.cefr_level] || "",
      recommendations: recommendations[session.cefr_level] || [],
      level_input: session.level_input,
      selected_topics: parseJSON(session.selected_topics, session.selected_topics),
      age: session.age,
      status: session.status,
      completed_at: session.completedAt || session.completed_at,
    };
  }

  async getHistory(userId, { limit = 10, page = 1 } = {}) {
    const offset = (page - 1) * limit;

    const { count, rows } = await PlacementTestSession.findAndCountAll({
      where: { user_id: userId },
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset,
      attributes: [
        "id",
        "age",
        "level_input",
        "selected_topics",
        "score",
        "passed",
        "cefr_level",
        "status",
        "unlock_progress",
        "created_at",
        "completedAt",
      ],
    });

    return {
      sessions: rows.map((session) => ({
        session_id: session.id,
        age: session.age,
        level_input: session.level_input,
        selected_topics: parseJSON(session.selected_topics, session.selected_topics),
        score: session.score,
        passed: session.passed,
        cefr_level: session.cefr_level,
        status: session.status,
        unlock_progress: parseJSON(session.unlock_progress, session.unlock_progress),
        created_at: session.created_at,
        completed_at: session.completedAt || session.completed_at,
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    };
  }
}

module.exports = new PlacementService();
