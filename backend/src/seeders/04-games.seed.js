const { GameConfig, Unit, Lesson } = require("../models");

const gameTypes = [
  {
    type: "galaxy-match",
    name: "Galaxy Match",
    description: "Match English words with Vietnamese translations",
    difficulty: "easy",
    questions_count: 10,
    time_limit: 120,
    passing_score: 70,
    xp_reward: 50,
  },
  {
    type: "planetary-order",
    name: "Planetary Order",
    description: "Arrange words to form correct sentences",
    difficulty: "medium",
    questions_count: 8,
    time_limit: 180,
    passing_score: 75,
    xp_reward: 75,
  },
  {
    type: "rescue-mission",
    name: "Rescue Mission",
    description: "Choose the correct word to complete sentences",
    difficulty: "medium",
    questions_count: 10,
    time_limit: 150,
    passing_score: 70,
    xp_reward: 60,
  },
  {
    type: "signal-check",
    name: "Signal Check",
    description: "Listen and choose the correct word",
    difficulty: "hard",
    questions_count: 10,
    time_limit: 120,
    passing_score: 80,
    xp_reward: 100,
  },
];

const seedGames = async () => {
  try {
    console.log("📦 Seeding game configurations...");

    const units = await Unit.findAll({
      order: [["order_index", "ASC"]],
      limit: 3,
    });

    if (units.length === 0) {
      console.log("⚠️  No units found. Please seed units first.");
      return;
    }

    //  Dùng DELETE thay vì TRUNCATE
    await GameConfig.destroy({ where: {}, force: true });

    const gameConfigs = [];
    for (const unit of units) {
      const lessons = await Lesson.findAll({
        where: { unit_id: unit.id },
        order: [["order_index", "ASC"]],
        limit: 3,
      });

      for (const lesson of lessons) {
        for (const gameType of gameTypes) {
          gameConfigs.push({
            game_type: gameType.type,
            unit_id: unit.id,
            lesson_id: lesson.id,
            difficulty: gameType.difficulty,
            questions_count: gameType.questions_count,
            time_limit: gameType.time_limit,
            passing_score: gameType.passing_score,
            xp_reward: gameType.xp_reward,
          });
        }
      }
    }

    const configs = await GameConfig.bulkCreate(gameConfigs);

    console.log(` Successfully seeded ${configs.length} game configurations!`);
    console.log(`   - ${units.length} units`);
    console.log(`   - ${gameTypes.length} game types per lesson`);

    return configs;
  } catch (error) {
    console.error(" Error seeding games:", error);
    throw error;
  }
};

module.exports = seedGames;
