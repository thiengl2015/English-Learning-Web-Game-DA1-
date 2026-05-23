const practiceService = require("../services/practice.service");
const { successResponse, errorResponse } = require("../utils/response.util");

class PracticeController {
  async getModes(req, res, next) {
    try {
      return successResponse(res, practiceService.getModes(), "Practice modes loaded");
    } catch (error) {
      next(error);
    }
  }

  async getTopics(req, res, next) {
    try {
      const topics = await practiceService.getTopics(req.params.mode, req.user.id);
      return successResponse(res, topics, "Practice topics loaded");
    } catch (error) {
      next(error);
    }
  }

  async getTopicDetail(req, res, next) {
    try {
      const detail = await practiceService.getTopicDetail(
        req.params.mode,
        req.params.slug,
        req.user.id
      );
      return successResponse(res, detail, "Practice topic loaded");
    } catch (error) {
      if (error.message.includes("not found")) {
        return errorResponse(res, error.message, 404);
      }
      next(error);
    }
  }

  async startAttempt(req, res, next) {
    try {
      const result = await practiceService.startAttempt(
        req.params.mode,
        req.params.slug,
        req.user.id
      );
      return successResponse(res, result, "Practice attempt started", 201);
    } catch (error) {
      if (error.message.includes("not found")) {
        return errorResponse(res, error.message, 404);
      }
      next(error);
    }
  }

  async completeAttempt(req, res, next) {
    try {
      const result = await practiceService.completeAttempt(
        req.params.attemptId,
        req.user.id,
        req.body
      );
      return successResponse(res, result, "Practice attempt completed");
    } catch (error) {
      if (error.message.includes("not found")) {
        return errorResponse(res, error.message, 404);
      }
      if (error.message.includes("not active")) {
        return errorResponse(res, error.message, 409);
      }
      next(error);
    }
  }
}

module.exports = new PracticeController();
