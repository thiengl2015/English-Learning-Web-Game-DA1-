const { GameConfig, Unit, Lesson, Vocabulary, Grammar } = require("../models");

const GAME_DEFAULTS = {
  "galaxy-match": {
    difficulty: "easy",
    questions_count: 10,
    time_limit: 120,
    passing_score: 70,
    xp_reward: 50,
  },
  "planetary-order": {
    difficulty: "medium",
    questions_count: 8,
    time_limit: 180,
    passing_score: 75,
    xp_reward: 75,
  },
  "rescue-mission": {
    difficulty: "medium",
    questions_count: 10,
    time_limit: 150,
    passing_score: 70,
    xp_reward: 60,
  },
  "signal-check": {
    difficulty: "hard",
    questions_count: 10,
    time_limit: 120,
    passing_score: 80,
    xp_reward: 100,
  },
  "voice-command": {
    difficulty: "medium",
    questions_count: 8,
    time_limit: 360,
    passing_score: 70,
    xp_reward: 80,
  },
};

const GAME_BY_LESSON_ORDER = {
  1: "signal-check",
  2: "galaxy-match",
  3: "planetary-order",
  4: "rescue-mission",
  5: "voice-command",
};

const pickGameType = (lesson, hasVocabulary, hasGrammar) => {
  if (lesson.type === "grammar" || (!hasVocabulary && hasGrammar)) {
    return "planetary-order";
  }
  if (lesson.type === "test") {
    return "signal-check";
  }
  return GAME_BY_LESSON_ORDER[Number(lesson.order_index)] || "signal-check";
};

const seedGames = async () => {
  try {
    console.log("Seeding one game configuration per lesson...");

    const units = await Unit.findAll({
      order: [["order_index", "ASC"]],
    });

    if (units.length === 0) {
      console.log("No units found. Please seed units first.");
      return [];
    }

    await GameConfig.destroy({ where: {}, force: true });

    const gameConfigs = [];

    for (const unit of units) {
      const lessons = await Lesson.findAll({
        where: { unit_id: unit.id },
        order: [["order_index", "ASC"]],
      });
      const [unitVocabularyCount, unitGrammarCount] = await Promise.all([
        Vocabulary.count({ where: { unit_id: unit.id } }),
        Grammar.count({ where: { unit_id: unit.id } }),
      ]);

      for (const lesson of lessons) {
        const [lessonVocabularyCount, lessonGrammarCount] = await Promise.all([
          Vocabulary.count({ where: { lesson_id: lesson.id } }),
          Grammar.count({ where: { lesson_id: lesson.id } }),
        ]);
        const hasVocabulary = lessonVocabularyCount > 0 || unitVocabularyCount > 0;
        const hasGrammar = lessonGrammarCount > 0 || unitGrammarCount > 0;

        if (!hasVocabulary && !hasGrammar) {
          continue;
        }

        const gameType = pickGameType(lesson, hasVocabulary, hasGrammar);
        const defaults = GAME_DEFAULTS[gameType];
        const availableItems = hasVocabulary
          ? Math.max(lessonVocabularyCount, unitVocabularyCount)
          : Math.max(lessonGrammarCount, unitGrammarCount);

        gameConfigs.push({
          game_type: gameType,
          unit_id: unit.id,
          lesson_id: lesson.id,
          difficulty: defaults.difficulty,
          questions_count: Math.max(
            1,
            Math.min(defaults.questions_count, availableItems)
          ),
          time_limit: defaults.time_limit,
          passing_score: defaults.passing_score,
          xp_reward: defaults.xp_reward,
        });
      }
    }

    const configs = await GameConfig.bulkCreate(gameConfigs);

    console.log(`Successfully seeded ${configs.length} game configurations.`);
    console.log("   - one game config per seeded lesson");

    return configs;
  } catch (error) {
    console.error("Error seeding games:", error);
    throw error;
  }
};

module.exports = seedGames;
