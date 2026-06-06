const { PlacementTopic, PlacementTestSession, User } = require("../models");
const openaiService = require("./openai.service");
const { Op } = require("sequelize");

class PlacementService {
  /**
   * Get available topics filtered by age and optional user level.
   */
  async getTopics(userId, age) {
    if (!age || age < 8 || age > 18) {
      throw new Error("Age must be between 8 and 18");
    }

    const where = {
      is_active: true,
      min_age: { [Op.lte]: age },
      max_age: { [Op.gte]: age },
    };

    let userLevel = null;
    if (userId) {
      const user = await User.findByPk(userId, {
        attributes: ["current_level"],
      });
      userLevel = user?.current_level || null;
    }

    if (userLevel) {
      where.difficulty_range = {
        [Op.in]: [userLevel, "all"],
      };
    }

    const topics = await PlacementTopic.findAll({
      where,
      order: [["name", "ASC"]],
      attributes: ["id", "name", "name_vi", "slug", "icon", "difficulty_range"],
    });

    return topics;
  }

  /**
   * Generate AI placement test based on user inputs.
   */
  async generateTest(userId, { level, age, topicSlugs }) {
    // Validate inputs
    if (!["beginner", "intermediate", "advanced"].includes(level)) {
      throw new Error("Invalid level. Must be beginner, intermediate, or advanced.");
    }
    if (!age || age < 8 || age > 18) {
      throw new Error("Age must be between 8 and 18.");
    }
    if (!topicSlugs || !Array.isArray(topicSlugs) || topicSlugs.length !== 3) {
      throw new Error("Exactly 3 topic slugs are required.");
    }

    // Fetch topics from DB
    const topics = await PlacementTopic.findAll({
      where: {
        slug: { [Op.in]: topicSlugs },
        is_active: true,
      },
    });

    if (topics.length !== 3) {
      throw new Error("One or more topic slugs are invalid or inactive.");
    }

    const topicNames = topics.map((t) => t.name).join(", ");
    const allKeywords = topics.flatMap((t) => t.vocabulary_keywords || []);

    // Age-adaptive vocabulary tier
    let vocabTier = "basic everyday vocabulary";
    if (age >= 13) vocabTier = "intermediate vocabulary appropriate for teens";
    if (age >= 16) vocabTier = "upper-intermediate vocabulary for high school students";

    // Level-adaptive grammar complexity
    let grammarComplexity = "simple present tense, basic questions, short answers";
    if (level === "intermediate") {
      grammarComplexity =
        "present/past simple, present continuous, basic comparatives, simple conjunctions";
    }
    if (level === "advanced") {
      grammarComplexity =
        "mixed tenses (present/past/future simple + continuous), modals, conditionals, relative clauses";
    }

    const prompt = `You are an expert English teacher creating a placement test for a Vietnamese student.

Student profile:
- Age: ${age} years old
- Self-reported level: ${level}
- Selected topics: ${topicNames}
- Vocabulary focus: ${allKeywords.slice(0, 30).join(", ")}

Instructions:
Generate a comprehensive English placement test with exactly 7 sections. All content must be in English.
The vocabulary should be ${vocabTier}.
Grammar complexity: ${grammarComplexity}.
Each section must have questions related to the selected topics (distribute topics across sections).

IMPORTANT: Return ONLY a valid JSON object. No markdown, no explanation, no text before or after.

JSON structure must be:
{
  "sectionA": [
    { "id": 1, "question": "A natural English question (5-12 words)", "options": [{ "letter": "A", "text": "Answer option A" }, { "letter": "B", "text": "Answer option B" }, { "letter": "C", "text": "Answer option C" }, { "letter": "D", "text": "Answer option D" }], "correctAnswer": "A" }
  ],
  "sectionB": [
    { "id": 1, "audioText": "single vocabulary word or short phrase (2-4 words)", "optionAImg": "emoji representing option A", "optionBImg": "emoji representing option B", "correctOption": "A", "writeAnswer": "the exact audioText" }
  ],
  "sectionC": [
    { "id": 1, "lineA": "Speaker A line with ___ placeholder", "lineB": "Speaker B response line with ___ placeholder", "blankInA": true, "options": ["correct answer", "distractor 1", "distractor 2"], "correctAnswer": "correct answer" }
  ],
  "sectionD": [
    { "id": 1, "scrambled": ["word1", "word2", "word3", "word4"], "correctOrder": "word1 word2 word3 word4", "image": "emoji related to the sentence" }
  ],
  "sectionE": [
    { "id": 1, "contextTable": [{ "day": "Monday", "activity": "Activity on Monday" }], "question": "A question about the table (5-10 words)", "correctAnswer": "Full natural answer sentence" }
  ],
  "sectionF": [
    { "id": 1, "word": "single action word or phrase (2-3 words)", "audioText": "same as word field", "image": "emoji representing the word" }
  ],
  "sectionG": [
    { "id": 1, "question": "An open-ended question requiring a full sentence answer (5-15 words)", "hint": "one word hint", "sampleAnswer": "model answer using grammar from the level" }
  ]
}

Requirements per section:
- sectionA: exactly 5 questions. Each question is a practical English question with 4 answer options (A-D). Only ONE option is correct. Mix topics from the selected list.
- sectionB: exactly 5 questions. Each has a vocabulary word/phrase for listening practice. Two visual emoji options. Write answer must match audioText exactly.
- sectionC: exactly 5 dialogue completion questions. Mix: some blanks in lineA, some in lineB. Use the topics selected.
- sectionD: exactly 3 scrambled sentence questions. The scrambled array must have 3-5 words. correctOrder is the properly arranged sentence.
- sectionE: exactly 5 questions. Each has a small 2-7 row context table. Questions are about the table content.
- sectionF: exactly 3 vocabulary cards. Words should be action verbs or short phrases related to the selected topics.
- sectionG: exactly 4 open-ended speaking prompts. Each has a hint word. Sample answer demonstrates the target grammar structure.

Return ONLY the JSON object, nothing else.`;

    let questionsData;
    let tokensUsed = 0;

    try {
      if (openaiService.isConfigured()) {
        const result = await openaiService.generateJSON(prompt, {
          max_tokens: 4000,
          temperature: 0.8,
        });
        questionsData = result.data;
        tokensUsed = result.tokens_used;
      } else {
        questionsData = this.getFallbackQuestions();
      }
    } catch (error) {
      console.error("OpenAI placement test generation failed, using fallback:", error.message);
      questionsData = this.getFallbackQuestions();
    }

    // Validate AI response structure
    const requiredSections = ["sectionA", "sectionB", "sectionC", "sectionD", "sectionE", "sectionF", "sectionG"];
    for (const section of requiredSections) {
      if (!questionsData[section] || !Array.isArray(questionsData[section])) {
        questionsData = this.getFallbackQuestions();
        break;
      }
    }

    // Sanitize: remove correct answers before returning to client
    const sanitizeQuestions = (data) => {
      const sanitized = {};
      for (const section of requiredSections) {
        if (!data[section]) continue;
        sanitized[section] = data[section].map((q) => {
          const copy = { ...q };
          delete copy.correctAnswer;
          delete copy.correctOption;
          delete copy.writeAnswer;
          delete copy.correctOrder;
          delete copy.correctAnswer;
          delete copy.sampleAnswer;
          // Assign id if missing
          if (copy.id === undefined) copy.id = q.id;
          return copy;
        });
      }
      return sanitized;
    };

    // Create session in DB
    const session = await PlacementTestSession.create({
      user_id: userId,
      age,
      level_input: level,
      selected_topics: topicSlugs,
      questions_data: questionsData,
      status: "in-progress",
    });

    return {
      session_id: session.id,
      topics: topics.map((t) => ({
        slug: t.slug,
        name: t.name,
        name_vi: t.name_vi,
        icon: t.icon,
      })),
      level,
      age,
      questions: sanitizeQuestions(questionsData),
      tokens_used: tokensUsed,
    };
  }

