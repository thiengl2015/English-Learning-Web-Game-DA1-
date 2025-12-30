const express = require("express");
const router = express.Router();
const unitController = require("../controllers/unit.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");
const vocabularyController = require("../controllers/vocabulary.controller");

router.use(authMiddleware);

/**
 * @route   GET /api/units
 * @desc    Get all units with user progress
 * @access  Private
 */
router.get("/", unitController.getAllUnits);

/**
 * @route   GET /api/units/:id
 * @desc    Get single unit details
 * @access  Private
 */
router.get("/:id", unitController.getUnitById);

/**
 * @route   GET /api/units/:id/lessons
 * @desc    Get all lessons within a unit
 * @access  Private
 */
router.get("/:id/lessons", unitController.getLessonsByUnit);


/**
 * @route   GET /api/units/:id/statistics
 * @desc    Get unit statistics
 * @access  Private
 */
router.get("/:id/statistics", unitController.getUnitStatistics);

/**
 * @route   GET /api/units/:unitId/vocabulary
 * @desc    Get vocabulary by unit
 * @access  Private
 */
router.get("/:unitId/vocabulary", vocabularyController.getVocabularyByUnit);

module.exports = router;