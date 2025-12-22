const { body, query } = require("express-validator");

const updateProgressValidation = [
  body("correct").optional().isBoolean().withMessage("Correct phải là boolean"),

  body("mastery_level")
    .optional()
    .isInt({ min: 0, max: 5 })
    .withMessage("Mastery level phải từ 0-5"),
];

const searchValidation = [
  query("search")
    .optional()
    .trim()
    .isLength({ min: 1 })
    .withMessage("Search query không được rỗng"),

  query("level")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Level phải là số dương"),

  query("unit_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Unit ID phải là số dương"),

  query("lesson_id")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Lesson ID phải là số dương"),
];

module.exports = {
  updateProgressValidation,
  searchValidation,
};