  /**
   * Fallback hardcoded questions when OpenAI is unavailable.
   */
  getFallbackQuestions() {
    return {
      sectionA: [
        { id: 1, question: "What do you usually do in the morning?", options: [{ letter: "A", text: "I wake up and eat breakfast." }, { letter: "B", text: "I go to sleep." }, { letter: "C", text: "It is raining." }, { letter: "D", text: "She is a teacher." }], correctAnswer: "A" },
        { id: 2, question: "Where is the nearest bus stop?", options: [{ letter: "A", text: "It is next to the park." }, { letter: "B", text: "Yes, I like buses." }, { letter: "C", text: "I have two tickets." }, { letter: "D", text: "She bought a book." }], correctAnswer: "A" },
        { id: 3, question: "What time do you usually go to bed?", options: [{ letter: "A", text: "I go to bed at 10 PM." }, { letter: "B", text: "The weather is sunny." }, { letter: "C", text: "There are five cats." }, { letter: "D", text: "I eat rice for lunch." }], correctAnswer: "A" },
        { id: 4, question: "How was your weekend?", options: [{ letter: "A", text: "It was great, thanks!" }, { letter: "B", text: "I want some water." }, { letter: "C", text: "The school is big." }, { letter: "D", text: "She plays tennis." }], correctAnswer: "A" },
        { id: 5, question: "Do you like playing football?", options: [{ letter: "A", text: "Yes, I do. It is fun!" }, { letter: "B", text: "The ball is round." }, { letter: "C", text: "Three players joined." }, { letter: "D", text: "I read a book." }], correctAnswer: "A" },
      ],
      sectionB: [
        { id: 1, audioText: "basketball", optionAImg: "⚽", optionBImg: "🏀", correctOption: "B", writeAnswer: "basketball" },
        { id: 2, audioText: "a scooter", optionAImg: "🚲", optionBImg: "🛴", correctOption: "B", writeAnswer: "a scooter" },
        { id: 3, audioText: "tape", optionAImg: "📦", optionBImg: "🧴", correctOption: "A", writeAnswer: "tape" },
        { id: 4, audioText: "rubber bands", optionAImg: "✏️", optionBImg: "🔗", correctOption: "A", writeAnswer: "rubber bands" },
        { id: 5, audioText: "across from", optionAImg: "➡️", optionBImg: "↔️", correctOption: "B", writeAnswer: "across from" },
      ],
      sectionC: [
        { id: 1, lineA: "Hi, I'm Scott. What's ___?", lineB: "I'm Kate. Nice to meet you!", blankInA: true, options: ["your name", "you name", "name your"], correctAnswer: "your name" },
        { id: 2, lineA: "Hello! ___ are you?", lineB: "I'm fine, thanks!", blankInA: true, options: ["How", "What", "Where"], correctAnswer: "How" },
        { id: 3, lineA: "Hi, Anna! This is my friend Sarah.", lineB: "___, Anna!", blankInA: false, options: ["Nice to meet you", "How are you", "Goodbye"], correctAnswer: "Nice to meet you" },
        { id: 4, lineA: "Where were you yesterday?", lineB: "I was ___ the library.", blankInA: false, options: ["at", "in", "on"], correctAnswer: "at" },
        { id: 5, lineA: "Do you have a ruler?", lineB: "Yes, I ___ one.", blankInA: false, options: ["have", "has", "had"], correctAnswer: "have" },
      ],
      sectionD: [
        { id: 1, scrambled: ["cold", "was", "it"], correctOrder: "it was cold", image: "🌨️" },
        { id: 2, scrambled: ["ruler", "a", "have", "I"], correctOrder: "I have a ruler", image: "📏" },
        { id: 3, scrambled: ["she", "does", "live", "where"], correctOrder: "where does she live", image: "🏠" },
      ],
      sectionE: [
        { id: 1, contextTable: [{ day: "Monday", activity: "Do homework" }, { day: "Tuesday", activity: "Free" }, { day: "Wednesday", activity: "Play soccer" }, { day: "Thursday", activity: "Do housework" }, { day: "Friday", activity: "Free" }], question: "What do you do on Saturday?", correctAnswer: "I am free on Saturday." },
        { id: 2, contextTable: [{ day: "Monday", activity: "Do homework" }, { day: "Tuesday", activity: "Free" }, { day: "Wednesday", activity: "Play soccer" }, { day: "Thursday", activity: "Do housework" }, { day: "Friday", activity: "Free" }], question: "Can you come over on Wednesday?", correctAnswer: "No, I play soccer on Wednesday." },
        { id: 3, contextTable: [{ day: "Monday", activity: "Do homework" }, { day: "Tuesday", activity: "Free" }, { day: "Wednesday", activity: "Play soccer" }, { day: "Thursday", activity: "Do housework" }, { day: "Friday", activity: "Free" }], question: "What will you do on Sunday?", correctAnswer: "I will swim on Sunday." },
        { id: 4, contextTable: [{ day: "Monday", activity: "Do homework" }, { day: "Tuesday", activity: "Free" }, { day: "Wednesday", activity: "Play soccer" }, { day: "Thursday", activity: "Do housework" }, { day: "Friday", activity: "Free" }], question: "Do you swim on Monday?", correctAnswer: "No, I do homework on Monday." },
        { id: 5, contextTable: [{ day: "Monday", activity: "Do homework" }, { day: "Tuesday", activity: "Free" }, { day: "Wednesday", activity: "Play soccer" }, { day: "Thursday", activity: "Do housework" }, { day: "Friday", activity: "Free" }], question: "Can you come over on Tuesday?", correctAnswer: "Yes, I am free on Tuesday." },
      ],
      sectionF: [
        { id: 1, word: "riding a bike", audioText: "riding a bike", image: "🚴" },
        { id: 2, word: "swimming", audioText: "swimming", image: "🏊" },
        { id: 3, word: "playing soccer", audioText: "playing soccer", image: "⚽" },
      ],
      sectionG: [
        { id: 1, question: "Where was he this morning?", hint: "school", sampleAnswer: "He was at school.", correctAnswer: "He was at school." },
        { id: 2, question: "What does she have?", hint: "tape", sampleAnswer: "She has some tape.", correctAnswer: "She has some tape." },
        { id: 3, question: "How was the weather yesterday?", hint: "cold", sampleAnswer: "It was cold and snowy.", correctAnswer: "It was cold and snowy." },
        { id: 4, question: "Where do they live?", hint: "park", sampleAnswer: "They live near the park.", correctAnswer: "They live near the park." },
      ],
    };
  }

