const { User, UserProgress, sequelize } = require("../models");
const bcrypt = require("bcryptjs");

const seedUsers = async () => {
  try {
    console.log("📦 Seeding users...");

    await User.destroy({ where: {}, force: true });
    await UserProgress.destroy({ where: {}, force: true });

    const password = await bcrypt.hash("123456", 10);

    const users = await User.bulkCreate([
      {
        username: "admin",
        email: "admin@example.com",
        password_hash: password,
        display_name: "Admin User",
        role: "admin",
        level: 10,
        subscription: "Super",
        status: "Active",
        native_language: "vi",
        current_level: "advanced",
        learning_goal: "ielts",
        daily_goal: 30,
      },
      {
        username: "testuser",
        email: "testuser@example.com",
        password_hash: password,
        display_name: "Test User",
        role: "user",
        level: 1,
        subscription: "Free",
        status: "Active",
        native_language: "vi",
        current_level: "beginner",
        learning_goal: "daily",
        daily_goal: 15,
      },
      {
        username: "johndoe",
        email: "john@example.com",
        password_hash: password,
        display_name: "John Doe",
        role: "user",
        level: 5,
        subscription: "Premium",
        status: "Active",
        native_language: "vi",
        current_level: "intermediate",
        learning_goal: "toeic",
        daily_goal: 20,
      },
      {
        username: "janedoe",
        email: "jane@example.com",
        password_hash: password,
        display_name: "Jane Doe",
        role: "user",
        level: 3,
        subscription: "Premium",
        status: "Active",
        native_language: "vi",
        current_level: "beginner",
        learning_goal: "travel",
        daily_goal: 25,
      },
    ]);

    // Create user progress for each user
    const progressData = users.map((user) => ({
      user_id: user.id,
      total_xp: user.level * 500,
      weekly_xp: Math.floor(Math.random() * 2000),
      xp_this_week: Math.floor(Math.random() * 1500),
      level: user.level,
      streak_days: Math.floor(Math.random() * 30),
      last_active_date: new Date(),
      words_learned: user.level * 10,
      total_study_minutes: user.level * 60,
      units_completed: Math.floor(user.level / 2),
      lessons_completed: user.level * 5,
      league: user.level >= 8 ? "Diamond" : user.level >= 5 ? "Gold" : user.level >= 3 ? "Silver" : "Bronze",
    }));

    await UserProgress.bulkCreate(progressData);

    console.log(`✅ Successfully seeded ${users.length} users with progress!`);
    return users;
  } catch (error) {
    console.error("❌ Error seeding users:", error);
    throw error;
  }
};

module.exports = seedUsers;
