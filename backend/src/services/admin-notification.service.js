const { Op } = require("sequelize");
const {
  Notification,
  NotificationCampaign,
  NotificationTemplate,
} = require("../models");
const notificationService = require("./notification.service");

const badRequest = (message) => {
  const err = new Error(message);
  err.statusCode = 400;
  return err;
};
const notFound = (message) => {
  const err = new Error(message);
  err.statusCode = 404;
  return err;
};

const DEFAULT_TEMPLATES = [
  { event: "top_3_rank", title: "Congratulations!", body: "Hey [username], you reached Top 3 on the leaderboard this week!", variables: ["username"] },
  { event: "rank_up", title: "Rank Up!", body: "[username] has leveled up to [new_rank]! Keep going!", variables: ["username", "new_rank"] },
  { event: "rank_down", title: "Keep Practising", body: "Your rank dropped to [new_rank]. Don't give up, [username]!", variables: ["username", "new_rank"] },
  { event: "premium_purchase", title: "Welcome to Premium!", body: "Hi [username], your Premium subscription is now active. Enjoy all features!", variables: ["username"] },
  { event: "friend_request", title: "New Friend Request", body: "[sender] wants to be your friend!", variables: ["sender"] },
  { event: "achievement", title: "Achievement Unlocked!", body: "You earned the '[achievement_name]' badge, [username]!", variables: ["username", "achievement_name"] },
  { event: "feedback_received", title: "Feedback Received", body: "Thanks [username], your feedback has been submitted successfully.", variables: ["username"] },
];

class AdminNotificationService {
  // ── Campaigns ──

  async listCampaigns() {
    const campaigns = await NotificationCampaign.findAll({
      order: [["created_at", "DESC"]],
    });
    return campaigns.map((c) => c.toJSON());
  }

  async createCampaign(body, adminId) {
    const {
      title,
      message,
      image_url,
      audience = "all",
      trigger_type = "schedule",
      trigger_config = {},
      draft = false,
    } = body || {};

    if (!title || !title.trim()) throw badRequest("Tiêu đề không được để trống");
    if (!message || !message.trim()) throw badRequest("Nội dung không được để trống");

    const now = new Date();
    let status;
    let sentAt = null;

    if (draft) {
      status = "draft";
    } else if (trigger_type === "schedule") {
      const at = trigger_config.scheduled_at ? new Date(trigger_config.scheduled_at) : null;
      if (!at || at <= now) {
        status = "sent";
        sentAt = now;
      } else {
        status = "scheduled";
      }
    } else {
      status = "active";
    }

    const campaign = await NotificationCampaign.create({
      title: title.trim(),
      message: message.trim(),
      image_url: image_url || null,
      audience,
      trigger_type,
      trigger_config,
      status,
      created_by: adminId || null,
      sent_at: sentAt,
    });

    // Side effects for non-draft campaigns.
    if (!draft) {
      if (status === "sent") {
        await notificationService.deliverBroadcastNow(campaign);
      } else if (status === "active") {
        await notificationService.deliverConditionNow(campaign);
      }
    }

    return campaign.toJSON();
  }

  async updateCampaignStatus(id, status) {
    const campaign = await NotificationCampaign.findByPk(id);
    if (!campaign) throw notFound("Campaign không tồn tại");
    if (!["draft", "scheduled", "active", "sent", "cancelled"].includes(status)) {
      throw badRequest("Trạng thái không hợp lệ");
    }
    await campaign.update({ status });
    return campaign.toJSON();
  }

  async deleteCampaign(id) {
    const count = await NotificationCampaign.destroy({ where: { id } });
    if (!count) throw notFound("Campaign không tồn tại");
    return { id };
  }

  // ── Templates ──

  async seedTemplates() {
    for (const t of DEFAULT_TEMPLATES) {
      await NotificationTemplate.findOrCreate({
        where: { event: t.event },
        defaults: { ...t },
      });
    }
  }

  async listTemplates() {
    const count = await NotificationTemplate.count();
    if (count === 0) await this.seedTemplates();
    const templates = await NotificationTemplate.findAll({ order: [["id", "ASC"]] });
    return templates.map((t) => t.toJSON());
  }

  async createTemplate(body) {
    const { event, title, body: text, variables } = body || {};
    if (!event || !title || !text) throw badRequest("Thiếu thông tin template");
    const existing = await NotificationTemplate.findOne({ where: { event } });
    if (existing) throw badRequest("Template cho sự kiện này đã tồn tại");
    const template = await NotificationTemplate.create({
      event,
      title,
      body: text,
      variables: variables || [],
      enabled: true,
    });
    return template.toJSON();
  }

  async updateTemplate(id, body) {
    const template = await NotificationTemplate.findByPk(id);
    if (!template) throw notFound("Template không tồn tại");
    const fields = {};
    if (body.title !== undefined) fields.title = body.title;
    if (body.body !== undefined) fields.body = body.body;
    if (body.variables !== undefined) fields.variables = body.variables;
    if (body.enabled !== undefined) fields.enabled = body.enabled;
    await template.update(fields);
    return template.toJSON();
  }

  // ── Admin inbox ──

  async getInbox(adminId) {
    const where = {
      audience_role: "admin",
      [Op.or]: [{ recipient_user_id: adminId }, { recipient_user_id: null }],
    };
    const notifications = await Notification.findAll({
      where,
      order: [["created_at", "DESC"]],
      limit: 100,
    });
    const unreadCount = await Notification.count({ where: { ...where, is_read: false } });
    return {
      notifications: notifications.map((n) => ({
        id: n.id,
        type: n.type,
        title: n.title,
        message: n.message,
        metadata: n.metadata,
        is_read: n.is_read,
        created_at: n.created_at,
      })),
      unread_count: unreadCount,
    };
  }

  async markInboxRead(adminId, id) {
    const n = await Notification.findOne({
      where: {
        id,
        audience_role: "admin",
        [Op.or]: [{ recipient_user_id: adminId }, { recipient_user_id: null }],
      },
    });
    if (!n) throw notFound("Notification không tồn tại");
    if (!n.is_read) await n.update({ is_read: true, read_at: new Date() });
    return { id };
  }

  async markInboxAllRead(adminId) {
    await Notification.update(
      { is_read: true, read_at: new Date() },
      {
        where: {
          audience_role: "admin",
          is_read: false,
          [Op.or]: [{ recipient_user_id: adminId }, { recipient_user_id: null }],
        },
      }
    );
    return { ok: true };
  }
}

module.exports = new AdminNotificationService();
