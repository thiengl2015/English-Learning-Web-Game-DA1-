const express = require("express");
const router = express.Router();

// Import route modules
const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const unitRoutes = require("./unit.routes");
const lessonRoutes = require("./lesson.routes");
const vocabularyRoutes = require("./vocabulary.routes");

// API Routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/units", unitRoutes);
router.use("/lessons", lessonRoutes);
router.use("/vocabulary", vocabularyRoutes);
router.use("/games", require("./game.routes"));
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
        changePassword: "PUT /api/users/change-password",
        getProgress: "GET /api/users/progress",
        addXP: "POST /api/users/xp",
        getStatistics: "GET /api/users/statistics",
      },
      units: {
        getAllUnits: "GET /api/units",
        getUnitById: "GET /api/units/:id",
        getUnitStatistics: "GET /api/units/:id/statistics",
      },
      lessons: {
        getLessonById: "GET /api/lessons/:id",
        startLesson: "POST /api/lessons/:id/start",
        completeLesson: "POST /api/lessons/:id/complete",
        getUserLessonProgress: "GET /api/lessons/progress",
        getLessonStatistics: "GET /api/lessons/:id/statistics",
      },
      vocabulary: {
        getAll: "GET /api/vocabulary",
        getById: "GET /api/vocabulary/:id",
        getFavorites: "GET /api/vocabulary/favorites",
        getStatistics: "GET /api/vocabulary/statistics",
        markFavorite: "POST /api/vocabulary/:id/favorite",
        unmarkFavorite: "DELETE /api/vocabulary/:id/favorite",
        updateProgress: "PUT /api/vocabulary/:id/progress",
      },
      games: {
        getTypes: "GET /api/games/types",
        getByLesson: "GET /api/games/lesson/:lessonId",
        startGame: "POST /api/games/start",
        submitAnswer: "POST /api/games/:sessionId/answer",
        completeGame: "POST /api/games/:sessionId/complete",
        getResults: "GET /api/games/:sessionId/results",
        getWrongAnswers: "GET /api/games/:sessionId/wrong-answers",
        getHistory: "GET /api/games/history",
        getStatistics: "GET /api/games/statistics",
        replayGame: "POST /api/games/:gameConfigId/replay",
        abandonGame: "POST /api/games/:sessionId/abandon",
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
