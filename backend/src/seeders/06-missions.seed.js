const { Mission } = require("../models");

const dailyMissions = [
  { code: "login", title: "Check-in", description: "Đăng nhập vào ứng dụng hàng ngày", icon: "🌟", target: 1, xp_reward: 10, order_index: 1, reset_daily: true },
  { code: "flashcard", title: "Ôn tập", description: "Hoàn thành 1 bộ flashcard", icon: "🎴", target: 1, xp_reward: 20, order_index: 2, reset_daily: true },
  { code: "complete_level", title: "Chinh phục", description: "Chinh phục 1 level mới", icon: "🎯", target: 1, xp_reward: 10, order_index: 3, reset_daily: true },
  { code: "complete_lesson", title: "Học tập", description: "Hoàn thành 1 bài học mới", icon: "📚", target: 1, xp_reward: 25, order_index: 4, reset_daily: true },
  { code: "daily_goal", title: "Mục tiêu hàng ngày", description: "Học 15 phút mỗi ngày", icon: "⏰", target: 15, xp_reward: 50, order_index: 5, reset_daily: true },
];

const achievementMissions = [
  { code: "unit_5", title: "Người mở đường", description: "Hoàn thành 5 Units", icon: "🚀", target: 5, xp_reward: 100, order_index: 1, chain_code: null },
  { code: "unit_10", title: "Nhà thám hiểm", description: "Hoàn thành 10 Units", icon: "🌍", target: 10, xp_reward: 250, order_index: 2, chain_code: "unit_5" },
  { code: "unit_20", title: "Bậc thầy vũ trụ", description: "Hoàn thành 20 Units", icon: "👑", target: 20, xp_reward: 500, order_index: 3, chain_code: "unit_10" },
  { code: "words_50", title: "Người học chữ", description: "Học xong 50 từ vựng", icon: "📝", target: 50, xp_reward: 80, order_index: 4, chain_code: null },
  { code: "words_100", title: "Thạo ngôn ngữ", description: "Học xong 100 từ vựng", icon: "📖", target: 100, xp_reward: 150, order_index: 5, chain_code: "words_50" },
  { code: "words_500", title: "Bách khoa toàn thư", description: "Học xong 500 từ vựng", icon: "📚", target: 500, xp_reward: 800, order_index: 6, chain_code: "words_100" },
  { code: "streak_10", title: "Kiên trì", description: "Đạt chuỗi 10 ngày liên tiếp", icon: "🔥", target: 10, xp_reward: 200, order_index: 7, chain_code: null },
  { code: "streak_30", title: "Nghị lực sắt đá", description: "Đạt chuỗi 30 ngày liên tiếp", icon: "💪", target: 30, xp_reward: 400, order_index: 8, chain_code: "streak_10" },
  { code: "streak_50", title: "Huyền thoại", description: "Đạt chuỗi 50 ngày liên tiếp", icon: "⚡", target: 50, xp_reward: 700, order_index: 9, chain_code: "streak_30" },
  { code: "streak_100", title: "Bất tử", description: "Đạt chuỗi 100 ngày liên tiếp", icon: "💎", target: 100, xp_reward: 1500, order_index: 10, chain_code: "streak_50" },
  { code: "study_60", title: "Học giả", description: "Tổng thời gian học 60 phút", icon: "⏱️", target: 60, xp_reward: 80, order_index: 11, chain_code: null },
  { code: "study_120", title: "Chuyên gia", description: "Tổng thời gian học 120 phút", icon: "🎓", target: 120, xp_reward: 150, order_index: 12, chain_code: "study_60" },
  { code: "study_360", title: "Tiến sĩ", description: "Tổng thời gian học 360 phút (6 giờ)", icon: "🧠", target: 360, xp_reward: 400, order_index: 13, chain_code: "study_120" },
  { code: "study_600", title: "Giáo sư vĩ đại", description: "Tổng thời gian học 600 phút (10 giờ)", icon: "🏆", target: 600, xp_reward: 1000, order_index: 14, chain_code: "study_360" },
];

const seedMissions = async () => {
  try {
    console.log("📦 Seeding missions...");

    await Mission.destroy({ where: {}, force: true });

    const dailyData = dailyMissions.map((m) => ({
      ...m,
      type: "daily",
      is_active: true,
    }));

    const achievementData = achievementMissions.map((m) => ({
      ...m,
      type: "achievement",
      is_active: true,
    }));

    const missions = await Mission.bulkCreate([...dailyData, ...achievementData]);

    console.log(`✅ Successfully seeded ${missions.length} missions!`);
    console.log(`   - ${dailyData.length} daily missions`);
    console.log(`   - ${achievementData.length} achievement missions`);
    return missions;
  } catch (error) {
    console.error("❌ Error seeding missions:", error);
    throw error;
  }
};

module.exports = seedMissions;
