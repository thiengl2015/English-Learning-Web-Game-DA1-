const { LessonProgress, User, Unit, Lesson } = require("../models");

const seedLessonProgress = async () => {
  try {
    console.log("📦 Seeding lesson progress...");

    await LessonProgress.destroy({ where: {}, force: true });

    const users = await User.findAll({ limit: 2 });
    const lessons = await Lesson.findAll({ limit: 10 });

    if (users.length === 0 || lessons.length === 0) {
      console.log("⚠️  Users or lessons not found. Please seed them first.");
      return;
    }

    const progressData = [];

    for (const user of users) {
      for (let i = 0; i < Math.min(5, lessons.length); i++) {
        const lesson = lessons[i];
        const isCompleted = Math.random() > 0.3;
        const status = isCompleted ? "completed" : Math.random() > 0.5 ? "in-progress" : "locked";

        progressData.push({
          user_id: user.id,
          unit_id: lesson.unit_id,
          lesson_id: lesson.id,
          status,
          stars_earned: isCompleted ? Math.floor(Math.random() * 3) + 1 : 0,
          is_review: Math.random() > 0.7,
          xp_earned: isCompleted ? Math.floor(Math.random() * 50) + 20 : 0,
          correct_count: isCompleted ? Math.floor(Math.random() * 10) + 5 : 0,
          total_count: 10,
          completed_at: isCompleted ? new Date(Date.now() - Math.random() * 86400000 * 7) : null,
          first_completed_at: isCompleted ? new Date(Date.now() - Math.random() * 86400000 * 30) : null,
        });
      }
    }

    const progress = await LessonProgress.bulkCreate(progressData);
    console.log(`✅ Successfully seeded ${progress.length} lesson progress entries!`);
    return progress;
  } catch (error) {
    console.error("❌ Error seeding lesson progress:", error);
    throw error;
  }
};

module.exports = seedLessonProgress;
