const { body } = require("express-validator");

const completeLessonValidation = [
  body("correct_count")
    .notEmpty()
    .withMessage("Số câu đúng không được để trống")
    .isInt({ min: 0 })
    .withMessage("Số câu đúng phải là số không âm"),

  body("total_count")
    .notEmpty()
    .withMessage("Tổng số câu không được để trống")
    .isInt({ min: 1 })
    .withMessage("Tổng số câu phải lớn hơn 0"),

  body("time_spent")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Thời gian phải là số không âm"),
];

module.exports = {
  completeLessonValidation,
};
