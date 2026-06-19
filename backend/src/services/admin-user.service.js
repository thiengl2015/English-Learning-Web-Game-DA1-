const { Op } = require("sequelize");
const {
  Feedback,
  PaymentOrder,
  User,
  UserProgress,
  UserSetting,
  sequelize,
} = require("../models");

const INACTIVE_AFTER_DAYS = 365;

const cutoffDate = () => new Date(Date.now() - INACTIVE_AFTER_DAYS * 24 * 60 * 60 * 1000);

const displayName = (user) => user.display_name || user.username;

const formatDate = (value) => (value ? new Date(value).toISOString() : null);

const normalizeSubscription = (subscription) =>
  subscription === "Premium" || subscription === "Super" ? "Premium" : "Free";

const defaultSettings = {
  push_notifications: true,
  email_reminders: true,
  sound_effects: true,
  background_music: true,
  music_volume: 70,
  audio_volume: 80,
  dark_mode: false,
};

const serializeSettings = (settings) => ({
  ...defaultSettings,
  ...(settings
    ? {
        push_notifications: settings.push_notifications,
        email_reminders: settings.email_reminders,
        sound_effects: settings.sound_effects,
        background_music: settings.background_music,
        music_volume: settings.music_volume,
        audio_volume: settings.audio_volume,
        dark_mode: settings.dark_mode,
      }
    : {}),
});

const serializeUser = (user) => {
  const plain = user.get ? user.get({ plain: true }) : user;
  const progress = plain.progress || {};

  return {
    id: plain.id,
    username: plain.username,
    email: plain.email,
    display_name: plain.display_name,
    name: displayName(plain),
    avatar: plain.avatar,
    level: progress.level || plain.level || 1,
    subscription: normalizeSubscription(plain.subscription),
    premium_expires_at: formatDate(plain.premium_expires_at),
    status: plain.status,
    joined_date: formatDate(plain.joined_date),
    last_active: formatDate(plain.last_active),
    native_language: plain.native_language,
    current_level: plain.current_level,
    learning_goal: plain.learning_goal,
    daily_goal: plain.daily_goal,
    progress: {
      total_xp: progress.total_xp || 0,
      weekly_xp: progress.weekly_xp || 0,
      xp_this_week: progress.xp_this_week || 0,
      level: progress.level || 1,
      streak_days: progress.streak_days || 0,
      last_active_date: progress.last_active_date || null,
      words_learned: progress.words_learned || 0,
      total_study_minutes: progress.total_study_minutes || 0,
      units_completed: progress.units_completed || 0,
      lessons_completed: progress.lessons_completed || 0,
      league: progress.league || "Bronze",
    },
    settings: serializeSettings(plain.settings),
  };
};

class AdminUserService {
  async deactivateStaleUsers() {
    const cutoff = cutoffDate();

    const [affectedCount] = await User.update(
      { status: "Inactive" },
      {
        where: {
          role: { [Op.ne]: "admin" },
          status: "Active",
          [Op.or]: [
            { last_active: { [Op.lt]: cutoff } },
            {
              last_active: null,
              joined_date: { [Op.lt]: cutoff },
            },
          ],
        },
      }
    );

    return affectedCount;
  }

  async getStats() {
    await this.deactivateStaleUsers();

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const [totalUsers, activeUsers, inactiveUsers, newThisMonth] = await Promise.all([
      User.count({ where: { role: { [Op.ne]: "admin" } } }),
      User.count({ where: { role: { [Op.ne]: "admin" }, status: "Active" } }),
      User.count({ where: { role: { [Op.ne]: "admin" }, status: "Inactive" } }),
      User.count({
        where: {
          role: { [Op.ne]: "admin" },
          joined_date: { [Op.gte]: monthStart },
        },
      }),
    ]);

    return { totalUsers, activeUsers, inactiveUsers, newThisMonth };
  }

  async getUsers({ search = "", status, subscription, page = 1, limit = 20 } = {}) {
    await this.deactivateStaleUsers();

    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const offset = (safePage - 1) * safeLimit;
    const where = { role: { [Op.ne]: "admin" } };

    if (search) {
      where[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
        { display_name: { [Op.like]: `%${search}%` } },
      ];
    }
    if (status && status !== "all") where.status = status;
    if (subscription && subscription !== "all") {
      where.subscription = subscription === "Premium" ? { [Op.in]: ["Premium", "Super"] } : "Free";
    }

    const [result, stats] = await Promise.all([
      User.findAndCountAll({
        where,
        attributes: { exclude: ["password_hash", "reset_token", "reset_token_expires"] },
        include: [
          { model: UserProgress, as: "progress", required: false },
          { model: UserSetting, as: "settings", required: false },
        ],
        limit: safeLimit,
        offset,
        order: [["joined_date", "DESC"]],
      }),
      this.getStats(),
    ]);

    return {
      users: result.rows.map(serializeUser),
      stats,
      pagination: {
        total: result.count,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(result.count / safeLimit),
      },
    };
  }

