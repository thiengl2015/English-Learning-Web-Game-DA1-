const missionService = require("../services/mission.service");

const seedMissions = async () => {
  try {
    console.log("Seeding missions...");
    const result = await missionService.seedMissions({ initializeUsers: false });
    console.log(`Successfully seeded ${result.active} active missions!`);
    console.log(`   - created: ${result.created}`);
    console.log(`   - updated: ${result.updated}`);
    return result;
  } catch (error) {
    console.error("Error seeding missions:", error);
    throw error;
  }
};

module.exports = seedMissions;
