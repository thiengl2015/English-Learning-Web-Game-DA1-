const { body } = require("express-validator");

const updateProfileValidation = [
  body("username")
    .optional()
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage("Username phải từ 3-50 ký tự")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username chỉ chứa chữ cái, số và dấu gạch dưới"),

  body("email")
    .optional()
    .trim()
    .isEmail()
    .withMessage("Email không hợp lệ")
    .normalizeEmail(),
];

const setLearningGoalsValidation = [
  body("daily_goal_minutes")
    .notEmpty()
    .withMessage("Mục tiêu học tập hàng ngày không được để trống")
    .isInt({ min: 5, max: 180 })
    .withMessage("Mục tiêu phải từ 5-180 phút"),
];

const updateProgressValidation = [
  body("study_time")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Thời gian học phải là số dương"),

  body("words_learned")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Số từ học phải là số dương"),

  body("units_completed")
    .optional()
    .isInt({ min: 0 })
    .withMessage("Số unit hoàn thành phải là số dương"),
];

module.exports = {
  updateProfileValidation,
  setLearningGoalsValidation,
  updateProgressValidation,
};
