const express = require("express");
const router = express.Router();
const vocabularyController = require("../controllers/vocabulary.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");
const {
  updateProgressValidation,
  searchValidation,
} = require("../validators/vocabulary.validator");

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/vocabulary/favorites
 * @desc    Get user's favorite vocabulary
 * @access  Private
 */
router.get("/favorites", vocabularyController.getFavoriteVocabulary);

/**
 * @route   GET /api/vocabulary/statistics
 * @desc    Get vocabulary statistics
 * @access  Private
 */
router.get("/statistics", vocabularyController.getStatistics);

/**
 * @route   GET /api/vocabulary
 * @desc    Get all vocabulary with filters
 * @access  Private
 */
router.get(
  "/",
  searchValidation,
  validate,
  vocabularyController.getAllVocabulary
);

/**
 * @route   GET /api/vocabulary/:id
 * @desc    Get vocabulary by ID
 * @access  Private
 */
router.get("/:id", vocabularyController.getVocabularyById);

/**
 * @route   POST /api/vocabulary/:id/favorite
 * @desc    Mark vocabulary as favorite
 * @access  Private
 */
router.post("/:id/favorite", vocabularyController.markFavorite);

/**
 * @route   DELETE /api/vocabulary/:id/favorite
 * @desc    Unmark vocabulary as favorite
 * @access  Private
 */
router.delete("/:id/favorite", vocabularyController.unmarkFavorite);

/**
 * @route   PUT /api/vocabulary/:id/progress
 * @desc    Update vocabulary progress
 * @access  Private
 */
router.put(
  "/:id/progress",
  updateProgressValidation,
  validate,
  vocabularyController.updateProgress
);

module.exports = router;
