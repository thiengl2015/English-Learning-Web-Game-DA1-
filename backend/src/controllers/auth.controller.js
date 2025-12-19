const userService = require("../services/user.service");
const { successResponse, errorResponse } = require("../utils/response.util");

class UserController {
  /**
   * @route   GET /api/users/profile
   * @desc    Get user profile
   * @access  Private
   */
  async getProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const profile = await userService.getProfile(userId);

      return successResponse(res, profile, "Lấy thông tin thành công");
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   PUT /api/users/profile
   * @desc    Update user profile
   * @access  Private
   */
  async updateProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const updateData = req.body;

      const updatedProfile = await userService.updateProfile(
        userId,
        updateData
      );

      return successResponse(
        res,
        updatedProfile,
        "Cập nhật thông tin thành công"
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/users/avatar
   * @desc    Upload user avatar
   * @access  Private
   */
  async uploadAvatar(req, res, next) {
    try {
      if (!req.file) {
        return errorResponse(res, "Vui lòng chọn file ảnh", 400);
      }

      const userId = req.user.id;
      const result = await userService.uploadAvatar(userId, req.file);

      return successResponse(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/users/progress
   * @desc    Get user progress
   * @access  Private
   */
  async getProgress(req, res, next) {
    try {
      const userId = req.user.id;
      const progress = await userService.getProgress(userId);

      return successResponse(res, progress, "Lấy tiến độ thành công");
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/users/xp
   * @desc    Add XP to user (for testing or after completing activities)
   * @access  Private
   */
  async addXP(req, res, next) {
    try {
      const userId = req.user.id;
      const { xp } = req.body;

      if (!xp || xp <= 0) {
        return errorResponse(res, "XP phải là số dương", 400);
      }

      const updatedProgress = await userService.addXP(userId, xp);

      return successResponse(
        res,
        updatedProgress,
        `Đã thêm ${xp} XP thành công`
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/users/statistics
   * @desc    Get user statistics
   * @access  Private
   */
  async getStatistics(req, res, next) {
    try {
      const userId = req.user.id;
      const stats = await userService.getStatistics(userId);

      return successResponse(res, stats, "Lấy thống kê thành công");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UserController();
