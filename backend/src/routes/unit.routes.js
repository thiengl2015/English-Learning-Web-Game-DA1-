const express = require("express");
const router = express.Router();
const unitController = require("../controllers/unit.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

router.use(authMiddleware);

/**
 * @route   GET /api/units
 * @desc    Get all units with user progress
 * @access  Private
 */
router.get("/", unitController.getAllUnits);

/**
 * @route   GET /api/units/:id
 * @desc    Get single unit with lessons
 * @access  Private
 */
router.get("/:id", unitController.getUnitById);

/**
 * @route   GET /api/units/:id/statistics
 * @desc    Get unit statistics
 * @access  Private
 */
router.get("/:id/statistics", unitController.getUnitStatistics);

module.exports = router;
