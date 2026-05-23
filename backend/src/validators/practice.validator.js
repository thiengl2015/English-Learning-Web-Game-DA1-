const { body, param } = require("express-validator");

const modeValidation = [
  param("mode")
    .isIn(["listen-fill", "listen-repeat", "read-answer", "read-story"])
    .withMessage("Invalid practice mode"),
];

const slugValidation = [
  ...modeValidation,
  param("slug")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Invalid practice topic slug"),
];

const completeAttemptValidation = [
  param("attemptId").isUUID().withMessage("Invalid attempt ID"),
  body("correctCount").isInt({ min: 0 }).withMessage("correctCount must be a non-negative integer"),
  body("totalCount").isInt({ min: 1 }).withMessage("totalCount must be a positive integer"),
  body("completedItems").isInt({ min: 0 }).withMessage("completedItems must be a non-negative integer"),
  body("timeSpent").optional().isInt({ min: 0 }).withMessage("timeSpent must be a non-negative integer"),
  body("answers").optional(),
];

module.exports = {
  modeValidation,
  slugValidation,
  completeAttemptValidation,
};
