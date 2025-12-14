const { User, UserProgress, UserCurrency } = require("../models");
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
        {
          model: UserCurrency,
          as: "currency",
        },
      ],
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  async updateProfile(userId, updateData) {
    const { username, email } = updateData;

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

    await user.update(updateData);

    const updatedUser = await this.getProfile(userId);
    return updatedUser;
  }

  async uploadAvatar(userId, file) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error("User not found");
    }

    if (user.avatar_url) {
      const oldAvatarPath = path.join(process.cwd(), user.avatar_url);
      deleteFile(oldAvatarPath);
    }

    const avatarUrl = `/uploads/avatars/${file.filename}`;
    await user.update({
      avatar_url: avatarUrl,
    });

    return {
      avatar_url: avatarUrl,
      message: "Avatar đã được cập nhật thành công",
    };
  }

  async setLearningGoals(userId, goals) {
    const { daily_goal_minutes } = goals;
    let userProgress = await UserProgress.findOne({
      where: { user_id: userId },
    });

    if (!userProgress) {
      userProgress = await UserProgress.create({
        user_id: userId,
        daily_goal_minutes,
      });
    } else {
      await userProgress.update({
        daily_goal_minutes,
        updated_at: new Date(),
      });
    }

    return {
      daily_goal_minutes: userProgress.daily_goal_minutes,
      message: "Mục tiêu học tập đã được cập nhật",
    };
  }

  async getProgress(userId) {
    const userProgress = await UserProgress.findOne({
      where: { user_id: userId },
    });

    if (!userProgress) {
      const newProgress = await UserProgress.create({
        user_id: userId,
      });
      return newProgress;
    }

    return userProgress;
  }

  async updateProgress(userId, progressData) {
    const { study_time, words_learned, units_completed } = progressData;

    let userProgress = await UserProgress.findOne({
      where: { user_id: userId },
    });

    if (!userProgress) {
      userProgress = await UserProgress.create({
        user_id: userId,
      });
    }

    const updates = {};

    if (study_time !== undefined) {
      updates.study_time_today =
        (userProgress.study_time_today || 0) + study_time;
      updates.total_study_minutes =
        (userProgress.total_study_minutes || 0) + Math.floor(study_time / 60);
    }

    if (words_learned !== undefined) {
      updates.words_learned = (userProgress.words_learned || 0) + words_learned;
    }

    if (units_completed !== undefined) {
      updates.units_completed = units_completed;
    }

    const today = new Date().toISOString().split("T")[0];
    const lastStudyDate = userProgress.last_study_date;

    if (lastStudyDate) {
      const lastDate = new Date(lastStudyDate).toISOString().split("T")[0];
      const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .split("T")[0];

      if (lastDate === yesterday) {
        updates.streak_days = (userProgress.streak_days || 0) + 1;
      } else if (lastDate !== today) {
        updates.streak_days = 1;
      }
    } else {
      updates.streak_days = 1;
    }

    updates.last_study_date = today;
    updates.updated_at = new Date();

    await userProgress.update(updates);

    return userProgress;
  }

  async getStatistics(userId) {
    const user = await User.findByPk(userId, {
      attributes: ["id", "username", "level", "subscription", "joined_date"],
      include: [
        {
          model: UserProgress,
          as: "progress",
        },
        {
          model: UserCurrency,
          as: "currency",
        },
      ],
    });

    if (!user) {
      throw new Error("User not found");
    }

    const progress = user.progress || {};
    const currency = user.currency || {};

    const stats = {
      user_info: {
        username: user.username,
        level: user.level,
        subscription: user.subscription,
        member_since: user.joined_date,
      },
      learning_stats: {
        units_completed: progress.units_completed || 0,
        words_learned: progress.words_learned || 0,
        total_study_hours: Math.floor((progress.total_study_minutes || 0) / 60),
        streak_days: progress.streak_days || 0,
        daily_goal_minutes: progress.daily_goal_minutes || 15,
        today_study_seconds: progress.study_time_today || 0,
      },
      currency: {
        crystals: currency.crystals || 0,
        crowns: currency.crowns || 0,
      },
      achievements: {
        total: 0,
        completed: 0,
      },
    };

    return stats;
  }
}

module.exports = new UserService();
