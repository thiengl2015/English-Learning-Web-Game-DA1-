const { UserMission, User, Mission, sequelize } = require("../models");

const seedUserMissions = async () => {
  try {
    console.log("📦 Seeding user missions...");

    await UserMission.destroy({ where: {}, force: true });

    const users = await User.findAll({ limit: 2 });
    const missions = await Mission.findAll();

    if (users.length === 0 || missions.length === 0) {
      console.log("⚠️  Users or missions not found. Please seed them first.");
      return;
    }

    const userMissions = [];

    // Give each user some mission progress
    for (const user of users) {
      // Daily missions - random progress
      const dailyMissions = missions.filter((m) => m.type === "daily");
      for (const mission of dailyMissions.slice(0, 3)) {
        const isCompleted = Math.random() > 0.5;
        const isClaimed = isCompleted && Math.random() > 0.5;
        userMissions.push({
          user_id: user.id,
          mission_id: mission.id,
          progress: isCompleted ? mission.target : Math.floor(Math.random() * mission.target),
          status: isClaimed ? "claimed" : isCompleted ? "completed" : "in_progress",
          claimed_at: isClaimed ? new Date() : null,
          reset_date: new Date(),
        });
      }

      // Achievement missions - partial progress
      const achievementMissions = missions.filter((m) => m.type === "achievement");
      for (const mission of achievementMissions.slice(0, 4)) {
        const hasProgress = Math.random() > 0.3;
        userMissions.push({
          user_id: user.id,
          mission_id: mission.id,
          progress: hasProgress ? Math.floor(Math.random() * mission.target * 0.5) : 0,
          status: "in_progress",
          claimed_at: null,
          reset_date: null,
        });
      }
    }

    const created = await UserMission.bulkCreate(userMissions);
    console.log(`✅ Successfully seeded ${created.length} user missions!`);
    return created;
  } catch (error) {
    console.error("❌ Error seeding user missions:", error);
    throw error;
  }
};

module.exports = seedUserMissions;
