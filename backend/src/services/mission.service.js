const {
  Mission,
  UserMission,
  User,
  UserProgress,
} = require("../models");
const { Op } = require("sequelize");

const DAILY_MISSION_CODES = ["login", "flashcard", "new-level", "new-lesson", "daily-goal"];

const CODE_ALIASES = {
  complete_level: "new-level",
  complete_lesson: "new-lesson",
  new_level: "new-level",
  new_lesson: "new-lesson",
  daily_goal: "daily-goal",
  unit_5: "unit-5",
  unit_10: "unit-10",
  unit_20: "unit-20",
  words_50: "words-50",
  words_100: "words-100",
  words_500: "words-500",
  streak_10: "streak-10",
  streak_30: "streak-30",
  streak_50: "streak-50",
  streak_100: "streak-100",
  study_60: "study-60",
  study_120: "study-120",
  study_360: "study-360",
  study_600: "study-600",
  rank_1: "rank-1",
};

const MISSION_DEFINITIONS = [
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
    code: "new-level",
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
    code: "new-lesson",
    title: "Chinh phục",
    description: "Hoàn thành 1 bài học mới",
    icon: "📚",
    target: 1,
    xp_reward: 25,
    order_index: 4,
    reset_daily: true,
  },
  {
    type: "daily",
    code: "daily-goal",
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
    code: "unit-5",
    title: "Người mở đường",
    description: "Hoàn thành 5 Units",
    icon: "🚀",
    badge: "/badges/pioneer.png",
    medal: "🥉",
    target: 5,
    xp_reward: 100,
    order_index: 101,
  },
  {
    type: "achievement",
    code: "unit-10",
    title: "Nhà thám hiểm",
    description: "Hoàn thành 10 Units",
    icon: "🌍",
    badge: "/badges/explorer.png",
    medal: "🥈",
    target: 10,
    xp_reward: 250,
    order_index: 102,
    chain_code: "unit-5",
  },
  {
    type: "achievement",
    code: "unit-20",
    title: "Bậc thầy vũ trụ",
    description: "Hoàn thành 20 Units",
    icon: "👑",
    badge: "/badges/master.png",
    medal: "🥇",
    target: 20,
    xp_reward: 500,
    order_index: 103,
    chain_code: "unit-10",
  },
  {
    type: "achievement",
    code: "words-50",
    title: "Người học chữ",
    description: "Học xong 50 từ vựng",
    icon: "📝",
    badge: "/badges/beginner.png",
    medal: "🥉",
    target: 50,
    xp_reward: 80,
    order_index: 201,
  },
  {
    type: "achievement",
    code: "words-100",
    title: "Thạo ngôn ngữ",
    description: "Học xong 100 từ vựng",
    icon: "📖",
    badge: "/badges/linguist.png",
    medal: "🥈",
    target: 100,
    xp_reward: 150,
    order_index: 202,
    chain_code: "words-50",
  },
  {
    type: "achievement",
    code: "words-500",
    title: "Bách khoa toàn thư",
    description: "Học xong 500 từ vựng",
    icon: "📚",
    badge: "/badges/encyclopedia.png",
    medal: "🥇",
    target: 500,
    xp_reward: 800,
    order_index: 203,
    chain_code: "words-100",
  },
  {
    type: "achievement",
    code: "streak-10",
    title: "Kiên trì",
    description: "Đạt chuỗi 10 ngày liên tiếp",
    icon: "🔥",
    badge: "/badges/persistent.png",
    medal: "🥉",
    target: 10,
    xp_reward: 200,
    order_index: 301,
  },
  {
    type: "achievement",
    code: "streak-30",
    title: "Nghị lực sắt đá",
    description: "Đạt chuỗi 30 ngày liên tiếp",
    icon: "💪",
    badge: "/badges/iron-will.png",
    medal: "🥈",
    target: 30,
    xp_reward: 400,
    order_index: 302,
    chain_code: "streak-10",
  },
  {
    type: "achievement",
    code: "streak-50",
    title: "Huyền thoại",
    description: "Đạt chuỗi 50 ngày liên tiếp",
    icon: "⚡",
    badge: "/badges/legend.png",
    medal: "🥇",
    target: 50,
    xp_reward: 700,
    order_index: 303,
    chain_code: "streak-30",
  },
  {
    type: "achievement",
    code: "streak-100",
    title: "Bất tử",
    description: "Đạt chuỗi 100 ngày liên tiếp",
    icon: "💎",
    badge: "/badges/immortal.png",
    medal: "👑",
    target: 100,
    xp_reward: 1500,
    order_index: 304,
    chain_code: "streak-50",
  },
  {
    type: "achievement",
    code: "study-60",
    title: "Học giả",
    description: "Tổng thời gian học 60 phút",
    icon: "⏱️",
    badge: "/badges/scholar.png",
    medal: "🥉",
    target: 60,
    xp_reward: 80,
    order_index: 401,
  },
  {
    type: "achievement",
    code: "study-120",
    title: "Chuyên gia",
    description: "Tổng thời gian học 120 phút",
    icon: "🎓",
    badge: "/badges/expert.png",
    medal: "🥈",
    target: 120,
    xp_reward: 150,
    order_index: 402,
    chain_code: "study-60",
  },
  {
    type: "achievement",
    code: "study-360",
    title: "Tiến sĩ",
    description: "Tổng thời gian học 360 phút (6 giờ)",
    icon: "🧠",
    badge: "/badges/doctor.png",
    medal: "🥇",
    target: 360,
    xp_reward: 400,
    order_index: 403,
    chain_code: "study-120",
  },
  {
    type: "achievement",
    code: "study-600",
    title: "Giáo sư vĩ đại",
    description: "Tổng thời gian học 600 phút (10 giờ)",
    icon: "🏆",
    badge: "/badges/professor.png",
    medal: "👑",
    target: 600,
    xp_reward: 1000,
    order_index: 404,
    chain_code: "study-360",
  },
  {
    type: "achievement",
    code: "rank-1",
    title: "Vua của thiên hà",
    description: "Xếp hạng #1 trong cộng đồng",
    icon: "🌟",
    badge: "/badges/king.png",
    medal: "👑",
    target: 1,
    xp_reward: 2000,
    order_index: 501,
  },
];

