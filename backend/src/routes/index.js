const express = require("express");
const router = express.Router();

// Import route modules
const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");

// API Routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
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
      users: {
        getProfile: "GET /api/users/profile",
        updateProfile: "PUT /api/users/profile",
        uploadAvatar: "POST /api/users/avatar",
        getProgress: "GET /api/users/progress",
        addXP: "POST /api/users/xp",
        getStatistics: "GET /api/users/statistics",
      },
    },
    features: {
      xp_system: "XP-based progression (1000 XP = 1 level)",
      leagues: ["Bronze", "Silver", "Gold", "Diamond"],
      streak_tracking: "Daily streak system",
    },
  });
});

module.exports = router;
