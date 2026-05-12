const { User, UserProgress, GameSession, sequelize } = require("../models");
const { Op, fn, col, literal } = require("sequelize");

const LEAGUES = {
  Bronze: { minXP: 0, maxXP: 499 },
  Silver: { minXP: 500, maxXP: 1499 },
  Gold: { minXP: 1500, maxXP: 2999 },
  Diamond: { minXP: 3000, maxXP: Infinity },
};

class LeaderboardService {
  calculateLeague(totalXP) {
    if (totalXP >= 3000) return "Diamond";
    if (totalXP >= 1500) return "Gold";
    if (totalXP >= 500) return "Silver";
    return "Bronze";
  }

  async getWeeklyLeaderboard(limit = 20) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weeklyStats = await GameSession.findAll({
      attributes: [
        "user_id",
        [fn("SUM", col("xp_earned")), "weeklyXP"],
        [fn("COUNT", col("id")), "gamesPlayed"],
      ],
      where: {
        created_at: {
          [Op.gte]: weekStart,
        },
      },
      group: ["user_id"],
      order: [[literal("weeklyXP DESC")]],
      limit,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "display_name", "avatar", "level"],
        },
      ],
    });

    return weeklyStats.map((stat, index) => {
      const user = stat.User;
      const weeklyXP = parseInt(stat.get("weeklyXP")) || 0;
      return {
        id: user ? user.id : stat.user_id,
        name: user ? (user.display_name || user.username) : "Unknown",
        avatar: user ? user.avatar : null,
        weeklyXP,
        rank: index + 1,
        league: this.calculateLeague(weeklyXP),
        gamesPlayed: parseInt(stat.get("gamesPlayed")) || 0,
      };
    });
  }

  async getUserRank(userId) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const userWeeklyXP = await GameSession.findOne({
      attributes: [[fn("SUM", col("xp_earned")), "weeklyXP"]],
      where: {
        user_id: userId,
        created_at: {
          [Op.gte]: weekStart,
        },
      },
      group: ["user_id"],
    });

    const weeklyXP = parseInt(userWeeklyXP?.get("weeklyXP")) || 0;

    const higherRankedUsers = await GameSession.findAll({
      attributes: [[fn("SUM", col("xp_earned")), "weeklyXP"]],
      where: {
        created_at: {
          [Op.gte]: weekStart,
        },
      },
      group: ["user_id"],
      having: literal("SUM(xp_earned) > :weeklyXP"),
      replacements: { weeklyXP },
    });

    const rank = higherRankedUsers.length + 1;

    const totalUsers = await GameSession.count({
      where: {
        created_at: {
          [Op.gte]: weekStart,
        },
      },
      distinct: true,
      col: "user_id",
    });

    return {
      rank,
      totalUsers,
      weeklyXP,
      league: this.calculateLeague(weeklyXP),
    };
  }

  async getAllTimeLeaderboard(limit = 20) {
    const users = await User.findAll({
      attributes: [
        "id",
        "username",
        "display_name",
        "avatar",
        "level",
      ],
      include: [
        {
          model: UserProgress,
          as: "progress",
          attributes: ["total_xp", "total_study_minutes", "words_learned"],
        },
      ],
      order: [[col("progress.total_xp"), "DESC"]],
      limit,
    });

    return users.map((user, index) => {
      const totalXP = user.progress?.total_xp || 0;
      return {
        id: user.id,
        name: user.display_name || user.username,
        avatar: user.avatar,
        level: user.level || 1,
        totalXP,
        rank: index + 1,
        league: this.calculateLeague(totalXP),
        wordsLearned: user.progress?.words_learned || 0,
      };
    });
  }

  async getLeagueLeaderboard(league, limit = 50) {
    const { minXP, maxXP } = LEAGUES[league] || LEAGUES["Bronze"];

    const users = await User.findAll({
      attributes: ["id", "username", "display_name", "avatar", "level"],
      include: [
        {
          model: UserProgress,
          as: "progress",
          attributes: ["total_xp"],
        },
      ],
      where: {
        "$progress.total_xp$": {
          [Op.gte]: minXP,
          ...(maxXP !== Infinity && { [Op.lt]: maxXP }),
        },
      },
      order: [[col("progress.total_xp"), "DESC"]],
      limit,
    });

    return users.map((user, index) => ({
      id: user.id,
      name: user.display_name || user.username,
      avatar: user.avatar,
      level: user.level || 1,
      totalXP: user.progress?.total_xp || 0,
      rank: index + 1,
      league,
    }));
  }

  async addXPToUser(userId, xpAmount) {
    const userProgress = await UserProgress.findOne({
      where: { user_id: userId },
    });

    if (userProgress) {
      userProgress.total_xp = (userProgress.total_xp || 0) + xpAmount;
      userProgress.xp_this_week = (userProgress.xp_this_week || 0) + xpAmount;
      await userProgress.save();
    } else {
      await UserProgress.create({
        user_id: userId,
        total_xp: xpAmount,
        xp_this_week: xpAmount,
        words_learned: 0,
        total_study_minutes: 0,
        units_completed: 0,
        lessons_completed: 0,
        streak_days: 1,
        last_active_date: new Date(),
      });
    }

    return this.getUserRank(userId);
  }

  async getTopThreeLastWeek() {
    const lastWeekEnd = new Date();
    lastWeekEnd.setDate(lastWeekEnd.getDate() - lastWeekEnd.getDay() - 1);
    lastWeekEnd.setHours(23, 59, 59, 999);

    const lastWeekStart = new Date(lastWeekEnd);
    lastWeekStart.setDate(lastWeekStart.getDate() - 6);
    lastWeekStart.setHours(0, 0, 0, 0);

    const weeklyStats = await GameSession.findAll({
      attributes: [
        "user_id",
        [fn("SUM", col("xp_earned")), "weeklyXP"],
      ],
      where: {
        created_at: {
          [Op.gte]: lastWeekStart,
          [Op.lte]: lastWeekEnd,
        },
      },
      group: ["user_id"],
      order: [[literal("weeklyXP DESC")]],
      limit: 3,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "username", "display_name", "avatar"],
        },
      ],
    });

    return weeklyStats.map((stat, index) => {
      const user = stat.User;
      const weeklyXP = parseInt(stat.get("weeklyXP")) || 0;
      return {
        id: user ? user.id : stat.user_id,
        name: user ? (user.display_name || user.username) : "Unknown",
        avatar: user ? user.avatar : null,
        weeklyXP,
        rank: index + 1,
      };
    });
  }
}

module.exports = new LeaderboardService();
