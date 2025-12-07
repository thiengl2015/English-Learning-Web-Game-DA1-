const express = require("express");
const router = express.Router();

// Import route modules
const authRoutes = require("./auth.routes");

// API Routes
router.use("/auth", authRoutes);

// API documentation endpoint
router.get("/", (req, res) => {
  res.json({
    success: true,
    message: "English Learning API v1.0",
    endpoints: {
      auth: {
        register: "POST /api/auth/register",
        login: "POST /api/auth/login",
        logout: "POST /api/auth/logout",
        forgotPassword: "POST /api/auth/forgot-password",
        resetPassword: "POST /api/auth/reset-password",
        getProfile: "GET /api/auth/me",
      },
    },
  });
});

module.exports = router;
