const { Mission, UserMission, User, UserProgress, LessonProgress, GameSession } = require("../models");
const { Op } = require("sequelize");

class MissionService {
  async getMissions(userId, type = null) {
    const where = { is_active: true };
    if (type) {
      where.type = type;
    }

    const missions = await Mission.findAll({
      where,
      order: [
        ["type", "ASC"],
        ["order_index", "ASC"],
      ],
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const userMissions = await UserMission.findAll({
      where: {
        user_id: userId,
        reset_date: {
          [Op.or]: [{ [Op.eq]: today }, { [Op.eq]: null }],
        },
      },
    });

    const userMissionMap = new Map();
    userMissions.forEach((um) => {
      userMissionMap.set(um.mission_id, um);
    });

    const user = await User.findByPk(userId, {
      include: [{ model: UserProgress, as: "progress" }],
    });

    const result = await Promise.all(
      missions.map(async (mission) => {
        const userMission = userMissionMap.get(mission.id);

        let progress = userMission ? userMission.progress : 0;
        let status = userMission ? userMission.status : "in_progress";

        if (mission.type === "daily" && mission.reset_daily) {
          if (!userMission || !userMission.reset_date || new Date(userMission.reset_date) < today) {
            progress = 0;
            status = "in_progress";
          }
        }

        if (mission.code === "streak_days") {
          progress = user?.progress?.streak_days || 0;
        }

        return {
          id: mission.id,
          code: mission.code,
          type: mission.type,
          title: mission.title,
          description: mission.description,
          icon: mission.icon,
          progress,
          target: mission.target,
          reward: mission.xp_reward,
          status,
          chainCode: mission.chain_code,
        };
      })
    );

    return result;
  }

  async updateProgress(userId, missionCode, increment = 1) {
    const mission = await Mission.findOne({
      where: { code: missionCode, is_active: true },
    });

    if (!mission) {
      return null;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const whereClause = {
      user_id: userId,
      mission_id: mission.id,
    };

    if (mission.reset_daily) {
      whereClause.reset_date = {
        [Op.or]: [{ [Op.gte]: today }, { [Op.eq]: null }],
      };
    }

    let userMission = await UserMission.findOne({ where: whereClause });

    if (!userMission) {
      userMission = await UserMission.create({
        user_id: userId,
        mission_id: mission.id,
        progress: 0,
        status: "in_progress",
        reset_date: mission.reset_daily ? today : null,
      });
    }

    if (userMission.status !== "completed" && userMission.status !== "claimed") {
      const newProgress = Math.min(userMission.progress + increment, mission.target);
      userMission.progress = newProgress;
      userMission.last_updated = new Date();

      if (newProgress >= mission.target) {
        userMission.status = "completed";
      }

      await userMission.save();
    }

    return userMission;
  }

  async claimReward(userId, missionId) {
    const userMission = await UserMission.findOne({
      where: { user_id: userId, mission_id: missionId },
    });

    if (!userMission) {
      throw new Error("Mission not found");
    }

    if (userMission.status !== "completed") {
      throw new Error("Mission not completed yet");
    }

    if (userMission.status === "claimed") {
      throw new Error("Reward already claimed");
    }

    const mission = await Mission.findByPk(missionId);

    userMission.status = "claimed";
    userMission.claimed_at = new Date();
    await userMission.save();

    const user = await User.findByPk(userId);
    if (user) {
      user.level = Math.floor((user.level || 1) + mission.xp_reward / 1000);
      await user.save();
    }

    return {
      userMission,
      reward: mission.xp_reward,
    };
  }

  async initializeDailyMissions(userId) {
    const dailyMissions = await Mission.findAll({
      where: { type: "daily", is_active: true, reset_daily: true },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const mission of dailyMissions) {
      const existing = await UserMission.findOne({
        where: {
          user_id: userId,
          mission_id: mission.id,
          reset_date: today,
        },
      });

      if (!existing) {
        await UserMission.create({
          user_id: userId,
          mission_id: mission.id,
          progress: 0,
          status: "in_progress",
          reset_date: today,
        });
      }
    }
  }

  async seedMissions() {
    const existingCount = await Mission.count();
    if (existingCount > 0) {
      return { message: "Missions already seeded" };
    }

    const missions = [
      {
        type: "daily",
        code: "login",
        title: "Check-in",
        description: "Đăng nhập vào ứng dụng hàng ngày",
        icon: "🌟",
        target: 1,
        xp_reward: 10,
        order_index: 1,
        reset_daily: true,
      },
      {
        type: "daily",
        code: "flashcard",
        title: "Ôn tập",
        description: "Hoàn thành 1 bộ flashcard",
        icon: "🎴",
        target: 1,
        xp_reward: 20,
        order_index: 2,
        reset_daily: true,
      },
      {
        type: "daily",
        code: "complete_level",
        title: "Chinh phục",
        description: "Chinh phục 1 level mới",
        icon: "🎯",
        target: 1,
        xp_reward: 10,
        order_index: 3,
        reset_daily: true,
      },
      {
        type: "daily",
        code: "complete_lesson",
        title: "Học tập",
        description: "Hoàn thành 1 bài học mới",
        icon: "📚",
        target: 1,
        xp_reward: 25,
        order_index: 4,
        reset_daily: true,
      },
      {
        type: "daily",
        code: "daily_goal",
        title: "Mục tiêu hàng ngày",
        description: "Học 15 phút mỗi ngày",
        icon: "⏰",
        target: 15,
        xp_reward: 50,
        order_index: 5,
        reset_daily: true,
      },
      {
        type: "achievement",
        code: "unit_5",
        title: "Người mở đường",
        description: "Hoàn thành 5 Units",
        icon: "🚀",
        target: 5,
        xp_reward: 100,
        order_index: 1,
        chain_code: null,
      },
      {
        type: "achievement",
        code: "unit_10",
        title: "Nhà thám hiểm",
        description: "Hoàn thành 10 Units",
        icon: "🌍",
        target: 10,
        xp_reward: 250,
        order_index: 2,
        chain_code: "unit_5",
      },
      {
        type: "achievement",
        code: "unit_20",
        title: "Bậc thầy vũ trụ",
        description: "Hoàn thành 20 Units",
        icon: "👑",
        target: 20,
        xp_reward: 500,
        order_index: 3,
        chain_code: "unit_10",
      },
      {
        type: "achievement",
        code: "words_50",
        title: "Người học chữ",
        description: "Học xong 50 từ vựng",
        icon: "📝",
        target: 50,
        xp_reward: 80,
        order_index: 4,
        chain_code: null,
      },
      {
        type: "achievement",
        code: "words_100",
        title: "Thạo ngôn ngữ",
        description: "Học xong 100 từ vựng",
        icon: "📖",
        target: 100,
        xp_reward: 150,
        order_index: 5,
        chain_code: "words_50",
      },
      {
        type: "achievement",
        code: "words_500",
        title: "Bách khoa toàn thư",
        description: "Học xong 500 từ vựng",
        icon: "📚",
        target: 500,
        xp_reward: 800,
        order_index: 6,
        chain_code: "words_100",
      },
      {
        type: "achievement",
        code: "streak_10",
        title: "Kiên trì",
        description: "Đạt chuỗi 10 ngày liên tiếp",
        icon: "🔥",
        target: 10,
        xp_reward: 200,
        order_index: 7,
        chain_code: null,
      },
      {
        type: "achievement",
        code: "streak_30",
        title: "Nghị lực sắt đá",
        description: "Đạt chuỗi 30 ngày liên tiếp",
        icon: "💪",
        target: 30,
        xp_reward: 400,
        order_index: 8,
        chain_code: "streak_10",
      },
      {
        type: "achievement",
        code: "streak_50",
        title: "Huyền thoại",
        description: "Đạt chuỗi 50 ngày liên tiếp",
        icon: "⚡",
        target: 50,
        xp_reward: 700,
        order_index: 9,
        chain_code: "streak_30",
      },
      {
        type: "achievement",
        code: "streak_100",
        title: "Bất tử",
        description: "Đạt chuỗi 100 ngày liên tiếp",
        icon: "💎",
        target: 100,
        xp_reward: 1500,
        order_index: 10,
        chain_code: "streak_50",
      },
      {
        type: "achievement",
        code: "study_60",
        title: "Học giả",
        description: "Tổng thời gian học 60 phút",
        icon: "⏱️",
        target: 60,
        xp_reward: 80,
        order_index: 11,
        chain_code: null,
      },
      {
        type: "achievement",
        code: "study_120",
        title: "Chuyên gia",
        description: "Tổng thời gian học 120 phút",
        icon: "🎓",
        target: 120,
        xp_reward: 150,
        order_index: 12,
        chain_code: "study_60",
      },
      {
        type: "achievement",
        code: "study_360",
        title: "Tiến sĩ",
        description: "Tổng thời gian học 360 phút (6 giờ)",
        icon: "🧠",
        target: 360,
        xp_reward: 400,
        order_index: 13,
        chain_code: "study_120",
      },
      {
        type: "achievement",
        code: "study_600",
        title: "Giáo sư vĩ đại",
        description: "Tổng thời gian học 600 phút (10 giờ)",
        icon: "🏆",
        target: 600,
        xp_reward: 1000,
        order_index: 14,
        chain_code: "study_360",
      },
    ];

    await Mission.bulkCreate(missions);

    return { message: `Seeded ${missions.length} missions` };
  }
}

module.exports = new MissionService();
