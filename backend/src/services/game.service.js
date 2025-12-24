const {
  GameConfig,
  GameSession,
  GameWrongAnswer,
  Vocabulary,
  Unit,
  Lesson,
  User,
} = require("../models");
const { Op } = require("sequelize");
const userService = require("./user.service");

class GameService {
  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  async generateQuestions(gameConfig, vocabulary) {
    const { game_type, questions_count } = gameConfig;

    const selectedVocab = this.shuffleArray(vocabulary).slice(
      0,
      questions_count
    );

    const questions = [];

    for (let i = 0; i < selectedVocab.length; i++) {
      const vocab = selectedVocab[i];

      switch (game_type) {
        case "galaxy-match":
          questions.push(this.generateGalaxyMatchQuestion(vocab, vocabulary));
          break;

        case "planetary-order":
          questions.push(this.generatePlanetaryOrderQuestion(vocab));
          break;

        case "rescue-mission":
          questions.push(this.generateRescueMissionQuestion(vocab, vocabulary));
          break;

        case "signal-check":
          questions.push(this.generateSignalCheckQuestion(vocab, vocabulary));
          break;

        default:
          throw new Error(`Unknown game type: ${game_type}`);
      }
    }

    return questions;
  }

  generateGalaxyMatchQuestion(vocab, allVocabulary) {
    const wrongAnswers = allVocabulary
      .filter((v) => v.id !== vocab.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((v) => v.translation);

    const options = this.shuffleArray([
      { id: "A", text: vocab.translation, is_correct: true },
      { id: "B", text: wrongAnswers[0], is_correct: false },
      { id: "C", text: wrongAnswers[1], is_correct: false },
      { id: "D", text: wrongAnswers[2], is_correct: false },
    ]);

    return {
      vocab_id: vocab.id,
      question: `What is the Vietnamese translation of "${vocab.word}"?`,
      question_vi: `"${vocab.word}" nghĩa tiếng Việt là gì?`,
      type: "multiple-choice",
      options: options,
      correct_answer: vocab.translation,
      phonetic: vocab.phonetic,
    };
  }

  generatePlanetaryOrderQuestion(vocab) {
    const patterns = [
      `I say ${vocab.word} every day`,
      `She likes to ${vocab.word}`,
      `This is a ${vocab.word}`,
      `Can you ${vocab.word} please`,
      `${vocab.word} is important`,
    ];

    const sentence = patterns[Math.floor(Math.random() * patterns.length)];
    const words = sentence.split(" ");
    const shuffledWords = this.shuffleArray(words);

    return {
      vocab_id: vocab.id,
      question: `Arrange these words to form a correct sentence:`,
      question_vi: `Sắp xếp các từ sau thành câu đúng:`,
      type: "word-order",
      words: shuffledWords,
      correct_answer: sentence,
      hint: `Uses the word "${vocab.word}"`,
    };
  }

  generateRescueMissionQuestion(vocab, allVocabulary) {
    const wrongWords = allVocabulary
      .filter((v) => v.id !== vocab.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((v) => v.word);

    const sentences = [
      `I want to say _____ to you`,
      `Can you _____ me?`,
      `This is very _____`,
      `_____ is the answer`,
    ];

    const sentence = sentences[Math.floor(Math.random() * sentences.length)];

    const options = this.shuffleArray([
      { id: "A", text: vocab.word, is_correct: true },
      { id: "B", text: wrongWords[0], is_correct: false },
      { id: "C", text: wrongWords[1], is_correct: false },
      { id: "D", text: wrongWords[2], is_correct: false },
    ]);

    return {
      vocab_id: vocab.id,
      question: `Fill in the blank: ${sentence}`,
      question_vi: `Điền vào chỗ trống: ${sentence}`,
      type: "fill-blank",
      options: options,
      correct_answer: vocab.word,
      translation: vocab.translation,
    };
  }

  generateSignalCheckQuestion(vocab, allVocabulary) {
    const wrongWords = allVocabulary
      .filter((v) => v.id !== vocab.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((v) => v.word);

    const options = this.shuffleArray([
      { id: "A", text: vocab.word, is_correct: true },
      { id: "B", text: wrongWords[0], is_correct: false },
      { id: "C", text: wrongWords[1], is_correct: false },
      { id: "D", text: wrongWords[2], is_correct: false },
    ]);

    return {
      vocab_id: vocab.id,
      question: `Listen and choose the correct word:`,
      question_vi: `Nghe và chọn từ đúng:`,
      type: "audio",
      audio_url: vocab.audio_url,
      options: options,
      correct_answer: vocab.word,
      translation: vocab.translation,
      phonetic: vocab.phonetic,
    };
  }

  async getGameTypes() {
    return [
      {
        type: "galaxy-match",
        name: "Galaxy Match",
        description: "Match English words with Vietnamese translations",
        icon: "🌌",
        difficulty: "easy",
      },
      {
        type: "planetary-order",
        name: "Planetary Order",
        description: "Arrange words to form correct sentences",
        icon: "🪐",
        difficulty: "medium",
      },
      {
        type: "rescue-mission",
        name: "Rescue Mission",
        description: "Choose the correct word to complete sentences",
        icon: "🚀",
        difficulty: "medium",
      },
      {
        type: "signal-check",
        name: "Signal Check",
        description: "Listen and choose the correct word",
        icon: "📡",
        difficulty: "hard",
      },
    ];
  }

  async getGamesByLesson(lessonId, userId) {
    const games = await GameConfig.findAll({
      where: { lesson_id: lessonId },
      include: [
        {
          model: Unit,
          as: "unit",
          attributes: ["id", "title", "icon"],
        },
        {
          model: Lesson,
          as: "lesson",
          attributes: ["id", "title", "type"],
        },
      ],
      order: [["game_type", "ASC"]],
    });

    const gameConfigIds = games.map((g) => g.id);
    const bestSessions = await GameSession.findAll({
      where: {
        user_id: userId,
        game_config_id: { [Op.in]: gameConfigIds },
        status: "completed",
      },
      attributes: [
        "game_config_id",
        [
          require("sequelize").fn("MAX", require("sequelize").col("score")),
          "best_score",
        ],
        [
          require("sequelize").fn("MAX", require("sequelize").col("xp_earned")),
          "best_xp",
        ],
      ],
      group: ["game_config_id"],
    });

    return games.map((game) => {
      const gameData = game.toJSON();
      const bestSession = bestSessions.find(
        (s) => s.game_config_id === game.id
      );

      gameData.user_best = bestSession
        ? {
            score: bestSession.dataValues.best_score,
            xp: bestSession.dataValues.best_xp,
          }
        : null;

      return gameData;
    });
  }

  async startGame(gameConfigId, userId) {
    const gameConfig = await GameConfig.findByPk(gameConfigId, {
      include: [
        {
          model: Lesson,
          as: "lesson",
        },
      ],
    });

    if (!gameConfig) {
      throw new Error("Game configuration not found");
    }

    const vocabulary = await Vocabulary.findAll({
      where: { lesson_id: gameConfig.lesson_id },
    });

    if (vocabulary.length < gameConfig.questions_count) {
      throw new Error(
        `Not enough vocabulary. Need ${gameConfig.questions_count}, found ${vocabulary.length}`
      );
    }

    const questions = await this.generateQuestions(gameConfig, vocabulary);

    const session = await GameSession.create({
      user_id: userId,
      game_config_id: gameConfigId,
      status: "in-progress",
      total_questions: questions.length,
      questions_data: questions,
    });

    const sessionData = session.toJSON();

    sessionData.questions = sessionData.questions_data.map((q, index) => {
      const questionCopy = { ...q };
      delete questionCopy.correct_answer;
      return {
        index: index,
        ...questionCopy,
      };
    });

    delete sessionData.questions_data;

    return {
      session_id: session.id,
      game_type: gameConfig.game_type,
      questions_count: questions.length,
      time_limit: gameConfig.time_limit,
      passing_score: gameConfig.passing_score,
      questions: sessionData.questions,
      started_at: session.started_at,
    };
  }
  async submitAnswer(sessionId, userId, answerData) {
    const { question_index, answer } = answerData;

    const session = await GameSession.findOne({
      where: {
        id: sessionId,
        user_id: userId,
      },
    });

    if (!session) {
      throw new Error("Game session not found");
    }

    if (session.status !== "in-progress") {
      throw new Error("Game session is not active");
    }

    const questions = session.questions_data;

    if (question_index < 0 || question_index >= questions.length) {
      throw new Error("Invalid question index");
    }

    const question = questions[question_index];

    if (question.user_answer !== undefined) {
      throw new Error("Question already answered");
    }

    const isCorrect =
      answer.toLowerCase().trim() ===
      question.correct_answer.toLowerCase().trim();

    questions[question_index] = {
      ...question,
      user_answer: answer,
      is_correct: isCorrect,
      answered_at: new Date(),
    };

    const correctCount = questions.filter((q) => q.is_correct === true).length;

    if (!isCorrect) {
      await GameWrongAnswer.create({
        session_id: sessionId,
        vocab_id: question.vocab_id,
        question: question.question,
        user_answer: answer,
        correct_answer: question.correct_answer,
      });
    }

    await session.update({
      questions_data: questions,
      correct_answers: correctCount,
    });

    return {
      question_index: question_index,
      is_correct: isCorrect,
      correct_answer: isCorrect ? null : question.correct_answer,
      current_score: Math.round((correctCount / questions.length) * 100),
      answered_count: questions.filter((q) => q.user_answer !== undefined)
        .length,
      total_questions: questions.length,
    };
  }

  async completeGame(sessionId, userId, completionData = {}) {
    const { time_spent = 0 } = completionData;

    const session = await GameSession.findOne({
      where: {
        id: sessionId,
        user_id: userId,
      },
      include: [
        {
          model: GameConfig,
          as: "config",
        },
      ],
    });

    if (!session) {
      throw new Error("Game session not found");
    }

    if (session.status !== "in-progress") {
      throw new Error("Game session is not active");
    }

    const questions = session.questions_data;
    const answeredQuestions = questions.filter(
      (q) => q.user_answer !== undefined
    );
    const correctCount = questions.filter((q) => q.is_correct === true).length;

    const score = Math.round((correctCount / session.total_questions) * 100);
    const isPassed = score >= session.config.passing_score;

    let xpEarned = 0;
    if (isPassed) {
      xpEarned = session.config.xp_reward;

      if (score === 100) {
        xpEarned = Math.round(xpEarned * 1.5);
      } else if (score >= 90) {
        xpEarned = Math.round(xpEarned * 1.2);
      }
    }

    await session.update({
      status: "completed",
      score: score,
      correct_answers: correctCount,
      time_spent: time_spent,
      xp_earned: xpEarned,
      completed_at: new Date(),
    });

    if (isPassed && xpEarned > 0) {
      await userService.addXP(userId, xpEarned);
    }

    return {
      session_id: sessionId,
      status: "completed",
      score: score,
      correct_answers: correctCount,
      total_questions: session.total_questions,
      accuracy: score,
      passed: isPassed,
      passing_score: session.config.passing_score,
      xp_earned: xpEarned,
      time_spent: time_spent,
      message: isPassed
        ? `Congratulations! You earned ${xpEarned} XP!`
        : `Keep practicing! You need ${session.config.passing_score}% to pass.`,
    };
  }

  async getGameResults(sessionId, userId) {
    const session = await GameSession.findOne({
      where: {
        id: sessionId,
        user_id: userId,
      },
      include: [
        {
          model: GameConfig,
          as: "config",
          include: [
            {
              model: Lesson,
              as: "lesson",
              attributes: ["id", "title", "type"],
            },
            {
              model: Unit,
              as: "unit",
              attributes: ["id", "title", "icon"],
            },
          ],
        },
        {
          model: GameWrongAnswer,
          as: "wrongAnswers",
          include: [
            {
              model: Vocabulary,
              as: "vocabulary",
              attributes: ["id", "word", "phonetic", "translation"],
            },
          ],
        },
      ],
    });

    if (!session) {
      throw new Error("Game session not found");
    }

    const sessionData = session.toJSON();

    return {
      session_id: session.id,
      game_type: session.config.game_type,
      status: session.status,
      score: session.score,
      correct_answers: session.correct_answers,
      total_questions: session.total_questions,
      accuracy: session.score,
      passed: session.score >= session.config.passing_score,
      passing_score: session.config.passing_score,
      xp_earned: session.xp_earned,
      time_spent: session.time_spent,
      started_at: session.started_at,
      completed_at: session.completed_at,
      lesson: session.config.lesson,
      unit: session.config.unit,
      wrong_answers_count: session.wrongAnswers.length,
      questions: session.status === "completed" ? session.questions_data : null,
    };
  }

  async getWrongAnswers(sessionId, userId) {
    const session = await GameSession.findOne({
      where: {
        id: sessionId,
        user_id: userId,
      },
    });

    if (!session) {
      throw new Error("Game session not found");
    }

    const wrongAnswers = await GameWrongAnswer.findAll({
      where: { session_id: sessionId },
      include: [
        {
          model: Vocabulary,
          as: "vocabulary",
          attributes: [
            "id",
            "word",
            "phonetic",
            "translation",
            "image_url",
            "audio_url",
          ],
        },
      ],
      order: [["created_at", "ASC"]],
    });

    return wrongAnswers.map((wa) => ({
      id: wa.id,
      question: wa.question,
      user_answer: wa.user_answer,
      correct_answer: wa.correct_answer,
      vocabulary: wa.vocabulary,
    }));
  }

  async getGameHistory(userId, filters = {}) {
    const { game_type, limit = 20, page = 1 } = filters;

    const where = {
      user_id: userId,
      status: "completed",
    };

    const offset = (page - 1) * limit;

    const { count, rows } = await GameSession.findAndCountAll({
      where,
      include: [
        {
          model: GameConfig,
          as: "config",
          where: game_type ? { game_type } : {},
          include: [
            {
              model: Lesson,
              as: "lesson",
              attributes: ["id", "title"],
            },
            {
              model: Unit,
              as: "unit",
              attributes: ["id", "title", "icon"],
            },
          ],
        },
      ],
      order: [["completed_at", "DESC"]],
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    return {
      sessions: rows.map((session) => ({
        session_id: session.id,
        game_type: session.config.game_type,
        score: session.score,
        xp_earned: session.xp_earned,
        passed: session.score >= session.config.passing_score,
        completed_at: session.completed_at,
        lesson: session.config.lesson,
        unit: session.config.unit,
      })),
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async getGameStatistics(userId) {
    const totalGames = await GameSession.count({
      where: {
        user_id: userId,
        status: "completed",
      },
    });

    const gamesByType = await GameSession.findAll({
      where: {
        user_id: userId,
        status: "completed",
      },
      include: [
        {
          model: GameConfig,
          as: "config",
          attributes: ["game_type"],
        },
      ],
      attributes: [
        [
          require("sequelize").fn(
            "COUNT",
            require("sequelize").col("GameSession.id")
          ),
          "count",
        ],
        [
          require("sequelize").fn("AVG", require("sequelize").col("score")),
          "avg_score",
        ],
        [
          require("sequelize").fn("SUM", require("sequelize").col("xp_earned")),
          "total_xp",
        ],
      ],
      group: ["config.game_type"],
      raw: true,
    });

    const overallStats = await GameSession.findOne({
      where: {
        user_id: userId,
        status: "completed",
      },
      attributes: [
        [
          require("sequelize").fn("AVG", require("sequelize").col("score")),
          "avg_score",
        ],
        [
          require("sequelize").fn("MAX", require("sequelize").col("score")),
          "best_score",
        ],
        [
          require("sequelize").fn("SUM", require("sequelize").col("xp_earned")),
          "total_xp",
        ],
        [
          require("sequelize").fn(
            "SUM",
            require("sequelize").col("correct_answers")
          ),
          "total_correct",
        ],
        [
          require("sequelize").fn(
            "SUM",
            require("sequelize").col("total_questions")
          ),
          "total_questions",
        ],
      ],
      raw: true,
    });

    const gamesPassed = await GameSession.count({
      where: {
        user_id: userId,
        status: "completed",
        score: { [Op.gte]: require("sequelize").col("config.passing_score") },
      },
      include: [
        {
          model: GameConfig,
          as: "config",
          attributes: [],
        },
      ],
    });

    const perfectScores = await GameSession.count({
      where: {
        user_id: userId,
        status: "completed",
        score: 100,
      },
    });

    return {
      total_games: totalGames,
      games_passed: gamesPassed,
      games_failed: totalGames - gamesPassed,
      pass_rate:
        totalGames > 0 ? Math.round((gamesPassed / totalGames) * 100) : 0,
      perfect_scores: perfectScores,
      average_score: overallStats ? Math.round(overallStats.avg_score) : 0,
      best_score: overallStats ? overallStats.best_score : 0,
      total_xp_earned: overallStats ? overallStats.total_xp || 0 : 0,
      total_correct: overallStats ? overallStats.total_correct || 0 : 0,
      total_questions: overallStats ? overallStats.total_questions || 0 : 0,
      accuracy:
        overallStats && overallStats.total_questions > 0
          ? Math.round(
              (overallStats.total_correct / overallStats.total_questions) * 100
            )
          : 0,
      by_game_type: gamesByType.map((stat) => ({
        game_type: stat["config.game_type"],
        games_played: stat.count,
        average_score: Math.round(stat.avg_score),
        total_xp: stat.total_xp || 0,
      })),
    };
  }

  async replayGame(gameConfigId, userId) {
    return await this.startGame(gameConfigId, userId);
  }
  async abandonGame(sessionId, userId) {
    const session = await GameSession.findOne({
      where: {
        id: sessionId,
        user_id: userId,
        status: "in-progress",
      },
    });

    if (!session) {
      throw new Error("Active game session not found");
    }

    await session.update({
      status: "abandoned",
      completed_at: new Date(),
    });

    return {
      message: "Game abandoned",
      session_id: sessionId,
    };
  }
}

module.exports = new GameService();
