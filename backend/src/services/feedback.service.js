const { Op } = require("sequelize");
const { Feedback, Notification, User, sequelize } = require("../models");

const formatDate = (value) => (value ? new Date(value).toISOString() : null);

const serializeUser = (user) => {
  if (!user) return null;

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    display_name: user.display_name,
    avatar: user.avatar,
  };
};

const serializeFeedback = (feedback) => {
  const plain = feedback.get ? feedback.get({ plain: true }) : feedback;

  return {
    id: plain.id,
    user_id: plain.user_id,
    user: serializeUser(plain.user),
    type: plain.type,
    rating: plain.rating,
    message: plain.message,
    status: plain.status,
    created_at: formatDate(plain.created_at),
    resolved_at: formatDate(plain.resolved_at),
  };
};

const createFeedbackNotifications = async (feedback, user, transaction) => {
  const userName = user.display_name || user.username || user.email;
  const metadata = {
    feedback_id: feedback.id,
    feedback_type: feedback.type,
    rating: feedback.rating,
  };

  const notifications = [
    {
      recipient_user_id: user.id,
      audience_role: "user",
      type: "feedback_submitted",
      title: "Feedback submitted",
      message: "Thanks for your feedback. Our admin team has received it.",
      metadata,
    },
  ];

  const admins = await User.findAll({
    where: { role: "admin", status: "Active" },
    attributes: ["id"],
    transaction,
  });

  if (admins.length > 0) {
    notifications.push(
      ...admins.map((admin) => ({
        recipient_user_id: admin.id,
        audience_role: "admin",
        type: "feedback_received",
        title: "New user feedback",
        message: `${userName} sent ${feedback.type.toLowerCase()} feedback with ${feedback.rating}/5 stars.`,
        metadata,
      }))
    );
  } else {
    notifications.push({
      recipient_user_id: null,
      audience_role: "admin",
      type: "feedback_received",
      title: "New user feedback",
      message: `${userName} sent ${feedback.type.toLowerCase()} feedback with ${feedback.rating}/5 stars.`,
      metadata,
    });
  }

  await Notification.bulkCreate(notifications, { transaction });
};

const buildFeedbackWhere = ({ type, status }) => {
  const where = {};
  if (type && type !== "all") where.type = type;
  if (status && status !== "all") where.status = status;
  return where;
};

class FeedbackService {
  async createFeedback(user, payload) {
    const created = await sequelize.transaction(async (transaction) => {
      const feedback = await Feedback.create(
        {
          user_id: user.id,
          type: payload.type,
          rating: payload.rating,
          message: payload.message,
          status: "unread",
        },
        { transaction }
      );

      await createFeedbackNotifications(feedback, user, transaction);
      return feedback;
    });

    const feedback = await Feedback.findByPk(created.id, {
      include: [{ model: User, as: "user", attributes: ["id", "username", "email", "display_name", "avatar"] }],
    });

    return serializeFeedback(feedback);
  }

  async getMyFeedback(userId, { page = 1, limit = 20 } = {}) {
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const offset = (safePage - 1) * safeLimit;

    const { count, rows } = await Feedback.findAndCountAll({
      where: { user_id: userId },
      limit: safeLimit,
      offset,
      order: [["created_at", "DESC"]],
    });

    return {
      feedback: rows.map(serializeFeedback),
      pagination: {
        total: count,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(count / safeLimit),
      },
    };
  }

  async getAdminFeedback({ search = "", type = "all", status = "all", page = 1, limit = 20 } = {}) {
    const safePage = Math.max(parseInt(page, 10) || 1, 1);
    const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
    const offset = (safePage - 1) * safeLimit;
    const where = buildFeedbackWhere({ type, status });

    if (search) {
      where[Op.or] = [
        { message: { [Op.like]: `%${search}%` } },
        { "$user.username$": { [Op.like]: `%${search}%` } },
        { "$user.email$": { [Op.like]: `%${search}%` } },
        { "$user.display_name$": { [Op.like]: `%${search}%` } },
      ];
    }

    const [result, stats] = await Promise.all([
      Feedback.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: "user",
            attributes: ["id", "username", "email", "display_name", "avatar"],
            required: false,
          },
        ],
        limit: safeLimit,
        offset,
        order: [["created_at", "DESC"]],
        subQuery: false,
      }),
      this.getFeedbackStats(),
    ]);

    return {
      feedback: result.rows.map(serializeFeedback),
      stats,
      pagination: {
        total: result.count,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(result.count / safeLimit),
      },
    };
  }

  async getFeedbackStats() {
    const [total, unread, bugReports, averageRow, ratingRows, typeRows, statusRows] = await Promise.all([
      Feedback.count(),
      Feedback.count({ where: { status: "unread" } }),
      Feedback.count({ where: { type: "Bug Report" } }),
      Feedback.findOne({
        attributes: [[sequelize.fn("AVG", sequelize.col("rating")), "average"]],
        raw: true,
      }),
      Feedback.findAll({
        attributes: ["rating", [sequelize.fn("COUNT", sequelize.col("id")), "count"]],
        where: { rating: { [Op.ne]: null } },
        group: ["rating"],
        raw: true,
      }),
      Feedback.findAll({
        attributes: ["type", [sequelize.fn("COUNT", sequelize.col("id")), "count"]],
        group: ["type"],
        raw: true,
      }),
      Feedback.findAll({
        attributes: ["status", [sequelize.fn("COUNT", sequelize.col("id")), "count"]],
        group: ["status"],
        raw: true,
      }),
    ]);

    const ratingCounts = [5, 4, 3, 2, 1].map((stars) => {
      const row = ratingRows.find((item) => Number(item.rating) === stars);
      const count = row ? Number(row.count) : 0;
      return {
        stars,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0,
      };
    });

    return {
      total,
      averageRating: Number(Number(averageRow?.average || 0).toFixed(1)),
      unread,
      bugReports,
      ratingDistribution: ratingCounts,
      byType: typeRows.reduce((acc, row) => {
        acc[row.type] = Number(row.count);
        return acc;
      }, {}),
      byStatus: statusRows.reduce((acc, row) => {
        acc[row.status] = Number(row.count);
        return acc;
      }, {}),
    };
  }

  async updateFeedbackStatus(id, status) {
    const feedback = await Feedback.findByPk(id, {
      include: [{ model: User, as: "user", attributes: ["id", "username", "email", "display_name", "avatar"] }],
    });

    if (!feedback) {
      const error = new Error("Feedback not found");
      error.statusCode = 404;
      throw error;
    }

    await feedback.update({
      status,
      resolved_at: status === "resolved" ? new Date() : null,
    });

    return serializeFeedback(feedback);
  }
}

module.exports = new FeedbackService();
