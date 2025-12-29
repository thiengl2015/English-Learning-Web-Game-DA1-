const aiService = require("../services/ai.service");
const { successResponse, errorResponse } = require("../utils/response.util");

class AIController {
  /**
   * @route GET /api/ai/topics
   * @desc Get available conversation topics
   * @access Private
   */
  async getTopics(req, res, next) {
    try {
      const topics = aiService.getTopics();

      return successResponse(res, topics, "Lấy danh sách topics thành công");
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route POST /api/ai/conversations/start
   * @desc Start a new AI conversation
   * @access Private
   */
  async startConversation(req, res, next) {
    try {
      const userId = req.user.id;
      const { topic_id } = req.body;

      const result = await aiService.startConversation(userId, topic_id);

      return successResponse(
        res,
        result,
        "Conversation started successfully",
        201
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route POST /api/ai/conversations/:conversationId/message
   * @desc Send message in conversation
   * @access Private
   */
  async sendMessage(req, res, next) {
    try {
      const userId = req.user.id;
      const conversationId = req.params.conversationId;
      const { message } = req.body;

      const result = await aiService.sendMessage(
        conversationId,
        userId,
        message
      );

      return successResponse(res, result, "Message sent successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route GET /api/ai/conversations/:conversationId
   * @desc Get conversation history
   * @access Private
   */
  async getConversationHistory(req, res, next) {
    try {
      const userId = req.user.id;
      const conversationId = req.params.conversationId;

      const result = await aiService.getConversationHistory(
        conversationId,
        userId
      );

      return successResponse(
        res,
        result,
        "Lấy lịch sử conversation thành công"
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route POST /api/ai/conversations/:conversationId/end
   * @desc End a conversation
   * @access Private
   */
  async endConversation(req, res, next) {
    try {
      const userId = req.user.id;
      const conversationId = req.params.conversationId;
      const { duration_seconds } = req.body;

      const result = await aiService.endConversation(
        conversationId,
        userId,
        duration_seconds
      );

      return successResponse(res, result, "Conversation ended successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route GET /api/ai/conversations
   * @desc Get user's conversation list
   * @access Private
   */
  async getUserConversations(req, res, next) {
    try {
      const userId = req.user.id;
      const filters = req.query;

      const result = await aiService.getUserConversations(userId, filters);

      return successResponse(
        res,
        result,
        "Lấy danh sách conversations thành công"
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route GET /api/ai/recommendations
   * @desc Get personalized learning recommendations
   * @access Private
   */
  async getRecommendations(req, res, next) {
    try {
      const userId = req.user.id;

      const recommendations = await aiService.getRecommendations(userId);

      return successResponse(
        res,
        recommendations,
        "Lấy recommendations thành công"
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route POST /api/ai/practice-questions
   * @desc Generate AI practice questions
   * @access Private
   */
  async generatePracticeQuestions(req, res, next) {
    try {
      const userId = req.user.id;
      const options = req.body;

      const result = await aiService.generatePracticeQuestions(userId, options);

      return successResponse(
        res,
        result,
        "Generated practice questions successfully",
        201
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route POST /api/ai/vocabulary/explanation
   * @desc Generate explanation for vocabulary
   * @access Private
   */
  async generateExplanation(req, res, next) {
    try {
      const { vocab_id, type } = req.body;

      const result = await aiService.generateExplanation(vocab_id, type);

      return successResponse(res, result, "Generated explanation successfully");
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route GET /api/ai/analysis
   * @desc Analyze user's learning progress
   * @access Private
   */
  async analyzeProgress(req, res, next) {
    try {
      const userId = req.user.id;

      const analysis = await aiService.analyzeUserProgress(userId);

      return successResponse(
        res,
        analysis,
        "Phân tích tiến độ học tập thành công"
      );
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AIController();
