const { Feedback, User } = require("../models");

const seedFeedback = async () => {
  try {
    console.log("📦 Seeding feedback...");

    await Feedback.destroy({ where: {}, force: true });

    const users = await User.findAll({ limit: 3 });

    const feedbackData = [
      {
        user_id: users[0]?.id || null,
        type: "Review",
        rating: 5,
        message: "Tuyệt vời! Ứng dụng học tiếng Anh rất hay và dễ sử dụng.",
        status: "resolved",
        resolved_at: new Date(),
      },
      {
        user_id: users[1]?.id || null,
        type: "Suggestion",
        rating: null,
        message: "Nên thêm nhiều bài học về ngữ pháp hơn.",
        status: "read",
      },
      {
        user_id: users[2]?.id || null,
        type: "Bug Report",
        rating: 2,
        message: "App bị lag khi chơi game trên điện thoại.",
        status: "unread",
      },
      {
        user_id: null,
        type: "Suggestion",
        rating: 4,
        message: "Mong muốn có thêm các trò chơi học từ vựng mới.",
        status: "unread",
      },
      {
        user_id: users[0]?.id || null,
        type: "Review",
        rating: 5,
        message: "Con tôi rất thích học ở đây. Cảm ơn các bạn!",
        status: "resolved",
        resolved_at: new Date(),
      },
    ];

    const feedback = await Feedback.bulkCreate(feedbackData);
    console.log(`✅ Successfully seeded ${feedback.length} feedback entries!`);
    return feedback;
  } catch (error) {
    console.error("❌ Error seeding feedback:", error);
    throw error;
  }
};

module.exports = seedFeedback;
