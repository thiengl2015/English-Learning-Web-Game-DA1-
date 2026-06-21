const { GameConfig, Unit, Lesson, Vocabulary, Grammar } = require("../models");
const {
  GAME_DEFAULTS,
  getDefaultGameTypeForLesson,
} = require("../utils/lesson-game.util");

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

        const gameType = getDefaultGameTypeForLesson(lesson, unit);
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
    console.log("   - lessons 1-4 rotate through the four practice games");
    console.log("   - lesson 5/test always uses signal-check");

    return configs;
  } catch (error) {
    console.error("Error seeding games:", error);
    throw error;
  }
};

module.exports = seedGames;
