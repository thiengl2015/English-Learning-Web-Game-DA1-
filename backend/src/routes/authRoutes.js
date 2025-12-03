const express = require("express");
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  verifyEmail,
} = require("../src/controllers/authController.js");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.get("/verify-email", verifyEmail);

module.exports = router;
