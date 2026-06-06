const express = require("express");
const router = express.Router();
const placementController = require("../controllers/placement.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");
const { generateTestSchema, submitTestSchema } = require("../validators/placement.validator");

/**
 * @route GET /api/placement/topics?age=12
 * @desc Get available placement topics filtered by age
 * @access Public (optional auth for personalized filter)
 */
router.get("/topics", placementController.getTopics);

/**
 * @route POST /api/placement/generate
 * @desc Generate an AI placement test
 * @access Private (requires authentication)
 */
router.post(
  "/generate",
  authMiddleware,
  validate(generateTestSchema),
  placementController.generateTest
);

/**
 * @route POST /api/placement/:sessionId/submit
 * @desc Submit test answers and get score
 * @access Private
 */
router.post(
  "/:sessionId/submit",
  authMiddleware,
  validate(submitTestSchema),
  placementController.submitTest
);

/**
 * @route GET /api/placement/:sessionId/result
 * @desc Get detailed result of a placement test
 * @access Private
 */
router.get("/:sessionId/result", authMiddleware, placementController.getResult);

/**
 * @route GET /api/placement/history
 * @desc Get user's placement test history
 * @access Private
 */
router.get("/history", authMiddleware, placementController.getHistory);

module.exports = router;
