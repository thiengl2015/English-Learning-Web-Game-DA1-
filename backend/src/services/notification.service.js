const { Op } = require("sequelize");
const {
  Notification,
  NotificationCampaign,
  NotificationTemplate,
  User,
  UserProgress,
} = require("../models");
const { emitToUser } = require("../socket/emitter");

const DAY_MS = 24 * 60 * 60 * 1000;

const notFound = (message) => {
  const err = new Error(message);
  err.statusCode = 404;
  return err;
};

function userMatchesAudience(user, audience) {
  switch (audience) {
    case "all":
      return true;
    case "premium":
      return user.subscription === "Premium";
    case "free":
      return user.subscription !== "Premium";
    case "inactive":
      return user.status === "Inactive";
    default:
      return false;
  }
}

function conditionMet(campaign, progress) {
  const cfg = campaign.trigger_config || {};
  switch (campaign.trigger_type) {
    case "level_reached":
      return (progress?.level || 1) >= Number(cfg.level || 0);
    case "units_completed":
      return (progress?.units_completed || 0) >= Number(cfg.units || 0);
    case "streak":
      return (progress?.streak_days || 0) >= Number(cfg.streak_days || 0);
    case "xp_milestone":
      return (progress?.total_xp || 0) >= Number(cfg.xp || 0);
    default:
      return false;
  }
}

class NotificationService {
  notificationType(campaign) {
    return campaign.trigger_type === "schedule" ? "broadcast" : campaign.trigger_type;
  }

  // Create a per-user notification for a campaign (dedupe by campaign+user).
  async deliverToUser(campaign, userId) {
    const existing = await Notification.findOne({
      where: { campaign_id: campaign.id, recipient_user_id: userId },
    });
    if (existing) return null;

    const notification = await Notification.create({
      recipient_user_id: userId,
      audience_role: "user",
      type: this.notificationType(campaign),
      title: campaign.title,
      message: campaign.message,
      metadata: {
        campaign_id: campaign.id,
        image_url: campaign.image_url || null,
        trigger_type: campaign.trigger_type,
      },
      campaign_id: campaign.id,
    });

    emitToUser(userId, "notification:new", {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
    });
    return notification;
  }

  // Replace [token] placeholders in template text with provided variables.
  renderTemplate(text, variables = {}) {
    return String(text || "").replace(/\[(\w+)\]/g, (match, key) =>
      variables[key] !== undefined && variables[key] !== null
        ? String(variables[key])
        : match
    );
  }

  // Fire a personalized event notification to one user from its template.
  // Skips silently if the template is missing or disabled (admin can toggle it off).
  async deliverEventToUser(event, userId, variables = {}, extraMetadata = {}) {
    if (!userId) return null;

    const template = await NotificationTemplate.findOne({ where: { event } });
    if (!template || template.enabled === false) return null;

    const notification = await Notification.create({
      recipient_user_id: userId,
      audience_role: "user",
      type: event,
      title: this.renderTemplate(template.title, variables),
      message: this.renderTemplate(template.body, variables),
      metadata: { event, ...extraMetadata },
    });

    emitToUser(userId, "notification:new", {
      id: notification.id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
    });
    return notification;
  }

  async audienceUsers(audience) {
    const where = { role: { [Op.ne]: "admin" } };
    if (audience === "premium") where.subscription = "Premium";
    else if (audience === "free") where.subscription = { [Op.ne]: "Premium" };
    else if (audience === "inactive") where.status = "Inactive";

    return User.findAll({
      where,
      attributes: ["id", "subscription", "status", "last_active"],
    });
  }

  // ── User-facing ──

