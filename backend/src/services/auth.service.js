const { User, UserProgress, UserCurrency } = require("../models");
const { generateToken } = require("../utils/jwt.util");
const { hashPassword } = require("../utils/bcrypt.util");
const emailService = require("./email.service");
const {
  generateOTP,
  getOTPExpiry,
  isOTPExpired,
} = require("../utils/otp.util");

class AuthService {
  async register(userData) {
    const { username, email, password } = userData;

    const existingUser = await User.findOne({
      where: {
        [require("sequelize").Op.or]: [{ email }, { username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new Error("Email đã được sử dụng");
      }
      if (existingUser.username === username) {
        throw new Error("Username đã được sử dụng");
      }
    }

    const user = await User.create({
      username,
      email,
      password_hash: password,
    });

    await UserProgress.create({
      user_id: user.id,
    });

    // Create user currency
    await UserCurrency.create({
      user_id: user.id,
      crystals: 100, // Welcome bonus
      crowns: 0,
    });

    emailService
      .sendWelcomeEmail(email, username)
      .catch((err) => console.error("Failed to send welcome email:", err));

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Remove sensitive data
    const userResponse = user.toJSON();
    delete userResponse.password_hash;
    delete userResponse.reset_token;
    delete userResponse.reset_token_expires;

    return {
      user: userResponse,
      token,
    };
  }

  async login(email, password) {
    console.log("Login attempt:", { email, password });

    const user = await User.findOne({
      where: { email },
    });

    console.log("User found:", user ? "Yes" : "No");
    if (!user) {
      throw new Error("Email hoặc mật khẩu không đúng");
    }

    // Check if account is active
    if (user.status !== "Active") {
      throw new Error("Tài khoản đã bị vô hiệu hóa");
    }

    // Compare password
    console.log("Comparing password...");
    const isPasswordValid = await user.comparePassword(password);
    console.log("Password valid:", isPasswordValid);

    if (!isPasswordValid) {
      throw new Error("Email hoặc mật khẩu không đúng");
    }

    // Update last active
    await user.update({
      last_active: new Date(),
    });

    // Generate token
    const token = generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
    });

    // Remove sensitive data
    const userResponse = user.toJSON();
    delete userResponse.password_hash;
    delete userResponse.reset_token;
    delete userResponse.reset_token_expires;

    return {
      user: userResponse,
      token,
    };
  }
  /**
   * Request password reset (send OTP)
   */
  async forgotPassword(email) {
    // Find user
    const user = await User.findOne({
      where: { email },
    });

    if (!user) {
      // Không tiết lộ email có tồn tại hay không (security)
      return {
        message: "Nếu email tồn tại, mã OTP đã được gửi đến email của bạn",
      };
    }

    // Generate OTP
    const otp = generateOTP(6);
    const otpExpiry = getOTPExpiry(10); // 10 minutes

    // Save OTP to database
    await user.update({
      reset_token: otp,
      reset_token_expires: otpExpiry,
    });

    // Send OTP email
    const emailSent = await emailService.sendPasswordResetOTP(
      email,
      otp,
      user.username
    );

    if (!emailSent) {
      console.error("Failed to send OTP email to:", email);
    }

    return {
      message: "Mã OTP đã được gửi đến email của bạn",
    };
  }

  /**
   * Reset password with OTP
   */
  async resetPassword(email, otp, newPassword) {
    // Find user
    const user = await User.findOne({
      where: { email },
    });

    if (!user) {
      throw new Error("Email không tồn tại");
    }

    // Check OTP
    if (!user.reset_token || user.reset_token !== otp) {
      throw new Error("Mã OTP không chính xác");
    }

    // Check OTP expiry
    if (isOTPExpired(user.reset_token_expires)) {
      throw new Error("Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới");
    }

    // Update password and clear OTP
    // Note: password_hash will be auto-hashed by beforeUpdate hook
    await user.update({
      password_hash: newPassword,
      reset_token: null,
      reset_token_expires: null,
    });

    return {
      message: "Mật khẩu đã được cập nhật thành công",
    };
  }

  /**
   * Get current user profile
   */
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
}

module.exports = new AuthService();
