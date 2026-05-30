const { sequelize } = require('../models');
const seedUnits = require("./01-units.seed");
const seedLessons = require("./02-lessons.seed");
const seedVocabulary = require("./03-vocabulary.seed");
const seedGames = require("./04-games.seed");
const seedUsers = require("./05-users.seed");
const seedMissions = require("./06-missions.seed");
const seedUserMissions = require("./07-user-missions.seed");
const seedConversations = require("./08-conversations.seed");
const seedFeedback = require("./09-feedback.seed");
const seedPayments = require("./10-payments.seed");
const seedLessonProgress = require("./11-lesson-progress.seed");
const seedUserVocabulary = require("./12-user-vocabulary.seed");
const seedPractice = require("./05-practice.seed");

const runSeeders = async () => {
  try {
    console.log("═══════════════════════════════════════════════════");
    console.log("       Starting Database Seeding...                ");
    console.log("═══════════════════════════════════════════════════\n");

    // TẮT FOREIGN KEY CHECKS
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
    console.log("🔒 Foreign key checks disabled\n");

    // XÓA BẢNG CON TRƯỚC (reverse order của bảng cha)
    console.log("🗑️  Clearing existing data...");
    const tables = [
      'game_wrong_answers',
      'game_sessions',
      'user_vocabulary',
      'lesson_progress',
      'user_missions',
      'conversation_messages',
      'conversations',
      'feedback',
      'payment_orders',
      'user_progress',
      'game_config',
      'lesson_games',
      'vocabulary',
      'lessons',
      'missions',
      'users',
      'units',
    ];

    for (const table of tables) {
      await sequelize.query(`DELETE FROM ${table}`);
    }

    // Reset AUTO_INCREMENT
    const resetTables = ['units', 'lessons', 'vocabulary', 'game_config', 'lesson_games', 'missions'];
    for (const table of resetTables) {
      await sequelize.query(`ALTER TABLE ${table} AUTO_INCREMENT = 1`);
    }

    console.log("✅ Data cleared successfully!\n");

    // BẬT LẠI FOREIGN KEY CHECKS
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
    console.log("🔓 Foreign key checks enabled\n");

    console.log("───────────────────────────────────────────────────");

    // CHẠY CÁC SEEDERS THEO THỨ TỰ
    await seedUnits();
    await seedLessons();
    await seedVocabulary();
    await seedGames();
    await seedUsers();
    await seedMissions();
    await seedUserMissions();
    await seedConversations();
    await seedFeedback();
    await seedPayments();
    await seedLessonProgress();
    await seedUserVocabulary();

    console.log("\n───────────────────────────────────────────────────");
    console.log("═══════════════════════════════════════════════════");
    console.log("✅ All seeders completed successfully!");
    console.log("═══════════════════════════════════════════════════");
    console.log("\n📋 Test Accounts:");
    console.log("   Admin:  admin@example.com / 123456");
    console.log("   User:   testuser@example.com / 123456");
    console.log("   User:   john@example.com / 123456");
    console.log("\n");

    await seedPractice();

    console.log("\n All seeders completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Seeding failed:", error);
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
    process.exit(1);
  }
};

if (require.main === module) {
  runSeeders();
}

module.exports = runSeeders;

