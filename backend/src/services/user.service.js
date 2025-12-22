const { User, UserProgress } = require("../models");
const { deleteFile } = require("../utils/file.util");
const path = require("path");

class UserService {
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

    if (username && username !== user.username) {
      const existingUsername = await User.findOne({
        where: { username },
      });
      if (existingUsername) {
        throw new Error("Username đã được sử dụng");
      }
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
    if (username) updates.username = username;
    if (email) updates.email = email;
    if (display_name) updates.display_name = display_name;
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

    const newLevel = Math.floor(newTotalXP / 1000) + 1;

    // Determine league based on weekly_xp
    let newLeague = "Bronze";
    if (newWeeklyXP >= 3000) {
      newLeague = "Diamond";
    } else if (newWeeklyXP >= 2000) {
      newLeague = "Gold";
    } else if (newWeeklyXP >= 1000) {
      newLeague = "Silver";
    }

    await userProgress.update({
      total_xp: newTotalXP,
      weekly_xp: newWeeklyXP,
      level: newLevel,
      league: newLeague,
      last_active_date: new Date().toISOString().split("T")[0],
    });

    return userProgress;
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

  async resetWeeklyXP() {
    await UserProgress.update({ weekly_xp: 0 }, { where: {} });
  }
}

module.exports = new UserService();
