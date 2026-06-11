const { User, UserProgress, GameSession, Friendship, SystemState } = require("../models");
const { Op, fn, col, literal } = require("sequelize");
const notificationService = require("./notification.service");

const LEAGUES = {
  Bronze: { minXP: 0, maxXP: 499 },
  Silver: { minXP: 500, maxXP: 1499 },
  Gold: { minXP: 1500, maxXP: 2999 },
  Diamond: { minXP: 3000, maxXP: Infinity },
};

// Weekly reset: the bottom N of each league (that has a lower tier) drop down.
const DEMOTION_COUNT = 3;
const LOWER_LEAGUE = { Diamond: "Gold", Gold: "Silver", Silver: "Bronze" };
const WEEKLY_RESET_KEY = "weekly_reset_last_week";

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

  // ── Weekly leaderboard reset ──

  // ISO-week key, e.g. "2026-W24". Used as the once-per-week run guard.
  currentWeekKey(date = new Date()) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = (d.getUTCDay() + 6) % 7; // Mon=0 .. Sun=6
    d.setUTCDate(d.getUTCDate() - dayNum + 3); // shift to the week's Thursday
    const firstThursday = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
    const week =
      1 +
      Math.round(
        ((d - firstThursday) / 86400000 -
          3 +
          ((firstThursday.getUTCDay() + 6) % 7)) /
          7
      );
    return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
  }

  // Run the reset at most once per ISO week (survives restarts via SystemState).
  // First ever call just records the marker so we don't reset on initial deploy.
  async maybeRunWeeklyReset() {
    const weekKey = this.currentWeekKey();
    const marker = await SystemState.findByPk(WEEKLY_RESET_KEY);

    if (!marker) {
      await SystemState.create({ key: WEEKLY_RESET_KEY, value: weekKey });
      return { initialized: true, weekKey };
    }
    if (marker.value === weekKey) {
      return { skipped: true, weekKey };
    }

    const result = await this.runWeeklyReset();
    await marker.update({ value: weekKey });
    return { ...result, weekKey };
  }

  // Demote the bottom 3 of each league (one tier down, fire rank_down), then
  // zero everyone's weekly XP for the new week. Bulk updates bypass the
  // UserProgress hook, so league changes here are authoritative.
  async runWeeklyReset() {
    const demotions = [];

    for (const [league, lower] of Object.entries(LOWER_LEAGUE)) {
      const bottom = await UserProgress.findAll({
        where: { league },
        order: [
          ["xp_this_week", "ASC"],
          ["weekly_xp", "ASC"],
          ["total_xp", "ASC"],
        ],
        limit: DEMOTION_COUNT,
        include: [
          { model: User, as: "user", attributes: ["id", "username", "display_name"] },
        ],
      });

      for (const p of bottom) {
        demotions.push({
          userId: p.user_id,
          username: p.user ? p.user.display_name || p.user.username : "there",
          toLeague: lower,
        });
      }
    }

    for (const d of demotions) {
      await UserProgress.update({ league: d.toLeague }, { where: { user_id: d.userId } });
    }

    // New week: reset weekly XP for everyone (bulk → no instance hook → league untouched).
    await UserProgress.update(
      { weekly_xp: 0, xp_this_week: 0 },
      { where: { id: { [Op.ne]: null } } }
    );

    for (const d of demotions) {
      await notificationService
        .deliverEventToUser("rank_down", d.userId, {
          username: d.username,
          new_rank: d.toLeague,
        })
        .catch((error) => {
          console.error("rank_down notification failed:", error.message);
        });
    }

    return { demoted: demotions.length };
  }
}

module.exports = new LeaderboardService();