function todayStart() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function asDateKey(date) {
  return new Date(date).toISOString().split("T")[0];
}

class MissionService {
  normalizeCode(code) {
    return CODE_ALIASES[code] || code;
  }

  async getOrCreateProgress(userId) {
    const [progress] = await UserProgress.findOrCreate({
      where: { user_id: userId },
      defaults: { user_id: userId },
    });
    return progress;
  }

  async getCommunityRank(userId) {
    const userProgress = await UserProgress.findOne({ where: { user_id: userId } });
    if (!userProgress) return null;

    const strongerUsers = await UserProgress.count({
      where: {
        total_xp: {
          [Op.gt]: userProgress.total_xp || 0,
        },
      },
    });

    return strongerUsers + 1;
  }

  async seedMissions({ initializeUsers = true } = {}) {
    const activeCodes = MISSION_DEFINITIONS.map((mission) => mission.code);
    let created = 0;
    let updated = 0;

    for (const definition of MISSION_DEFINITIONS) {
      const [mission, wasCreated] = await Mission.findOrCreate({
        where: { code: definition.code },
        defaults: {
          ...definition,
          is_active: true,
          reset_daily: Boolean(definition.reset_daily),
        },
      });

      if (wasCreated) {
        created += 1;
      } else {
        await mission.update({
          ...definition,
          is_active: true,
          reset_daily: Boolean(definition.reset_daily),
          updated_at: new Date(),
        });
        updated += 1;
      }
    }

    await Mission.update(
      { is_active: false, updated_at: new Date() },
      {
        where: {
          code: { [Op.notIn]: activeCodes },
        },
      }
    );

    if (initializeUsers) {
      await this.initializeMissionsForAllUsers();
    }

    return {
      message: "Missions seeded",
      created,
      updated,
      active: activeCodes.length,
    };
  }

  async initializeMissionsForAllUsers() {
    const users = await User.findAll({ attributes: ["id"] });
    for (const user of users) {
      await this.initializeUserMissions(user.id);
    }
  }