  /**
   * Submit test answers and calculate score.
   */
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

    const questions = session.questions_data || {};
    const answers = answersData || {};

    // Score each section
    const sectionScores = {};
    let totalCorrect = 0;
    let totalPossible = 0;

    // Section A: read and match
    if (questions.sectionA && answers.sectionA) {
      const qList = questions.sectionA;
      let correct = 0;
      qList.forEach((q) => {
        const userAns = (answers.sectionA[q.id] || "").toUpperCase().trim();
        if (userAns === (q.correctAnswer || "").toUpperCase().trim()) correct++;
      });
      sectionScores.sectionA = { correct, total: qList.length };
      totalCorrect += correct;
      totalPossible += qList.length;
    }

    // Section B: listen + write (both select AND write must be correct)
    if (questions.sectionB && answers.sectionB) {
      const qList = questions.sectionB;
      let correct = 0;
      qList.forEach((q) => {
        const selOk = (answers.sectionB[q.id]?.selected || "").toUpperCase() === (q.correctOption || "").toUpperCase();
        const writeOk = (answers.sectionB[q.id]?.written || "").toLowerCase().trim() === (q.writeAnswer || "").toLowerCase().trim();
        if (selOk && writeOk) correct++;
      });
      sectionScores.sectionB = { correct, total: qList.length };
      totalCorrect += correct;
      totalPossible += qList.length;
    }

