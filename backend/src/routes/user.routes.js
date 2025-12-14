const express = require("express");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");
const {
  uploadAvatar,
  handleUploadError,
} = require("../middlewares/upload.middleware");
const validate = require("../middlewares/validation.middleware");
const {
  updateProfileValidation,
  setLearningGoalsValidation,
  updateProgressValidation,
} = require("../validators/user.validator");

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/users/profile
 * @desc    Get user profile
 * @access  Private
 */
router.get("/profile", userController.getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put(
  "/profile",
  updateProfileValidation,
  validate,
  userController.updateProfile
);

/**
 * @route   POST /api/users/avatar
 * @desc    Upload user avatar
 * @access  Private
 */
router.post(
  "/avatar",
  uploadAvatar,
  handleUploadError,
  userController.uploadAvatar
);

/**
 * @route   PUT /api/users/learning-goals
 * @desc    Set learning goals
 * @access  Private
 */
router.put(
  "/learning-goals",
  setLearningGoalsValidation,
  validate,
  userController.setLearningGoals
);

/**
 * @route   GET /api/users/progress
 * @desc    Get user progress
 * @access  Private
 */
router.get("/progress", userController.getProgress);

/**
 * @route   PUT /api/users/progress
 * @desc    Update user progress
 * @access  Private
 */
router.put(
  "/progress",
  updateProgressValidation,
  validate,
  userController.updateProgress
);

/**
 * @route   GET /api/users/statistics
 * @desc    Get user statistics
 * @access  Private
 */
router.get("/statistics", userController.getStatistics);

module.exports = router;