  async initializeUserMissions(userId) {
    const missions = await Mission.findAll({ where: { is_active: true } });
    const today = todayStart();

    for (const mission of missions) {
      const resetDate = mission.reset_daily ? today : null;
      const where = {
        user_id: userId,
        mission_id: mission.id,
      };

      if (mission.reset_daily) {
        where.reset_date = resetDate;
      } else {
        where.reset_date = null;
      }

      const existing = await UserMission.findOne({ where });
      if (!existing) {
        await UserMission.create({
          user_id: userId,
          mission_id: mission.id,
          progress: 0,
          status: "in_progress",
          reset_date: resetDate,
        });
      }
    }
  }

  async getMissions(userId, type = null) {
    await this.seedMissions({ initializeUsers: false });
    await this.initializeUserMissions(userId);

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

    const today = todayStart();
    const userMissions = await UserMission.findAll({
      where: {
        user_id: userId,
        [Op.or]: [{ reset_date: today }, { reset_date: null }],
      },
    });

    const userMissionMap = new Map();
    userMissions.forEach((userMission) => {
      userMissionMap.set(userMission.mission_id, userMission);
    });

    const user = await User.findByPk(userId, {
      include: [{ model: UserProgress, as: "progress" }],
    });
    const progress = user?.progress || (await this.getOrCreateProgress(userId));
    const communityRank = await this.getCommunityRank(userId);

    const computed = new Map();
    for (const mission of missions) {
      const userMission = userMissionMap.get(mission.id);
      const item = this.buildMissionResponse({
        mission,
        userMission,
        user,
        progress,
        communityRank,
        computed,
      });
      computed.set(mission.code, item);
    }

    return Array.from(computed.values());
  }

  buildMissionResponse({ mission, userMission, user, progress, communityRank, computed }) {
    const target = mission.code === "daily-goal" ? user?.daily_goal || mission.target : mission.target;
    let currentProgress = userMission ? userMission.progress : 0;

    if (mission.type === "achievement") {
      currentProgress = this.getAchievementProgress(mission.code, progress, communityRank);
    }

    const chainMission = mission.chain_code ? computed.get(mission.chain_code) : null;
    const isLocked = Boolean(
      mission.chain_code && (!chainMission || chainMission.progress < chainMission.target)
    );

    let status = userMission?.status || "in_progress";
    if (isLocked) {
      status = "locked";
    } else if (userMission?.status === "claimed") {
      status = "claimed";
    } else if (currentProgress >= target) {
      status = "completed";
    } else {
      status = "in_progress";
    }

    return {
      id: mission.id,
      code: mission.code,
      type: mission.type,
      title: mission.title,
      description:
        mission.code === "daily-goal"
          ? `Học ${target} phút mỗi ngày`
          : mission.description,
      icon: mission.icon,
      badge: mission.badge,
      medal: mission.medal,
      progress: Math.min(currentProgress, target),
      target,
      reward: mission.xp_reward,
      status,
      chainCode: mission.chain_code,
    };
  }

  getAchievementProgress(code, progress, communityRank) {
    switch (code) {
      case "unit-5":
      case "unit-10":
      case "unit-20":
        return progress?.units_completed || 0;
      case "words-50":
      case "words-100":
      case "words-500":
        return progress?.words_learned || 0;
      case "streak-10":
      case "streak-30":
      case "streak-50":
      case "streak-100":
        return progress?.streak_days || 0;
      case "study-60":
      case "study-120":
      case "study-360":
      case "study-600":
        return progress?.total_study_minutes || 0;
      case "rank-1":
        return communityRank === 1 ? 1 : 0;
      default:
        return 0;
    }
  }

  async getUserMission(userId, mission) {
    const where = {
      user_id: userId,
      mission_id: mission.id,
      reset_date: mission.reset_daily ? todayStart() : null,
    };

    let userMission = await UserMission.findOne({ where });
    if (!userMission) {
      userMission = await UserMission.create({
        user_id: userId,
        mission_id: mission.id,
        progress: 0,
        status: "in_progress",
        reset_date: mission.reset_daily ? todayStart() : null,
      });
    }

    return userMission;
  }

