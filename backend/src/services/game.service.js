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
}

module.exports = new GameService();
