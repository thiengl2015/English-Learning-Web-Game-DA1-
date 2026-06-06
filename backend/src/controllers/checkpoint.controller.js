const checkpointService = require("../services/checkpoint.service");

const checkpointController = {
  /**
   * GET /api/checkpoints
   * Lay danh sach checkpoint
   */
  async getCheckpoints(req, res) {
    try {
      const checkpoints = await checkpointService.getCheckpoints();

      res.json({
        success: true,
        data: checkpoints,
      });
    } catch (error) {
      console.error("getCheckpoints error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },

  /**
   * GET /api/checkpoints/:id
   * Lay cau hoi checkpoint (khong dap an)
   */
  async getCheckpoint(req, res) {
    try {
      const { id } = req.params;

      const checkpoint = await checkpointService.getCheckpoint(id);

      res.json({
        success: true,
        data: checkpoint,
      });
    } catch (error) {
      console.error("getCheckpoint error:", error);
      const status = error.message.includes("not found") ? 404 : 500;
      res.status(status).json({
        success: false,
        message: error.message,
      });
    }
  },

  /**
   * POST /api/checkpoints/:id/start
   * Bat dau lam bai checkpoint
   */
  async startCheckpoint(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const result = await checkpointService.startSession(userId, id);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("startCheckpoint error:", error);
      const status = error.message.includes("not found") ? 404 : 500;
      res.status(status).json({
        success: false,
        message: error.message,
      });
    }
  },

  /**
   * POST /api/checkpoints/:id/submit
   * Nop bai checkpoint va cham diem
   */
  async submitCheckpoint(req, res) {
    try {
      const userId = req.user.id;
      const { id } = req.params;
      const { sessionId, answers, timeSpentSeconds } = req.body;

      const result = await checkpointService.submitCheckpoint(
        sessionId,
        userId,
        answers,
        timeSpentSeconds || 0
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("submitCheckpoint error:", error);
      const status = error.message.includes("not found")
        ? 404
        : error.message.includes("already been submitted")
        ? 400
        : 500;
      res.status(status).json({
        success: false,
        message: error.message,
      });
    }
  },

  /**
   * GET /api/checkpoints/:id/result/:sessionId
   * Lay ket qua checkpoint
   */
  async getResult(req, res) {
    try {
      const userId = req.user.id;
      const { sessionId } = req.params;

      const result = await checkpointService.getResult(
        parseInt(sessionId, 10),
        userId
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("getResult error:", error);
      const status = error.message.includes("not found") ? 404 : 500;
      res.status(status).json({
        success: false,
        message: error.message,
      });
    }
  },

  /**
   * GET /api/checkpoints/history
   * Lay lich su checkpoint cua user
   */
  async getHistory(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 10, page = 1 } = req.query;

      const result = await checkpointService.getHistory(userId, {
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

module.exports = checkpointController;
