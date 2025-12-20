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

  body("display_name")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Tên hiển thị phải từ 1-100 ký tự"),

  body("native_language")
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage("Ngôn ngữ không hợp lệ"),
  body("current_level")
    .optional()
    .isIn(["beginner", "intermediate", "advanced"])
    .withMessage("Cấp độ không hợp lệ"),
  body("learning_goal")
    .optional()
    .isIn(["travel", "work", "ielts", "toeic", "daily", "academic"])
    .withMessage("Mục tiêu không hợp lệ"),
  body("daily_goal")
    .optional()
    .isInt({ min: 5, max: 180 })
    .withMessage("Mục tiêu hàng ngày phải từ 5-180 phút"),
];

const addXPValidation = [
  body("xp")
    .notEmpty()
    .withMessage("XP không được để trống")
    .isInt({ min: 1 })
    .withMessage("XP phải là số dương"),
];

const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Mật khẩu hiện tại không được để trống"),

  body("newPassword")
    .notEmpty()
    .withMessage("Mật khẩu mới không được để trống")
    .isLength({ min: 6 })
    .withMessage("Mật khẩu mới phải có ít nhất 6 ký tự")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage(
      "Mật khẩu mới phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số"
    )
    .custom((value, { req }) => {
      if (value === req.body.currentPassword) {
        throw new Error("Mật khẩu mới không được trùng với mật khẩu hiện tại");
      }
      return true;
    }),

  body("confirmPassword")
    .notEmpty()
    .withMessage("Xác nhận mật khẩu không được để trống")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Mật khẩu xác nhận không khớp");
      }
      return true;
    }),
];

module.exports = {
  updateProfileValidation,
  addXPValidation,
  changePasswordValidation,
};