  async getUserById(id) {
    await this.deactivateStaleUsers();

    const user = await User.findByPk(id, {
      attributes: { exclude: ["password_hash", "reset_token", "reset_token_expires"] },
      include: [
        { model: UserProgress, as: "progress", required: false },
        { model: UserSetting, as: "settings", required: false },
        {
          model: Feedback,
          as: "feedbacks",
          required: false,
          separate: true,
          limit: 5,
          order: [["created_at", "DESC"]],
        },
      ],
    });

    if (!user || user.role === "admin") {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    const payments = await PaymentOrder.findAll({
      where: { user_id: id },
      order: [["created_at", "DESC"]],
      limit: 10,
    });

    return {
      ...serializeUser(user),
      feedbacks: (user.feedbacks || []).map((feedback) => ({
        id: feedback.id,
        type: feedback.type,
        rating: feedback.rating,
        message: feedback.message,
        status: feedback.status,
        created_at: formatDate(feedback.created_at),
      })),
      transactions: payments.map((payment) => ({
        id: payment.id,
        amount: Number(payment.amount || 0),
        status: payment.status,
        package_type: payment.package_type,
        premium_expires_at: formatDate(payment.premium_expires_at),
        created_at: formatDate(payment.created_at),
      })),
    };
  }

  async updateStatus(id, status) {
    const user = await User.findByPk(id);
    if (!user || user.role === "admin") {
      const error = new Error("User not found");
      error.statusCode = 404;
      throw error;
    }

    await user.update({ status });
    return this.getUserById(id);
  }

  async getDashboardSummary() {
    await this.deactivateStaleUsers();

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [
      currentStats,
      previousUsers,
      previousActiveUsers,
      feedbackCount,
      previousFeedbackCount,
      subscriptionRows,
      userGrowth,
      recentUsers,
      recentFeedback,
    ] = await Promise.all([
      this.getStats(),
      User.count({
        where: {
          role: { [Op.ne]: "admin" },
          joined_date: { [Op.lt]: monthStart },
        },
      }),
      User.count({
        where: {
          role: { [Op.ne]: "admin" },
          status: "Active",
          joined_date: { [Op.lt]: monthStart },
        },
      }),
      Feedback.count(),
      Feedback.count({
        where: {
          created_at: {
            [Op.between]: [previousMonthStart, previousMonthEnd],
          },
        },
      }),
      User.findAll({
        attributes: ["subscription", [sequelize.fn("COUNT", sequelize.col("id")), "count"]],
        where: { role: { [Op.ne]: "admin" } },
        group: ["subscription"],
        raw: true,
      }),
      this.getUserGrowthByMonth(),
      User.findAll({
        where: { role: { [Op.ne]: "admin" } },
        attributes: ["id", "username", "display_name", "joined_date"],
        order: [["joined_date", "DESC"]],
        limit: 4,
      }),
      Feedback.findAll({
        include: [{ model: User, as: "user", attributes: ["username", "display_name"], required: false }],
        order: [["created_at", "DESC"]],
        limit: 4,
      }),
    ]);

    const trend = (current, previous) => {
      if (!previous) return current ? "+100%" : "0%";
      const value = Math.round(((current - previous) / previous) * 100);
      return `${value >= 0 ? "+" : ""}${value}%`;
    };

    const subscriptionCounts = subscriptionRows.reduce(
      (acc, row) => {
        const name = normalizeSubscription(row.subscription);
        acc[name] += Number(row.count);
        return acc;
      },
      { Premium: 0, Free: 0 }
    );
    const subscriptions = [
      { name: "Premium", value: subscriptionCounts.Premium },
      { name: "Free", value: subscriptionCounts.Free },
    ];

    return {
      stats: {
        totalUsers: currentStats.totalUsers,
        activeUsers: currentStats.activeUsers,
        newThisMonth: currentStats.newThisMonth,
        feedbackCount,
        trends: {
          totalUsers: trend(currentStats.totalUsers, previousUsers),
          activeUsers: trend(currentStats.activeUsers, previousActiveUsers),
          newThisMonth: trend(currentStats.newThisMonth, previousUsers),
          feedbackCount: trend(feedbackCount, previousFeedbackCount),
        },
      },
      userGrowth,
      subscriptions,
      recentActivity: [
        ...recentUsers.map((user) => ({
          user: displayName(user),
          action: "Registered account",
          time: formatDate(user.joined_date),
        })),
        ...recentFeedback.map((feedback) => ({
          user: feedback.user ? displayName(feedback.user) : "Deleted user",
          action: `Submitted ${feedback.type}`,
          time: formatDate(feedback.created_at),
        })),
      ]
        .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime())
        .slice(0, 4),
    };
  }

  async getUserGrowthByMonth() {
    const start = new Date();
    start.setMonth(start.getMonth() - 11);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);

    const rows = await User.findAll({
      attributes: [
        [sequelize.fn("DATE_FORMAT", sequelize.col("joined_date"), "%Y-%m"), "period"],
        [sequelize.fn("COUNT", sequelize.col("id")), "users"],
        [
          sequelize.fn(
            "SUM",
            sequelize.literal("CASE WHEN status = 'Active' THEN 1 ELSE 0 END")
          ),
          "active",
        ],
      ],
      where: {
        role: { [Op.ne]: "admin" },
        joined_date: { [Op.gte]: start },
      },
      group: [sequelize.fn("DATE_FORMAT", sequelize.col("joined_date"), "%Y-%m")],
      order: [[sequelize.fn("DATE_FORMAT", sequelize.col("joined_date"), "%Y-%m"), "ASC"]],
      raw: true,
    });

    const rowMap = new Map(rows.map((row) => [row.period, row]));
    return Array.from({ length: 12 }, (_, index) => {
      const date = new Date(start.getFullYear(), start.getMonth() + index, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const row = rowMap.get(key);

      return {
        period: date.toLocaleString("en", { month: "short" }),
        users: row ? Number(row.users) : 0,
        active: row ? Number(row.active || 0) : 0,
      };
    });
  }
}

module.exports = new AdminUserService();
