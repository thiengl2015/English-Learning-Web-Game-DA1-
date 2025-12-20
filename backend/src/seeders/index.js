const seedUnits = require("./01-units.seed");
const seedLessons = require("./02-lessons.seed");

const runSeeders = async () => {
  try {
    console.log(" Starting database seeding...\n");

    await seedUnits();
    await seedLessons();

    console.log("\n All seeders completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n Seeding failed:", error);
    process.exit(1);
  }
};

if (require.main === module) {
  runSeeders();
}

module.exports = runSeeders;
