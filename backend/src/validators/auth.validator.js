const { body } = require("express-validator");

const registerValidation = [
  body("username")
    .trim()
    .notEmpty()
    .withMessage("Username không được để trống")
    .isLength({ min: 3, max: 50 })
    .withMessage("Username phải từ 3-50 ký tự")
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage("Username chỉ chứa chữ cái, số và dấu gạch dưới"),

  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email không được để trống")
    .isEmail()
    .withMessage("Email không hợp lệ")
    .normalizeEmail(),

  body("password")
    .notEmpty()
    .withMessage("Mật khẩu không được để trống")
    .isLength({ min: 6 })
    .withMessage("Mật khẩu phải có ít nhất 6 ký tự")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số"),

  body("confirmPassword")
    .notEmpty()
    .withMessage("Xác nhận mật khẩu không được để trống")
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error("Mật khẩu xác nhận không khớp");
      }
      return true;
    }),
];

/**
 * Validation rules for login
 */
const loginValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email không được để trống")
    .isEmail()
    .withMessage("Email không hợp lệ")
    .normalizeEmail(),

  body("password").notEmpty().withMessage("Mật khẩu không được để trống"),
];

/**
 * Validation rules for forgot password
 */
const forgotPasswordValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email không được để trống")
    .isEmail()
    .withMessage("Email không hợp lệ")
    .normalizeEmail(),
];

/**
 * Validation rules for reset password
 */
const resetPasswordValidation = [
  body("email")
    .trim()
    .notEmpty()
    .withMessage("Email không được để trống")
    .isEmail()
    .withMessage("Email không hợp lệ")
    .normalizeEmail(),

  body("otp")
    .trim()
    .notEmpty()
    .withMessage("Mã OTP không được để trống")
    .isLength({ min: 6, max: 6 })
    .withMessage("Mã OTP phải có 6 ký tự")
    .isNumeric()
    .withMessage("Mã OTP chỉ chứa số"),

  body("newPassword")
    .notEmpty()
    .withMessage("Mật khẩu mới không được để trống")
    .isLength({ min: 6 })
    .withMessage("Mật khẩu phải có ít nhất 6 ký tự")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage("Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số"),

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
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
};
