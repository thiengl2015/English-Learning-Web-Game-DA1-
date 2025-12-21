const lessonService = require("../services/lesson.service");
const { successResponse, errorResponse } = require("../utils/response.util");

class LessonController {
  /**
   * @route   GET /api/lessons/:id
   * @desc    Get lesson by ID with details
   * @access  Private
   */
  async getLessonById(req, res, next) {
    try {
      const userId = req.user.id;
      const lessonId = req.params.id;

      const lesson = await lessonService.getLessonById(lessonId, userId);

      return successResponse(res, lesson, "Lấy thông tin lesson thành công");
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/lessons/:id/start
   * @desc    Start a lesson
   * @access  Private
   */
  async startLesson(req, res, next) {
    try {
      const userId = req.user.id;
      const lessonId = req.params.id;

      const result = await lessonService.startLesson(lessonId, userId);

      return successResponse(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/lessons/:id/complete
   * @desc    Complete a lesson
   * @access  Private
   */
  async completeLesson(req, res, next) {
    try {
      const userId = req.user.id;
      const lessonId = req.params.id;
      const completionData = req.body;

      const result = await lessonService.completeLesson(
        lessonId,
        userId,
        completionData
      );

      return successResponse(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/lessons/progress
   * @desc    Get user's all lesson progress
   * @access  Private
   */
  async getUserLessonProgress(req, res, next) {
    try {
      const userId = req.user.id;

      const progress = await lessonService.getUserLessonProgress(userId);

      return successResponse(res, progress, "Lấy tiến độ lessons thành công");
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/lessons/:id/statistics
   * @desc    Get lesson statistics for user
   * @access  Private
   */
  async getLessonStatistics(req, res, next) {
    try {
      const userId = req.user.id;
      const lessonId = req.params.id;

      const stats = await lessonService.getLessonStatistics(lessonId, userId);

      return successResponse(res, stats, "Lấy thống kê lesson thành công");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new LessonController();
