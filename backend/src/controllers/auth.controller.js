const authService = require("../services/auth.service");
const { successResponse, errorResponse } = require("../utils/response.util");

class AuthController {
  /**
   * @route   POST /api/auth/register
   * @desc    Register new user
   * @access  Public
   */
  async register(req, res, next) {
    try {
      const {
        username,
        email,
        password,
        display_name,
        native_language,
        current_level,
        learning_goal,
        daily_goal,
      } = req.body;

      const result = await authService.register({
        username,
        email,
        password,
        display_name,
        native_language,
        current_level,
        learning_goal,
        daily_goal,
      });

      return successResponse(res, result, "Đăng ký thành công", 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/auth/login
   * @desc    Login user
   * @access  Public
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;

      const result = await authService.login(email, password);

      return successResponse(res, result, "Đăng nhập thành công");
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/auth/logout
   * @desc    Logout user
   * @access  Private
   */
  async logout(req, res, next) {
    try {
      // With JWT, logout is handled on client side
      // Just return success message
      // Optional: Can implement token blacklist if needed

      return successResponse(res, null, "Đăng xuất thành công");
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/auth/forgot-password
   * @desc    Send OTP to email for password reset
   * @access  Public
   */
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;

      const result = await authService.forgotPassword(email);

      return successResponse(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/auth/reset-password
   * @desc    Reset password with OTP
   * @access  Public
   */
  async resetPassword(req, res, next) {
    try {
      const { email, otp, newPassword } = req.body;

      const result = await authService.resetPassword(email, otp, newPassword);

      return successResponse(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/auth/me
   * @desc    Get current user profile
   * @access  Private
   */
  async getMe(req, res, next) {
    try {
      const user = await authService.getProfile(req.user.id);

      return successResponse(res, user, "Lấy thông tin thành công");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();
