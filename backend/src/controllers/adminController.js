const { User, UserProgress, LessonProgress, GameSession, Feedback, sequelize } = require("../models");
const { successResponse, errorResponse } = require("../utils/response.util");
const { Op } = require("sequelize");

// Lấy danh sách user với phân trang và filter
exports.getUsers = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = "",
      status,
      role,
    } = req.query;

    const offset = (page - 1) * limit;
    const where = {};

    if (search) {
      where[Op.or] = [
        { username: { [Op.like]: `%${search}%` } },
        { email: { [Op.like]: `%${search}%` } },
      ];
    }
    if (status) where.status = status;
    if (role) where.role = role;

    const { count, rows } = await User.findAndCountAll({
      where,
      attributes: {
        exclude: ["password_hash", "reset_token", "reset_token_expires"],
      },
      include: [
        {
          model: UserProgress,
          as: "progress",
          attributes: ["total_xp", "level", "streak_days", "league"],
        },
      ],
      limit: parseInt(limit),
      offset,
      order: [["created_at", "DESC"]],
    });

    return successResponse(res, {
      users: rows,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit),
      },
    }, "Lấy danh sách user thành công");
  } catch (error) {
    next(error);
  }
};

// Lấy chi tiết 1 user
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: {
        exclude: ["password_hash", "reset_token", "reset_token_expires"],
      },
      include: [
        {
          model: UserProgress,
          as: "progress",
        },
        {
          model: LessonProgress,
          as: "lessonProgress",
          attributes: ["lesson_id", "completed", "stars", "xp_earned"],
        },
      ],
    });

    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    return successResponse(res, user, "Lấy thông tin user thành công");
  } catch (error) {
    next(error);
  }
};

// Cập nhật trạng thái user
exports.updateStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["Active", "Inactive"].includes(status)) {
      return errorResponse(res, "Status must be 'Active' or 'Inactive'", 400);
    }

    const user = await User.findByPk(id);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    await user.update({ status });

    return successResponse(res, { id, status }, "Cập nhật trạng thái thành công");
  } catch (error) {
    next(error);
  }
};

// Cập nhật subscription
exports.updateSubscription = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { subscription } = req.body;

    if (!["Free", "Premium", "Super"].includes(subscription)) {
      return errorResponse(res, "Subscription must be 'Free', 'Premium', or 'Super'", 400);
    }

    const user = await User.findByPk(id);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    await user.update({ subscription });

    return successResponse(res, { id, subscription }, "Cập nhật subscription thành công");
  } catch (error) {
    next(error);
  }
};

// Xoá user
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return errorResponse(res, "User not found", 404);
    }

    await user.destroy();

    return successResponse(res, null, "Xoá user thành công");
  } catch (error) {
    next(error);
  }
};

// Dashboard summary
exports.getDashboardSummary = async (req, res, next) => {
  try {
    const [
      totalUsers,
      activeUsers,
      totalFeedbacks,
      gameSessions,
      userStats,
    ] = await Promise.all([
      User.count(),
      User.count({ where: { status: "Active" } }),
      Feedback.count(),
      GameSession.count(),
      User.findAll({
        attributes: {
          include: [[sequelize.fn("DATE_FORMAT"), sequelize.col("joined_date"), "formatted_date"]],
        },
      }),
    ]);

    const usersByDay = await User.findAll({
      attributes: [
        [sequelize.literal("DATE(joined_date)"), "date"],
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      where: {
        joined_date: {
          [Op.gte]: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
      group: [sequelize.literal("DATE(joined_date)")],
      order: [[sequelize.literal("DATE(joined_date)"), "ASC"]],
      raw: true,
    });

    const subscriptionStats = await User.findAll({
      attributes: [
        "subscription",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["subscription"],
      raw: true,
    });

    return successResponse(res, {
      totalUsers,
      activeUsers,
      totalFeedbacks,
      totalGameSessions: gameSessions,
      usersByDay,
      subscriptionStats: subscriptionStats.reduce((acc, row) => {
        acc[row.subscription] = parseInt(row.count);
        return acc;
      }, {}),
    }, "Lấy dashboard summary thành công");
  } catch (error) {
    next(error);
  }
};
