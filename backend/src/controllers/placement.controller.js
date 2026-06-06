const placementService = require("../services/placement.service");

const placementController = {
  /**
   * GET /api/placement/topics?age=12
   * Get available topics for a given age.
   */
  async getTopics(req, res) {
    try {
      const { age } = req.query;
      const userId = req.user?.id || null;

      if (!age) {
        return res.status(400).json({
          success: false,
          message: "Age query parameter is required.",
        });
      }

      const topics = await placementService.getTopics(userId, parseInt(age, 10));

      res.json({
        success: true,
        data: topics,
      });
    } catch (error) {
      console.error("getTopics error:", error);
      res.status(400).json({
        success: false,
        message: error.message,
      });
    }
  },

  /**
   * POST /api/placement/generate
   * Generate an AI placement test.
   */
  async generateTest(req, res) {
    try {
      const userId = req.user.id;
      const { level, age, topicSlugs } = req.body;

      const result = await placementService.generateTest(userId, {
        level,
        age: parseInt(age, 10),
        topicSlugs,
      });

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("generateTest error:", error);
      const status = error.message.includes("Invalid") ? 400 : 500;
      res.status(status).json({
        success: false,
        message: error.message,
      });
    }
  },

  /**
   * POST /api/placement/:sessionId/submit
   * Submit test answers and get score.
   */
  async submitTest(req, res) {
    try {
      const userId = req.user.id;
      const { sessionId } = req.params;
      const { answers } = req.body;

      const result = await placementService.submitTest(sessionId, userId, answers);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("submitTest error:", error);
      const status = error.message.includes("not found") ? 404 : 400;
      res.status(status).json({
        success: false,
        message: error.message,
      });
    }
  },

  /**
   * GET /api/placement/:sessionId/result
   * Get detailed result of a placement test.
   */
  async getResult(req, res) {
    try {
      const userId = req.user.id;
      const { sessionId } = req.params;

      const result = await placementService.getResult(sessionId, userId);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("getResult error:", error);
      res.status(404).json({
        success: false,
        message: error.message,
      });
    }
  },

  /**
   * GET /api/placement/history
   * Get user's placement test history.
   */
  async getHistory(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 10, page = 1 } = req.query;

      const result = await placementService.getHistory(userId, {
        limit: parseInt(limit, 10),
        page: parseInt(page, 10),
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("getHistory error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
};

module.exports = placementController;
