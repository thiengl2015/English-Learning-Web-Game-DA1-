const express = require("express");
const router = express.Router();
const challengeController = require("../controllers/challenge.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");
const {
  startChallengeSchema,
  submitChallengeSchema,
} = require("../validators/challenge.validator");

router.use(authMiddleware);

/**
 * @route GET /api/challenges/history
 * @desc Get user's challenge history
 * @access Private
 */
router.get("/history", challengeController.getHistory);

/**
 * @route GET /api/challenges/unit/:unitId
 * @desc Get unit challenge questions without answers
 * @access Private
 */
router.get("/unit/:unitId", challengeController.getChallenge);

/**
 * @route POST /api/challenges/unit/:unitId/start
 * @desc Start a unit challenge session
 * @access Private
 */
router.post(
  "/unit/:unitId/start",
  validate(startChallengeSchema),
  challengeController.startChallenge
);

/**
 * @route POST /api/challenges/unit/:unitId/submit
 * @desc Submit unit challenge answers and apply full-star skip on pass
 * @access Private
 */
router.post(
  "/unit/:unitId/submit",
  validate(submitChallengeSchema),
  challengeController.submitChallenge
);

/**
 * @route GET /api/challenges/unit/:unitId/result/:sessionId
 * @desc Get unit challenge result details
 * @access Private
 */
router.get("/unit/:unitId/result/:sessionId", challengeController.getResult);

module.exports = router;
