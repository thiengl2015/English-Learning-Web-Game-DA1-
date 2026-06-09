const feedbackService = require("../services/feedback.service");
const { successResponse, errorResponse } = require("../utils/response.util");

class FeedbackController {
  async createFeedback(req, res, next) {
    try {
      const feedback = await feedbackService.createFeedback(req.user, req.body);
      return successResponse(res, feedback, "Feedback submitted successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  async getMyFeedback(req, res, next) {
    try {
      const result = await feedbackService.getMyFeedback(req.user.id, req.query);
      return successResponse(res, result, "Feedback history loaded successfully");
    } catch (error) {
      next(error);
    }
  }

  async getAdminFeedback(req, res, next) {
    try {
      const result = await feedbackService.getAdminFeedback(req.query);
      return successResponse(res, result, "Feedback loaded successfully");
    } catch (error) {
      next(error);
    }
  }

  async getFeedbackStats(req, res, next) {
    try {
      const stats = await feedbackService.getFeedbackStats();
      return successResponse(res, stats, "Feedback statistics loaded successfully");
    } catch (error) {
      next(error);
    }
  }

  async updateFeedbackStatus(req, res, next) {
    try {
      const feedback = await feedbackService.updateFeedbackStatus(req.params.id, req.body.status);
      return successResponse(res, feedback, "Feedback status updated successfully");
    } catch (error) {
      if (error.statusCode) {
        return errorResponse(res, error.message, error.statusCode);
      }
      next(error);
    }
  }
}

module.exports = new FeedbackController();
