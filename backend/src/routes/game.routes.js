const express = require("express");
const router = express.Router();
const gameController = require("../controllers/game.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");
const {
  startGameValidation,
  submitAnswerValidation,
  completeGameValidation,
} = require("../validators/game.validator");

router.use(authMiddleware);

/**
 * @route GET /api/games/types
 * @desc Get all game types
 * @access Private
 */
router.get("/types", gameController.getGameTypes);

/**
 * @route GET /api/games/history
 * @desc Get user's game history
 * @access Private
 */
router.get("/history", gameController.getGameHistory);

/**
 * @route GET /api/games/statistics
 * @desc Get user's game statistics
 * @access Private
 */
router.get("/statistics", gameController.getGameStatistics);

/**
 * @route GET /api/games/lesson/:lessonId
 * @desc Get games available for a lesson
 * @access Private
 */
router.get("/lesson/:lessonId", gameController.getGamesByLesson);

/**
 * @route POST /api/games/start
 * @desc Start a new game session
 * @access Private
 */
router.post("/start", startGameValidation, validate, gameController.startGame);

/**
 * @route POST /api/games/:gameConfigId/replay
 * @desc Replay a game
 * @access Private
 */
router.post("/:gameConfigId/replay", gameController.replayGame);

/**
 * @route GET /api/games/:sessionId/results
 * @desc Get game session results
 * @access Private
 */
router.get("/:sessionId/results", gameController.getGameResults);

/**
 * @route GET /api/games/:sessionId/wrong-answers
 * @desc Get wrong answers for a session
 * @access Private
 */
router.get("/:sessionId/wrong-answers", gameController.getWrongAnswers);

/**
 * @route POST /api/games/:sessionId/answer
 * @desc Submit answer for a question
 * @access Private
 */
router.post(
  "/:sessionId/answer",
  submitAnswerValidation,
  validate,
  gameController.submitAnswer
);

/**
 * @route POST /api/games/:sessionId/complete
 * @desc Complete a game session
 * @access Private
 */
router.post(
  "/:sessionId/complete",
  completeGameValidation,
  validate,
  gameController.completeGame
);

/**
 * @route POST /api/games/:sessionId/abandon
 * @desc Abandon a game
 * @access Private
 */
router.post("/:sessionId/abandon", gameController.abandonGame);

module.exports = router;
