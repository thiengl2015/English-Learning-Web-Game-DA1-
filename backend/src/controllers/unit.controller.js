const unitService = require("../services/unit.service");
const { successResponse, errorResponse } = require("../utils/response.util");

class UnitController {
  /**
   * @route   GET /api/units
   * @desc    Get all units with user progress
   * @access  Private
   */
  async getAllUnits(req, res, next) {
    try {
      const userId = req.user.id;
      const units = await unitService.getAllUnits(userId);

      return successResponse(res, units, "Lấy danh sách units thành công");
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/units/:id
   * @desc    Get single unit with lessons and progress
   * @access  Private
   */
  async getUnitById(req, res, next) {
    try {
      const userId = req.user.id;
      const unitId = req.params.id;

      const unit = await unitService.getUnitById(unitId, userId);

      return successResponse(res, unit, "Lấy thông tin unit thành công");
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/units/:id/statistics
   * @desc    Get unit statistics for user
   * @access  Private
   */
  async getUnitStatistics(req, res, next) {
    try {
      const userId = req.user.id;
      const unitId = req.params.id;

      const stats = await unitService.getUnitStatistics(unitId, userId);

      return successResponse(res, stats, "Lấy thống kê unit thành công");
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/units/:id/lessons
   * @desc    Get all lessons for a specific unit
   * @access  Private
   */
  async getLessonsByUnit(req, res, next) {
    try {
      const userId = req.user.id;
      const unitId = req.params.id;
      
      // Gọi service (đảm bảo bạn đã update service như bước trước)
      const lessons = await unitService.getLessonsByUnit(unitId, userId);
      
      return successResponse(res, lessons, "Lấy danh sách bài học thành công");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new UnitController();