    // Section C: choose from dropdown
    if (questions.sectionC && answers.sectionC) {
      const qList = questions.sectionC;
      let correct = 0;
      qList.forEach((q) => {
        const blankId = q.id;
        const userAns = (answers.sectionC[blankId] || "").trim();
        if (userAns.toLowerCase() === (q.correctAnswer || "").toLowerCase()) correct++;
      });
      sectionScores.sectionC = { correct, total: qList.length };
      totalCorrect += correct;
      totalPossible += qList.length;
    }

    // Section D: unscramble
    if (questions.sectionD && answers.sectionD) {
      const qList = questions.sectionD;
      let correct = 0;
      qList.forEach((q) => {
        const userAns = (answers.sectionD[q.id] || "").toLowerCase().trim();
        const correctAns = (q.correctOrder || "").toLowerCase().trim();
        if (userAns === correctAns) correct++;
      });
      sectionScores.sectionD = { correct, total: qList.length };
      totalCorrect += correct;
      totalPossible += qList.length;
    }

    // Section E: read + write (any non-empty answer scores)
    if (questions.sectionE && answers.sectionE) {
      const qList = questions.sectionE;
      let correct = 0;
      qList.forEach((q) => {
        const userAns = (answers.sectionE[q.id] || "").trim();
        if (userAns.length > 0) correct++;
      });
      sectionScores.sectionE = { correct, total: qList.length };
      totalCorrect += correct;
      totalPossible += qList.length;
    }

