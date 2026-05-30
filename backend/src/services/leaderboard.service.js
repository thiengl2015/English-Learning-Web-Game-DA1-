const { User, UserProgress, GameSession, Friendship } = require("../models");
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

  async getWeeklyLeaderboard(limit = 20, currentUserId = null) {
    const currentLeague = await this.getCurrentLeague(currentUserId);
    const users = await this.getUsersInLeague(currentLeague, limit);
    const friendStatusByUserId = await this.getFriendStatusMap(
      currentUserId,
      users.map((user) => user.id)
    );

    return users.map((user, index) =>
      this.formatLeaderboardUser(user, index + 1, friendStatusByUserId[user.id])
    );
  }

  async getUserRank(userId) {
    const progressRow = await UserProgress.findOne({
      attributes: ["xp_this_week", "weekly_xp", "total_xp", "league"],
      where: { user_id: userId },
      raw: true,
    });

    const weeklyXP = progressRow
      ? progressRow.xp_this_week || progressRow.weekly_xp || 0
      : 0;
    const totalXP = progressRow ? progressRow.total_xp || 0 : 0;
    const league = progressRow?.league || this.calculateLeague(weeklyXP);

    const [higherRankedUsers, totalUsers] = await Promise.all([
      UserProgress.count({
        where: {
          league,
          [Op.or]: [
            { xp_this_week: { [Op.gt]: weeklyXP } },
            {
              xp_this_week: weeklyXP,
              total_xp: { [Op.gt]: totalXP },
            },
          ],
        },
      }),
      UserProgress.count({ where: { league } }),
    ]);

    return {
      rank: higherRankedUsers + 1,
      totalUsers,
      weeklyXP,
      totalXP,
      league,
    };
  }

  async getAllTimeLeaderboard(limit = 20, currentUserId = null) {
    const users = await User.findAll({
      attributes: ["id", "username", "display_name", "avatar", "level"],
      include: [
        {
          model: UserProgress,
          as: "progress",
          attributes: [
            "total_xp",
            "weekly_xp",
            "xp_this_week",
            "total_study_minutes",
            "words_learned",
            "league",
          ],
        },
      ],
      order: [[col("progress.total_xp"), "DESC"]],
      limit,
    });

    const friendStatusByUserId = await this.getFriendStatusMap(
      currentUserId,
      users.map((user) => user.id)
    );

    return users.map((user, index) => {
      const totalXP = user.progress?.total_xp || 0;
      const league = user.progress?.league || this.calculateLeague(totalXP);
      return {
        id: user.id,
        name: user.display_name || user.username,
        avatar: user.avatar || null,
        level: user.level || 1,
        totalXP,
        weeklyXP: user.progress?.xp_this_week || user.progress?.weekly_xp || 0,
        rank: index + 1,
        league,
        highestRank: league,
        highestPosition: index + 1,
        friendStatus: friendStatusByUserId[user.id] || "none",
        wordsLearned: user.progress?.words_learned || 0,
      };
    });
  }

  async getLeagueLeaderboard(league, limit = 50, currentUserId = null) {
    const users = await this.getUsersInLeague(league, limit);
    const friendStatusByUserId = await this.getFriendStatusMap(
      currentUserId,
      users.map((user) => user.id)
    );

    return users.map((user, index) =>
      this.formatLeaderboardUser(user, index + 1, friendStatusByUserId[user.id])
    );
  }

  async addXPToUser(userId, xpAmount) {
    const userProgress = await this.getOrCreateProgress(userId);

    userProgress.total_xp = (userProgress.total_xp || 0) + xpAmount;
    userProgress.weekly_xp = (userProgress.weekly_xp || 0) + xpAmount;
    userProgress.xp_this_week = (userProgress.xp_this_week || 0) + xpAmount;
    await userProgress.save();

    return this.getUserRank(userId);
  }

  async getTopThreeLastWeek(currentUserId = null) {
    const lastWeekEnd = new Date();
    lastWeekEnd.setDate(lastWeekEnd.getDate() - lastWeekEnd.getDay() - 1);
    lastWeekEnd.setHours(23, 59, 59, 999);

    const lastWeekStart = new Date(lastWeekEnd);
    lastWeekStart.setDate(lastWeekStart.getDate() - 6);
    lastWeekStart.setHours(0, 0, 0, 0);

    const weeklyStats = await GameSession.findAll({
      attributes: ["user_id", [fn("SUM", col("xp_earned")), "weeklyXP"]],
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
          attributes: ["id", "username", "display_name", "avatar", "level"],
          include: [
            {
              model: UserProgress,
              as: "progress",
              attributes: ["total_xp", "weekly_xp", "xp_this_week", "league"],
            },
          ],
        },
      ],
    });

    const users = weeklyStats.map((stat) => stat.user).filter(Boolean);
    const friendStatusByUserId = await this.getFriendStatusMap(
      currentUserId,
      users.map((user) => user.id)
    );

    return weeklyStats.map((stat, index) => {
      const user = stat.user;
      const weeklyXP = parseInt(stat.get("weeklyXP"), 10) || 0;
      const totalXP = user?.progress?.total_xp || 0;
      const league = user?.progress?.league || this.calculateLeague(totalXP);

      return {
        id: user ? user.id : stat.user_id,
        name: user ? user.display_name || user.username : "Unknown",
        avatar: user?.avatar || null,
        weeklyXP,
        totalXP,
        rank: index + 1,
        league,
        highestRank: league,
        highestPosition: index + 1,
        friendStatus: user ? friendStatusByUserId[user.id] || "none" : "none",
      };
    });
  }

  async getFullLeaderboardData(userId, limit = 50) {
    const [weeklyLeaderboard, userRank, topThree] = await Promise.all([
      this.getWeeklyLeaderboard(limit, userId),
      this.getUserRank(userId),
      this.getTopThreeLastWeek(userId),
    ]);

    const currentUser = weeklyLeaderboard.find((user) => user.id === userId);

    return {
      weeklyLeaderboard,
      userRank,
      topThreeLastWeek: topThree,
      currentUser,
      currentLeague: userRank.league,
      promotionCount: 5,
      demotionCount: 3,
      rankingRule:
        "Users are ranked against learners in the same league by XP earned this week. Top 5 move up and bottom 3 move down during the weekly reset.",
    };
  }

  async getUsersInLeague(league, limit) {
    return User.findAll({
      attributes: ["id", "username", "display_name", "avatar", "level"],
      include: [
        {
          model: UserProgress,
          as: "progress",
          required: true,
          attributes: [
            "total_xp",
            "weekly_xp",
            "xp_this_week",
            "level",
            "league",
            "words_learned",
          ],
          where: { league },
        },
      ],
      order: [
        [col("progress.xp_this_week"), "DESC"],
        [col("progress.weekly_xp"), "DESC"],
        [col("progress.total_xp"), "DESC"],
      ],
      limit,
    });
  }

  async getCurrentLeague(userId) {
    if (!userId) return "Bronze";

    const progress = await this.getOrCreateProgress(userId);
    return progress.league || this.calculateLeague(progress.weekly_xp || 0);
  }

  async getOrCreateProgress(userId) {
    let progress = await UserProgress.findOne({ where: { user_id: userId } });

    if (!progress) {
      progress = await UserProgress.create({
        user_id: userId,
        total_xp: 0,
        weekly_xp: 0,
        xp_this_week: 0,
        level: 1,
        streak_days: 0,
        words_learned: 0,
        total_study_minutes: 0,
        units_completed: 0,
        lessons_completed: 0,
        league: "Bronze",
      });
    }

    return progress;
  }

  async getFriendStatusMap(currentUserId, userIds) {
    if (!currentUserId || userIds.length === 0) return {};

    const otherUserIds = userIds.filter((userId) => userId !== currentUserId);
    const statusByUserId = { [currentUserId]: "self" };

    if (otherUserIds.length === 0 || !Friendship) {
      return statusByUserId;
    }

    const friendships = await Friendship.findAll({
      where: {
        [Op.or]: [
          {
            requester_id: currentUserId,
            addressee_id: { [Op.in]: otherUserIds },
          },
          {
            requester_id: { [Op.in]: otherUserIds },
            addressee_id: currentUserId,
          },
        ],
      },
    });

    friendships.forEach((friendship) => {
      const otherUserId =
        friendship.requester_id === currentUserId
          ? friendship.addressee_id
          : friendship.requester_id;

      if (friendship.status === "accepted") {
        statusByUserId[otherUserId] = "friends";
      } else if (friendship.requester_id === currentUserId) {
        statusByUserId[otherUserId] = "pending_sent";
      } else {
        statusByUserId[otherUserId] = "pending_received";
      }
    });

    return statusByUserId;
  }

  formatLeaderboardUser(user, rank, friendStatus = "none") {
    const progress = user.progress || {};
    const weeklyXP = progress.xp_this_week || progress.weekly_xp || 0;
    const totalXP = progress.total_xp || 0;
    const league = progress.league || this.calculateLeague(weeklyXP);

    return {
      id: user.id,
      name: user.display_name || user.username,
      avatar: user.avatar || null,
      weeklyXP,
      totalXP,
      rank,
      league,
      level: progress.level || user.level || 1,
      highestRank: league,
      highestPosition: rank,
      friendStatus,
      wordsLearned: progress.words_learned || 0,
    };
  }
}

module.exports = new LeaderboardService();
