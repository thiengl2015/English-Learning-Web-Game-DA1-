const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");
const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
} = require("../validators/auth.validator");

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post("/register", registerValidation, validate, authController.register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post("/login", loginValidation, validate, authController.login);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post("/logout", authMiddleware, authController.logout);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send OTP for password reset
 * @access  Public
 */
router.post(
  "/forgot-password",
  forgotPasswordValidation,
  validate,
  authController.forgotPassword
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with OTP
 * @access  Public
 */
router.post(
  "/reset-password",
  resetPasswordValidation,
  validate,
  authController.resetPassword
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get("/me", authMiddleware, authController.getMe);

module.exports = router;
