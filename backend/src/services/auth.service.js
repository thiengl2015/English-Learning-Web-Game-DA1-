const { User, UserProgress } = require('../models');
const { generateToken } = require('../utils/jwt.util');
const { generateOTP, isOTPExpired, getOTPExpiry } = require('../utils/otp.util');
const emailService = require('./email.service');

class AuthService {

  async register(userData) {
    const { username, email, password, display_name, native_language, current_level, learning_goal, daily_goal } = userData;

    const existingUser = await User.findOne({
      where: {
        [require('sequelize').Op.or]: [{ email }, { username }]
      }
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new Error('Email đã được sử dụng');
      }
      if (existingUser.username === username) {
        throw new Error('Username đã được sử dụng');
      }
    }

    const user = await User.create({
      username,
      email,
      password_hash: password, 
      display_name: display_name || username,
      native_language: native_language || 'vi',
      current_level: current_level || 'beginner',
      learning_goal: learning_goal || 'daily',
      daily_goal: daily_goal || 15
    });

    await UserProgress.create({
      user_id: user.id,
      total_xp: 100, 
      weekly_xp: 100,
      level: 1,
      streak_days: 0,
      league: 'Bronze'
    });

    emailService.sendWelcomeEmail(email, display_name || username).catch(err => 
      console.error('Failed to send welcome email:', err)
    );

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    const userResponse = user.toJSON();
    delete userResponse.password_hash;
    delete userResponse.reset_token;
    delete userResponse.reset_token_expires;

    return {
      user: userResponse,
      token
    };
  }

  async login(email, password) {
    const user = await User.findOne({
      where: { email }
    });

    if (!user) {
      throw new Error('Email hoặc mật khẩu không đúng');
    }

    if (user.status !== 'Active') {
      throw new Error('Tài khoản đã bị vô hiệu hóa');
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      throw new Error('Email hoặc mật khẩu không đúng');
    }

    await user.update({
      last_active: new Date()
    });

    await this.updateStreak(user.id);

    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role
    });

    const userResponse = user.toJSON();
    delete userResponse.password_hash;
    delete userResponse.reset_token;
    delete userResponse.reset_token_expires;

    return {
      user: userResponse,
      token
    };
  }

  async updateStreak(userId) {
    const userProgress = await UserProgress.findOne({
      where: { user_id: userId }
    });

    if (!userProgress) return;

    const today = new Date().toISOString().split('T')[0];
    const lastActiveDate = userProgress.last_active_date;

    if (lastActiveDate) {
      const lastDate = new Date(lastActiveDate).toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

      if (lastDate === yesterday) {
        await userProgress.update({
          streak_days: userProgress.streak_days + 1,
          last_active_date: today
        });
      } else if (lastDate !== today) {
        await userProgress.update({
          streak_days: 1,
          last_active_date: today
        });
      }
    } else {
      await userProgress.update({
        streak_days: 1,
        last_active_date: today
      });
    }
  }

  async forgotPassword(email) {
    const user = await User.findOne({
      where: { email }
    });

    if (!user) {
      return {
        message: 'Nếu email tồn tại, mã OTP đã được gửi đến email của bạn'
      };
    }
    const otp = generateOTP(6);
    const otpExpiry = getOTPExpiry(10);

    await user.update({
      reset_token: otp,
      reset_token_expires: otpExpiry
    });

    const emailSent = await emailService.sendPasswordResetOTP(
      email,
      otp,
      user.display_name || user.username
    );

    if (!emailSent) {
      console.error('Failed to send OTP email to:', email);
    }

    return {
      message: 'Mã OTP đã được gửi đến email của bạn'
    };
  }

  async resetPassword(email, otp, newPassword) {
    const user = await User.findOne({
      where: { email }
    });

    if (!user) {
      throw new Error('Email không tồn tại');
    }

    if (!user.reset_token || user.reset_token !== otp) {
      throw new Error('Mã OTP không chính xác');
    }

    if (isOTPExpired(user.reset_token_expires)) {
      throw new Error('Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới');
    }

    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await user.update({
      password_hash: hashedPassword,
      reset_token: null,
      reset_token_expires: null
    });

    return {
      message: 'Mật khẩu đã được cập nhật thành công'
    };
  }

  async getProfile(userId) {
    const user = await User.findByPk(userId, {
      attributes: { 
        exclude: ['password_hash', 'reset_token', 'reset_token_expires'] 
      },
      include: [
        {
          model: UserProgress,
          as: 'progress'
        }
      ]
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }
}

module.exports = new AuthService();