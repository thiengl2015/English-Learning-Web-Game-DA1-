const { User, UserProgress, UserSetting, Friendship } = require("../models");
const { Op } = require("sequelize");
const { deleteFile } = require("../utils/file.util");
const notificationService = require("./notification.service");
const path = require("path");

const LEAGUE_ORDER = ["Bronze", "Silver", "Gold", "Diamond"];

class UserService {
  serializeSettings(settings) {
    return {
      push_notifications: settings.push_notifications,
      email_reminders: settings.email_reminders,
      sound_effects: settings.sound_effects,
      background_music: settings.background_music,
      music_volume: settings.music_volume,
      audio_volume: settings.audio_volume,
      dark_mode: settings.dark_mode,
      updated_at: settings.updated_at,
    };
  }

  async getOrCreateSettings(userId) {
    const [settings] = await UserSetting.findOrCreate({
      where: { user_id: userId },
      defaults: { user_id: userId },
    });

    return settings;
  }

  async getSettings(userId) {
    const settings = await this.getOrCreateSettings(userId);
    return this.serializeSettings(settings);
  }

  async updateSettings(userId, updateData) {
    const settings = await this.getOrCreateSettings(userId);
    await settings.update(updateData);
    return this.serializeSettings(settings);
  }

  async getProfile(userId) {
    const user = await User.findByPk(userId, {
      attributes: {
        exclude: ["password_hash", "reset_token", "reset_token_expires"],
      },
      include: [
        {
          model: UserProgress,
          as: "progress",
        },
        {
          model: UserSetting,
          as: "settings",
        },
      ],
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  async updateProfile(userId, updateData) {
    const {
      username,
      email,
      display_name,
      native_language,
      current_level,
      learning_goal,
      daily_goal,
    } = updateData;

    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (username !== undefined && username !== user.username) {
      throw new Error("Username cannot be changed from profile");
    }

    if (email && email !== user.email) {
      const existingEmail = await User.findOne({
        where: { email },
      });
      if (existingEmail) {
        throw new Error("Email đã được sử dụng");
      }
    }

    const updates = {};
    if (email) updates.email = email;
    if (Object.prototype.hasOwnProperty.call(updateData, "display_name")) {
      updates.display_name = display_name;
    }
    if (native_language) updates.native_language = native_language;
    if (current_level) updates.current_level = current_level;
    if (learning_goal) updates.learning_goal = learning_goal;
    if (daily_goal !== undefined) updates.daily_goal = daily_goal;

    await user.update(updates);

    const updatedUser = await this.getProfile(userId);
    return updatedUser;
  }

  async changePassword(userId, currentPassword, newPassword) {
    const user = await User.findByPk(userId);

    if (!user) {
      throw new Error("User not found");
    }

    const isPasswordValid = await user.comparePassword(currentPassword);

    if (!isPasswordValid) {
      throw new Error("Mật khẩu hiện tại không đúng");
    }

    const bcrypt = require("bcryptjs");
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await user.update({
      password_hash: hashedPassword,
    });

    return {
      message: "Đổi mật khẩu thành công",
    };
  }

  async uploadAvatar(userId, file) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.avatar) {
      const oldAvatarPath = path.join(process.cwd(), user.avatar);
      deleteFile(oldAvatarPath);
    }

    const avatarUrl = `/uploads/avatars/${file.filename}`;

    await user.update({
      avatar: avatarUrl,
    });

    return {
      avatar_url: avatarUrl,
      message: "Avatar đã được cập nhật thành công",
    };
  }

  async getProgress(userId) {
    let userProgress = await UserProgress.findOne({
      where: { user_id: userId },
    });

    if (!userProgress) {
      userProgress = await UserProgress.create({
        user_id: userId,
      });
    }

    return userProgress;
  }

  async addXP(userId, xpAmount) {
    let userProgress = await UserProgress.findOne({
      where: { user_id: userId },
    });

    if (!userProgress) {
      userProgress = await UserProgress.create({
        user_id: userId,
      });
    }

    const newTotalXP = (userProgress.total_xp || 0) + xpAmount;
    const newWeeklyXP = (userProgress.weekly_xp || 0) + xpAmount;
    const newXPThisWeek = (userProgress.xp_this_week || 0) + xpAmount;

    const newLevel = Math.floor(newTotalXP / 1000) + 1;

    // Determine league based on weekly_xp (consistant with leaderboard.service.js)
    let newLeague = "Bronze";
    if (newWeeklyXP >= 3000) {
      newLeague = "Diamond";
    } else if (newWeeklyXP >= 1500) {
      newLeague = "Gold";
    } else if (newWeeklyXP >= 500) {
      newLeague = "Silver";
    }

    const previousLeague = userProgress.league || "Bronze";

    // League only rises here; demotions happen at the weekly reset (bottom 3).
    const upgradedLeague =
      LEAGUE_ORDER.indexOf(newLeague) > LEAGUE_ORDER.indexOf(previousLeague)
        ? newLeague
        : previousLeague;

    await userProgress.update({
      total_xp: newTotalXP,
      weekly_xp: newWeeklyXP,
      xp_this_week: newXPThisWeek,
      level: newLevel,
      league: upgradedLeague,
      last_active_date: new Date().toISOString().split("T")[0],
    });

    // The UserProgress beforeUpdate hook may raise league further, so compare the
    // persisted value and fire a rank_up notification on a promotion.
    const currentLeague = userProgress.league;
    if (previousLeague && currentLeague && previousLeague !== currentLeague) {
      this.notifyRankChange(userId, previousLeague, currentLeague).catch(() => {});
    }

    return userProgress;
  }

  // Fire rank_up / rank_down when a user's league changes (best-effort).
  async notifyRankChange(userId, fromLeague, toLeague) {
    try {
      const movedUp =
        LEAGUE_ORDER.indexOf(toLeague) > LEAGUE_ORDER.indexOf(fromLeague);
      const user = await User.findByPk(userId, {
        attributes: ["id", "username", "display_name"],
      });
      const username = user ? user.display_name || user.username : "there";
      await notificationService.deliverEventToUser(
        movedUp ? "rank_up" : "rank_down",
        userId,
        { username, new_rank: toLeague }
      );
    } catch (error) {
      console.error("rank change notification failed:", error.message);
    }
  }

  async getStatistics(userId) {
    const user = await User.findByPk(userId, {
      attributes: [
        "id",
        "username",
        "display_name",
        "level",
        "subscription",
        "joined_date",
        "daily_goal",
      ],
      include: [
        {
          model: UserProgress,
          as: "progress",
        },
      ],
    });

    if (!user) {
      throw new Error("User not found");
    }

    const progress = user.progress || {};

    const stats = {
      user_info: {
        username: user.username,
        display_name: user.display_name,
        level: progress.level || 1,
        subscription: user.subscription,
        member_since: user.joined_date,
        daily_goal: user.daily_goal,
      },
      progress: {
        total_xp: progress.total_xp || 0,
        weekly_xp: progress.weekly_xp || 0,
        level: progress.level || 1,
        streak_days: progress.streak_days || 0,
        league: progress.league || "Bronze",
        last_active_date: progress.last_active_date,
      },
      achievements: {
        total: 0,
        completed: 0,
      },
    };

    return stats;
  }

  async searchUsers(currentUserId, query) {
    const search = (query || "").trim();
    if (search.length < 1) {
      return [];
    }

    const users = await User.findAll({
      where: {
        id: { [Op.ne]: currentUserId },
        status: "Active",
        [Op.or]: [
          { username: { [Op.like]: `%${search}%` } },
          { display_name: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
        ],
      },
      attributes: ["id", "username", "display_name", "email", "avatar"],
      include: [
        {
          model: UserProgress,
          as: "progress",
        },
      ],
      limit: 20,
      order: [["username", "ASC"]],
    });

    const userIds = users.map((user) => user.id);
    const friendships = userIds.length
      ? await Friendship.findAll({
          where: {
            [Op.or]: [
              {
                requester_id: currentUserId,
                addressee_id: { [Op.in]: userIds },
              },
              {
                requester_id: { [Op.in]: userIds },
                addressee_id: currentUserId,
              },
            ],
          },
        })
      : [];

    const friendStatusByUserId = {};
    friendships.forEach((friendship) => {
      const otherUserId =
        friendship.requester_id === currentUserId
          ? friendship.addressee_id
          : friendship.requester_id;

      if (friendship.status === "accepted") {
        friendStatusByUserId[otherUserId] = "friends";
      } else if (friendship.requester_id === currentUserId) {
        friendStatusByUserId[otherUserId] = "pending_sent";
      } else {
        friendStatusByUserId[otherUserId] = "pending_received";
      }
    });

    return users.map((user) => {
      const progress = user.progress || {};
      const friendStatus = friendStatusByUserId[user.id] || "none";
      return {
        id: user.id,
        name: user.display_name || user.username,
        username: user.username,
        email: user.email,
        avatar: user.avatar || "/placeholder.svg",
        totalXP: progress.total_xp || 0,
        highestRank: progress.league || "Bronze",
        highestPosition: 1,
        friendStatus,
        isFriend: friendStatus === "friends",
      };
    });
  }

  async resetWeeklyXP() {
    await UserProgress.update({ weekly_xp: 0, xp_this_week: 0 }, { where: {} });
  }
}

module.exports = new UserService();
