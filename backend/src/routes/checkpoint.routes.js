const express = require("express");
const router = express.Router();
const checkpointController = require("../controllers/checkpoint.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");
const {
  startCheckpointSchema,
  submitCheckpointSchema,
} = require("../validators/checkpoint.validator");

/**
 * @route GET /api/checkpoints
 * @desc Get list of all checkpoints
 * @access Public
 */
router.get("/", checkpointController.getCheckpoints);

/**
 * @route GET /api/checkpoints/history
 * @desc Get user's checkpoint history
 * @access Private
 */
router.get("/history", authMiddleware, checkpointController.getHistory);

/**
 * @route GET /api/checkpoints/:id
 * @desc Get checkpoint questions (without answers)
 * @access Public
 */
router.get("/:id", checkpointController.getCheckpoint);

/**
 * @route GET /api/checkpoints/:id/questions
 * @desc Get checkpoint questions (alias for :id)
 * @access Public
 */
router.get("/:id/questions", checkpointController.getCheckpoint);

/**
 * @route POST /api/checkpoints/:id/start
 * @desc Start a checkpoint session
 * @access Private
 */
router.post(
  "/:id/start",
  authMiddleware,
  validate(startCheckpointSchema),
  checkpointController.startCheckpoint
);

/**
 * @route POST /api/checkpoints/:id/submit
 * @desc Submit checkpoint answers and get score
 * @access Private
 */
router.post(
  "/:id/submit",
  authMiddleware,
  validate(submitCheckpointSchema),
  checkpointController.submitCheckpoint
);

/**
 * @route GET /api/checkpoints/:id/result/:sessionId
 * @desc Get checkpoint result details
 * @access Private
 */
router.get("/:id/result/:sessionId", authMiddleware, checkpointController.getResult);

module.exports = router;
