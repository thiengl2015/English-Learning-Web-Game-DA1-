const { User, UserProgress, UserCurrency } = require("../models");
const { generateToken } = require("../utils/jwt.util");
const { hashPassword } = require("../utils/bcrypt.util");

class AuthService {
  /**
   * Register new user
   */
  async register(userData) {
    const { username, email, password } = userData;

    // Check if user already exists
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

    // Create user
    const user = await User.create({
      username,
      email,
      password_hash: password, // Will be hashed by model hook
    });

    // Create user progress
    await UserProgress.create({
      user_id: user.id,
    });

    // Create user currency
    await UserCurrency.create({
      user_id: user.id,
      crystals: 100, // Welcome bonus
      crowns: 0,
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
   * Login user
   */
  async login(email, password) {
    // Find user by email
    const user = await User.findOne({
      where: { email },
    });

    if (!user) {
      throw new Error("Email hoặc mật khẩu không đúng");
    }

    // Check if account is active
    if (user.status !== "Active") {
      throw new Error("Tài khoản đã bị vô hiệu hóa");
    }

    // Compare password
    const isPasswordValid = await user.comparePassword(password);

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
