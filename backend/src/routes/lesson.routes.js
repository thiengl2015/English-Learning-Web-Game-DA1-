const express = require("express");
const router = express.Router();
const lessonController = require("../controllers/lesson.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");
const { completeLessonValidation } = require("../validators/lesson.validator");
const vocabularyController = require("../controllers/vocabulary.controller");
// All routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/lessons/progress
 * @desc    Get user's all lesson progress
 * @access  Private
 */
router.get("/progress", lessonController.getUserLessonProgress);

/**
 * @route   GET /api/lessons/:id
 * @desc    Get lesson details
 * @access  Private
 */
router.get("/:id", lessonController.getLessonById);

/**
 * @route   POST /api/lessons/:id/start
 * @desc    Start a lesson
 * @access  Private
 */
router.post("/:id/start", lessonController.startLesson);

/**
 * @route   POST /api/lessons/:id/complete
 * @desc    Complete a lesson
 * @access  Private
 */
router.post(
  "/:id/complete",
  completeLessonValidation,
  validate,
  lessonController.completeLesson
);

/**
 * @route   GET /api/lessons/:id/statistics
 * @desc    Get lesson statistics
 * @access  Private
 */
router.get("/:id/statistics", lessonController.getLessonStatistics);

/**
 * @route   GET /api/lessons/:lessonId/vocabulary
 * @desc    Get vocabulary by lesson
 * @access  Private
 */
router.get("/:lessonId/vocabulary", vocabularyController.getVocabularyByLesson);

module.exports = router;