  async updateProgress(userId, missionCode, increment = 1) {
    await this.seedMissions({ initializeUsers: false });

    const normalizedCode = this.normalizeCode(missionCode);
    const mission = await Mission.findOne({
      where: { code: normalizedCode, is_active: true },
    });

    if (!mission) {
      return null;
    }

    const userMission = await this.getUserMission(userId, mission);

    if (userMission.status !== "completed" && userMission.status !== "claimed") {
      const target = await this.getEffectiveTarget(userId, mission);
      const newProgress = Math.min((userMission.progress || 0) + increment, target);
      userMission.progress = newProgress;
      userMission.last_updated = new Date();

      if (newProgress >= target) {
        userMission.status = "completed";
      }

      await userMission.save();
    }

    if (mission.type === "daily") {
      await this.awardDailyStreakIfComplete(userId);
    }

    return userMission;
  }

  async getEffectiveTarget(userId, mission) {
    if (mission.code !== "daily-goal") {
      return mission.target;
    }

    const user = await User.findByPk(userId, { attributes: ["daily_goal"] });
    return user?.daily_goal || mission.target;
  }

  async awardDailyStreakIfComplete(userId) {
    const dailyMissions = await Mission.findAll({
      where: {
        code: { [Op.in]: DAILY_MISSION_CODES },
        is_active: true,
        reset_daily: true,
      },
    });
    const dailyMissionMap = new Map(dailyMissions.map((mission) => [mission.id, mission]));
    const today = todayStart();

    const userMissions = await UserMission.findAll({
      where: {
        user_id: userId,
        mission_id: { [Op.in]: Array.from(dailyMissionMap.keys()) },
        reset_date: today,
      },
    });

    if (userMissions.length < dailyMissions.length) return;

    const user = await User.findByPk(userId, { attributes: ["id", "daily_goal"] });
    const allCompleted = userMissions.every((userMission) => {
      const mission = dailyMissionMap.get(userMission.mission_id);
      const target = mission?.code === "daily-goal" ? user?.daily_goal || mission.target : mission?.target || 1;
      return userMission.progress >= target || ["completed", "claimed"].includes(userMission.status);
    });

    if (!allCompleted) return;

    const progress = await this.getOrCreateProgress(userId);
    const todayKey = asDateKey(today);
    const lastActiveKey = progress.last_active_date ? asDateKey(progress.last_active_date) : null;

    if (lastActiveKey === todayKey) return;

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = asDateKey(yesterday);

    progress.streak_days = lastActiveKey === yesterdayKey ? (progress.streak_days || 0) + 1 : 1;
    progress.last_active_date = today;
    await progress.save();
  }

  async claimReward(userId, missionId) {
    const mission = await Mission.findByPk(missionId);
    if (!mission || !mission.is_active) {
      throw new Error("Mission not found");
    }

    const missions = await this.getMissions(userId, mission.type);
    const missionState = missions.find((item) => item.id === missionId);

    if (!missionState || missionState.status !== "completed") {
      throw new Error("Mission not completed yet");
    }

    const userMission = await this.getUserMission(userId, mission);
    if (userMission.status === "claimed") {
      throw new Error("Reward already claimed");
    }

    userMission.progress = Math.max(userMission.progress || 0, missionState.target);
    userMission.status = "claimed";
    userMission.claimed_at = new Date();
    userMission.last_updated = new Date();
    await userMission.save();

    const progress = await this.getOrCreateProgress(userId);
    progress.total_xp = (progress.total_xp || 0) + mission.xp_reward;
    progress.weekly_xp = (progress.weekly_xp || 0) + mission.xp_reward;
    progress.xp_this_week = (progress.xp_this_week || 0) + mission.xp_reward;
    await progress.save();

    return {
      userMission,
      reward: mission.xp_reward,
    };
  }

  async initializeDailyMissions(userId) {
    await this.seedMissions({ initializeUsers: false });
    await this.initializeUserMissions(userId);
  }
}

module.exports = new MissionService();
