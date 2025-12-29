const { sequelize } = require('../models');
const seedUnits = require("./01-units.seed");
const seedLessons = require("./02-lessons.seed");
const seedVocabulary = require("./03-vocabulary.seed");
const seedGames = require("./04-games.seed");

const runSeeders = async () => {
  try {
    console.log(" Starting database seeding...\n");

    //  TẮT FOREIGN KEY CHECKS
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 0");
    
    console.log("  Clearing existing data...");
    
    //  XÓA BẢNG CON TRƯỚC (có foreign key tới bảng khác)
    await sequelize.query("DELETE FROM game_wrong_answers");
    await sequelize.query("DELETE FROM game_sessions");
    await sequelize.query("DELETE FROM user_vocabulary");
    await sequelize.query("DELETE FROM lesson_progress");
    await sequelize.query("DELETE FROM game_config");
    
    //  XÓA BẢNG CHA SAU
    await sequelize.query("DELETE FROM vocabulary");
    await sequelize.query("DELETE FROM lessons");
    await sequelize.query("DELETE FROM units");

    await sequelize.query("ALTER TABLE units AUTO_INCREMENT = 1");
    await sequelize.query("ALTER TABLE lessons AUTO_INCREMENT = 1");
    await sequelize.query("ALTER TABLE vocabulary AUTO_INCREMENT = 1");
    await sequelize.query("ALTER TABLE game_config AUTO_INCREMENT = 1");
    
    console.log(" Data cleared successfully!\n");

    //  BẬT LẠI FOREIGN KEY CHECKS
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");

    // Chạy các seeders
    console.log("📦 Seeding units...");
    await seedUnits();

    console.log("📦 Seeding lessons...");
    await seedLessons();

    console.log("📦 Seeding vocabulary...");
    await seedVocabulary();

    console.log("📦 Seeding games...");
    await seedGames();

    console.log("\n All seeders completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n Seeding failed:", error);
    //  BẬT LẠI FOREIGN KEY CHECKS nếu có lỗi
    await sequelize.query("SET FOREIGN_KEY_CHECKS = 1");
    process.exit(1);
  }
};

if (require.main === module) {
  runSeeders();
}

module.exports = runSeeders;