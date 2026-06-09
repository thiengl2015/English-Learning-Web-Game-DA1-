const challengeService = require("../services/challenge.service");

const challengeController = {
  async getChallenge(req, res) {
    try {
      const { unitId } = req.params;
      const challenge = await challengeService.getChallenge(unitId);

      res.json({
        success: true,
        data: challenge,
      });
    } catch (error) {
      console.error("getChallenge error:", error);
      const status = error.message.includes("not found") ? 404 : 500;
      res.status(status).json({
        success: false,
        message: error.message,
      });
    }
  },

  async startChallenge(req, res) {
    try {
      const userId = req.user.id;
      const { unitId } = req.params;
      const result = await challengeService.startSession(userId, unitId);

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("startChallenge error:", error);
      const status = error.message.includes("not found") ? 404 : 500;
      res.status(status).json({
        success: false,
        message: error.message,
      });
    }
  },

  async submitChallenge(req, res) {
    try {
      const userId = req.user.id;
      const { unitId } = req.params;
      const { sessionId, answers, timeSpentSeconds } = req.body;

      const result = await challengeService.submitChallenge(
        sessionId,
        userId,
        unitId,
        answers,
        timeSpentSeconds || 0
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("submitChallenge error:", error);
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

  async getResult(req, res) {
    try {
      const userId = req.user.id;
      const { unitId, sessionId } = req.params;
      const result = await challengeService.getResult(
        parseInt(sessionId, 10),
        userId,
        unitId
      );

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("getChallengeResult error:", error);
      const status = error.message.includes("not found") ? 404 : 500;
      res.status(status).json({
        success: false,
        message: error.message,
      });
    }
  },

  async getHistory(req, res) {
    try {
      const userId = req.user.id;
      const { limit = 10, page = 1 } = req.query;
      const result = await challengeService.getHistory(userId, {
        limit: parseInt(limit, 10),
        page: parseInt(page, 10),
      });

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      console.error("getChallengeHistory error:", error);
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  },
};

module.exports = challengeController;
