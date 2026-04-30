const express = require("express");
const router = express.Router();
const leaderboardController = require("../controllers/leaderboard.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

router.get("/", authMiddleware, leaderboardController.getWeeklyLeaderboard);
router.get("/me", authMiddleware, leaderboardController.getUserRank);
router.get("/all-time", authMiddleware, leaderboardController.getAllTimeLeaderboard);
router.get("/league/:league", authMiddleware, leaderboardController.getLeagueLeaderboard);
router.get("/top-three", authMiddleware, leaderboardController.getTopThreeLastWeek);
router.get("/full", authMiddleware, leaderboardController.getFullLeaderboardData);

module.exports = router;