  async listForUser(user) {
    await this.materializeForUser(user);

    const notifications = await Notification.findAll({
      where: { recipient_user_id: user.id, audience_role: "user" },
      order: [["created_at", "DESC"]],
      limit: 100,
    });
    const unreadCount = await Notification.count({
      where: { recipient_user_id: user.id, audience_role: "user", is_read: false },
    });

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

  // Lazily deliver any due/condition-met campaigns for this specific user.
  async materializeForUser(user) {
    const now = new Date();
    const campaigns = await NotificationCampaign.findAll({
      where: { status: { [Op.in]: ["scheduled", "active"] } },
    });
    if (campaigns.length === 0) return;

    const progress = await UserProgress.findOne({ where: { user_id: user.id } });

    for (const c of campaigns) {
      if (!userMatchesAudience(user, c.audience)) continue;

      if (c.trigger_type === "schedule") {
        const at = c.trigger_config?.scheduled_at ? new Date(c.trigger_config.scheduled_at) : null;
        if (c.status === "scheduled" && at && at <= now) {
          await this.deliverToUser(c, user.id);
        }
      } else if (c.trigger_type === "resume_activity") {
        // handled separately (event-driven, repeatable)
      } else if (c.status === "active" && conditionMet(c, progress)) {
        await this.deliverToUser(c, user.id);
      }
    }

    await this.handleResumeActivity(user, campaigns, now);
  }

  // Welcome-back notifications when a user returns after being inactive.
  async handleResumeActivity(user, campaigns, now) {
    const resumeCampaigns = campaigns.filter(
      (c) =>
        c.trigger_type === "resume_activity" &&
        c.status === "active" &&
        userMatchesAudience(user, c.audience)
    );

    const last = user.last_active ? new Date(user.last_active) : null;
    if (last && resumeCampaigns.length > 0) {
      const gapDays = (now - last) / DAY_MS;
      for (const c of resumeCampaigns) {
        const need = Number(c.trigger_config?.inactive_days || 7);
        if (gapDays >= need) {
          // Repeatable, but not more than once per `need` window.
          const since = new Date(now.getTime() - need * DAY_MS);
          const recent = await Notification.findOne({
            where: {
              campaign_id: c.id,
              recipient_user_id: user.id,
              created_at: { [Op.gte]: since },
            },
          });
          if (!recent) {
            const notification = await Notification.create({
              recipient_user_id: user.id,
              audience_role: "user",
              type: "resume_activity",
              title: c.title,
              message: c.message,
              metadata: { campaign_id: c.id, image_url: c.image_url || null, trigger_type: "resume_activity" },
              campaign_id: c.id,
            });
            emitToUser(user.id, "notification:new", {
              id: notification.id,
              title: notification.title,
              message: notification.message,
              type: notification.type,
            });
          }
        }
      }
    }

    // Mark this fetch as activity so the gap resets for next time.
    try {
      await User.update({ last_active: now }, { where: { id: user.id } });
    } catch (e) {
      /* ignore if column unavailable */
    }
  }

  async markRead(userId, id) {
    const n = await Notification.findOne({
      where: { id, recipient_user_id: userId },
    });
    if (!n) throw notFound("Notification không tồn tại");
    if (!n.is_read) await n.update({ is_read: true, read_at: new Date() });
    return { id };
  }

  async markAllRead(userId, audienceRole = "user") {
    await Notification.update(
      { is_read: true, read_at: new Date() },
      { where: { recipient_user_id: userId, audience_role: audienceRole, is_read: false } }
    );
    return { ok: true };
  }

  // Permanently remove one of the user's own notifications (e.g. a handled
  // friend request). Scoped to the owner so a user can't delete others' rows.
  async deleteForUser(userId, id) {
    const count = await Notification.destroy({
      where: { id, recipient_user_id: userId, audience_role: "user" },
    });
    if (!count) throw notFound("Notification không tồn tại");
    return { id };
  }

  // ── Scheduler tick (periodic global delivery) ──

  async runTick() {
    const now = new Date();

    // 1) Scheduled broadcasts that are due.
    const scheduled = await NotificationCampaign.findAll({ where: { status: "scheduled" } });
    for (const c of scheduled) {
      const at = c.trigger_config?.scheduled_at ? new Date(c.trigger_config.scheduled_at) : null;
      if (at && at <= now) {
        const users = await this.audienceUsers(c.audience);
        for (const u of users) await this.deliverToUser(c, u.id);
        await c.update({ status: "sent", sent_at: now });
      }
    }

    // 2) Active condition campaigns (not resume — that's event-driven).
    const active = await NotificationCampaign.findAll({
      where: { status: "active", trigger_type: { [Op.ne]: "resume_activity" } },
    });
    for (const c of active) {
      const users = await this.audienceUsers(c.audience);
      const ids = users.map((u) => u.id);
      if (ids.length === 0) continue;
      const progresses = await UserProgress.findAll({ where: { user_id: { [Op.in]: ids } } });
      const pmap = {};
      progresses.forEach((p) => {
        pmap[p.user_id] = p;
      });
      for (const u of users) {
        if (conditionMet(c, pmap[u.id])) await this.deliverToUser(c, u.id);
      }
    }
  }

  // Deliver an active condition campaign to currently-qualifying users right away.
  async deliverConditionNow(campaign) {
    if (campaign.trigger_type === "resume_activity") return;
    const users = await this.audienceUsers(campaign.audience);
    const ids = users.map((u) => u.id);
    if (ids.length === 0) return;
    const progresses = await UserProgress.findAll({ where: { user_id: { [Op.in]: ids } } });
    const pmap = {};
    progresses.forEach((p) => {
      pmap[p.user_id] = p;
    });
    for (const u of users) {
      if (conditionMet(campaign, pmap[u.id])) await this.deliverToUser(campaign, u.id);
    }
  }

  // Deliver a "send now" broadcast immediately to its audience.
  async deliverBroadcastNow(campaign) {
    const users = await this.audienceUsers(campaign.audience);
    for (const u of users) await this.deliverToUser(campaign, u.id);
  }
}

module.exports = new NotificationService();
