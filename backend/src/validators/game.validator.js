const { body, param } = require("express-validator");

const startGameValidation = [
  body("game_config_id")
    .notEmpty()
    .withMessage("Game config ID không được để trống")
    .isInt({ min: 1 })
    .withMessage("Game config ID không hợp lệ"),
];

const submitAnswerValidation = [
  param("sessionId")
    .notEmpty()
    .withMessage("Session ID không được để trống")
    .isUUID()
    .withMessage("Session ID không hợp lệ"),

  body("question_index")
    .notEmpty()
    .withMessage("Question index không được để trống")
    .isInt({ min: 0 })
    .withMessage("Question index phải là số không âm"),

  body("answer").notEmpty().withMessage("Answer không được để trống"),
];

const completeGameValidation = [
  param("sessionId")
    .notEmpty()
    .withMessage("Session ID không được để trống")
    .isUUID()
    .withMessage("Session ID không hợp lệ"),

  body("time_spent")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Time spent phải là số không âm"),
];

module.exports = {
  startGameValidation,
  submitAnswerValidation,
  completeGameValidation,
};