    // Section F: listen + repeat (spoken — voice section, any confirmed answer scores)
    if (questions.sectionF && answers.sectionF) {
      const qList = questions.sectionF;
      let correct = 0;
      qList.forEach((q) => {
        if (answers.sectionF[q.id] === true) correct++;
      });
      sectionScores.sectionF = { correct, total: qList.length };
      totalCorrect += correct;
      totalPossible += qList.length;
    }

    // Section G: read + speak (spoken section)
    if (questions.sectionG && answers.sectionG) {
      const qList = questions.sectionG;
      let correct = 0;
      qList.forEach((q) => {
        const userAns = (answers.sectionG[q.id] || "").toLowerCase().trim();
        const sampleAns = (q.sampleAnswer || "").toLowerCase().trim();
        if (userAns === sampleAns) correct++;
      });
      sectionScores.sectionG = { correct, total: qList.length };
      totalCorrect += correct;
      totalPossible += qList.length;
    }

    // Avoid division by zero
    const score = totalPossible > 0 ? Math.round((totalCorrect / totalPossible) * 100) : 0;
    const passed = score >= 60;

    // Map score to CEFR level
    const cefrLevel = this.mapScoreToCEFR(score);

    // Update session
    await session.update({
      answers_data: answers,
      section_scores: sectionScores,
      score,
      passed,
      cefr_level: cefrLevel,
      status: "completed",
      completed_at: new Date(),
    });

    // Update user's current_level based on CEFR
    const user = await User.findByPk(userId);
    if (user) {
      const levelMap = { A1: "beginner", A2: "beginner", B1: "intermediate", B2: "advanced", C1: "advanced" };
      const mappedLevel = levelMap[cefrLevel] || user.current_level;
      await user.update({ current_level: mappedLevel });
    }

    return {
      session_id: sessionId,
      score,
      section_scores: sectionScores,
      passed,
      cefr_level: cefrLevel,
      total_correct: totalCorrect,
      total_possible: totalPossible,
      message: passed
        ? `Excellent! Your CEFR level is ${cefrLevel}.`
        : `Keep practicing! Your CEFR level is ${cefrLevel}. You need 60% to pass.`,
    };
  }

  /**
   * Map percentage score to CEFR level.
   */
  mapScoreToCEFR(score) {
    if (score <= 20) return "A1";
    if (score <= 40) return "A2";
    if (score <= 60) return "B1";
    if (score <= 80) return "B2";
    return "C1";
  }

  /**
   * Get test result for a session.
   */
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
      section_scores: session.section_scores,
      passed: session.passed,
      cefr_level: session.cefr_level,
      cefr_description: cefrDescriptions[session.cefr_level] || "",
      recommendations: recommendations[session.cefr_level] || [],
      level_input: session.level_input,
      selected_topics: session.selected_topics,
      age: session.age,
      status: session.status,
      completed_at: session.completed_at,
    };
  }

  /**
   * Get user's placement test history.
   */
  async getHistory(userId, { limit = 10, page = 1 } = {}) {
    const offset = (page - 1) * limit;

    const { count, rows } = await PlacementTestSession.findAndCountAll({
      where: { user_id: userId },
      order: [["created_at", "DESC"]],
      limit: parseInt(limit),
      offset,
      attributes: ["id", "age", "level_input", "selected_topics", "score", "passed", "cefr_level", "status", "created_at", "completed_at"],
    });

    return {
      sessions: rows.map((s) => ({
        session_id: s.id,
        age: s.age,
        level_input: s.level_input,
        selected_topics: s.selected_topics,
        score: s.score,
        passed: s.passed,
        cefr_level: s.cefr_level,
        status: s.status,
        created_at: s.created_at,
        completed_at: s.completed_at,
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
