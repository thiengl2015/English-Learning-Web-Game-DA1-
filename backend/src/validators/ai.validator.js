const { body, param, query } = require("express-validator");

const startConversationValidation = [
  body("topic_id")
    .notEmpty()
    .withMessage("Topic ID không được để trống")
    .isString()
    .withMessage("Topic ID phải là string")
    .isIn(["daily-life", "travel", "food", "work", "hobbies", "general"])
    .withMessage("Topic ID không hợp lệ"),
];

const sendMessageValidation = [
  param("conversationId")
    .notEmpty()
    .withMessage("Conversation ID không được để trống")
    .isUUID()
    .withMessage("Conversation ID không hợp lệ"),

  body("message")
    .notEmpty()
    .withMessage("Message không được để trống")
    .isString()
    .withMessage("Message phải là string")
    .isLength({ min: 1, max: 1000 })
    .withMessage("Message phải từ 1-1000 ký tự"),
];

const endConversationValidation = [
  param("conversationId")
    .notEmpty()
    .withMessage("Conversation ID không được để trống")
    .isUUID()
    .withMessage("Conversation ID không hợp lệ"),

  body("duration_seconds")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Duration phải là số không âm"),
];

const generateQuestionsValidation = [
  body("lesson_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Lesson ID không hợp lệ"),

  body("vocab_ids")
    .optional()
    .isArray({ min: 3, max: 20 })
    .withMessage("Vocab IDs phải là mảng 3-20 phần tử"),

  body("question_count")
    .optional()
    .isInt({ min: 3, max: 10 })
    .withMessage("Question count phải từ 3-10"),

  body("difficulty")
    .optional()
    .isIn(["easy", "medium", "hard"])
    .withMessage("Difficulty không hợp lệ"),
];

const generateExplanationValidation = [
  body("vocab_id")
    .notEmpty()
    .withMessage("Vocab ID không được để trống")
    .isInt({ min: 1 })
    .withMessage("Vocab ID không hợp lệ"),

  body("type")
    .optional()
    .isIn(["usage", "grammar", "examples", "comparison"])
    .withMessage("Type không hợp lệ"),
];

module.exports = {
  startConversationValidation,
  sendMessageValidation,
  endConversationValidation,
  generateQuestionsValidation,
  generateExplanationValidation,
};
