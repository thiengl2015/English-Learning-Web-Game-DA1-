const express = require("express");
const router = express.Router();
const aiController = require("../controllers/ai.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");
const {
  startConversationValidation,
  sendMessageValidation,
  endConversationValidation,
  generateQuestionsValidation,
  generateExplanationValidation,
} = require("../validators/ai.validator");

// All routes require authentication
router.use(authMiddleware);

/**
 * @route GET /api/ai/topics
 * @desc Get available conversation topics
 * @access Private
 */
router.get("/topics", aiController.getTopics);

/**
 * @route GET /api/ai/recommendations
 * @desc Get personalized recommendations
 * @access Private
 */
router.get("/recommendations", aiController.getRecommendations);

/**
 * @route GET /api/ai/analysis
 * @desc Analyze user's learning progress
 * @access Private
 */
router.get("/analysis", aiController.analyzeProgress);

/**
 * @route GET /api/ai/conversations
 * @desc Get user's conversation list
 * @access Private
 */
router.get("/conversations", aiController.getUserConversations);

/**
 * @route POST /api/ai/conversations/start
 * @desc Start a new conversation
 * @access Private
 */
router.post(
  "/conversations/start",
  startConversationValidation,
  validate,
  aiController.startConversation
);

/**
 * @route GET /api/ai/conversations/:conversationId
 * @desc Get conversation history
 * @access Private
 */
router.get(
  "/conversations/:conversationId",
  aiController.getConversationHistory
);

/**
 * @route POST /api/ai/conversations/:conversationId/message
 * @desc Send message in conversation
 * @access Private
 */
router.post(
  "/conversations/:conversationId/message",
  sendMessageValidation,
  validate,
  aiController.sendMessage
);

/**
 * @route POST /api/ai/conversations/:conversationId/end
 * @desc End a conversation
 * @access Private
 */
router.post(
  "/conversations/:conversationId/end",
  endConversationValidation,
  validate,
  aiController.endConversation
);

/**
 * @route POST /api/ai/practice-questions
 * @desc Generate AI practice questions
 * @access Private
 */
router.post(
  "/practice-questions",
  generateQuestionsValidation,
  validate,
  aiController.generatePracticeQuestions
);

/**
 * @route POST /api/ai/vocabulary/explanation
 * @desc Generate vocabulary explanation
 * @access Private
 */
router.post(
  "/vocabulary/explanation",
  generateExplanationValidation,
  validate,
  aiController.generateExplanation
);

module.exports = router;
