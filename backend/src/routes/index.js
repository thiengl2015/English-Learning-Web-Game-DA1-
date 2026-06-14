const express = require("express");
const router = express.Router();

// Import route modules
const authRoutes = require("./auth.routes");
const userRoutes = require("./user.routes");
const unitRoutes = require("./unit.routes");
const lessonRoutes = require("./lesson.routes");
const vocabularyRoutes = require("./vocabulary.routes");
const grammarRoutes = require("./grammar.routes");
const aiRoutes = require("./ai.routes");
const paymentRoutes = require("./payment.routes");
const adminPaymentRoutes = require("./admin-payment.routes");
const socketRoutes = require("./socket.routes");
const missionRoutes = require("./mission.routes");
const leaderboardRoutes = require("./leaderboard.routes");
const friendRoutes = require("./friend.routes");
const messageRoutes = require("./message.routes");
const practiceRoutes = require("./practice.routes");
const placementRoutes = require("./placement.routes");
const checkpointRoutes = require("./checkpoint.routes");
const challengeRoutes = require("./challenge.routes");
const feedbackRoutes = require("./feedback.routes");
const adminFeedbackRoutes = require("./admin-feedback.routes");
const adminUserRoutes = require("./admin-user.routes");
const adminDashboardRoutes = require("./admin-dashboard.routes");
const sepayPollingRoutes = require("./sepay-polling.routes");
const adminResourceRoutes = require("./admin-resource.routes");
const notificationRoutes = require("./notification.routes");
const adminNotificationRoutes = require("./admin-notification.routes");
const proofreadRoutes = require("./proofread.routes");

// API Routes
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/units", unitRoutes);
router.use("/lessons", lessonRoutes);
router.use("/vocabulary", vocabularyRoutes);
router.use("/grammar", grammarRoutes);
router.use("/games", require("./game.routes"));
router.use("/ai", aiRoutes);
router.use("/payments", paymentRoutes);
router.use("/admin/payments", adminPaymentRoutes);
router.use("/socket", socketRoutes);
router.use("/missions", missionRoutes);
router.use("/leaderboard", leaderboardRoutes);
router.use("/friends", friendRoutes);
router.use("/messages", messageRoutes);
router.use("/practice", practiceRoutes);
router.use("/placement", placementRoutes);
router.use("/checkpoints", checkpointRoutes);
router.use("/challenges", challengeRoutes);
router.use("/feedback", feedbackRoutes);
router.use("/admin/feedback", adminFeedbackRoutes);
router.use("/admin/users", adminUserRoutes);
router.use("/admin/dashboard", adminDashboardRoutes);
router.use("/admin/sepay-polling", sepayPollingRoutes);
router.use("/admin/resources", adminResourceRoutes);
router.use("/notifications", notificationRoutes);
router.use("/admin/notifications", adminNotificationRoutes);
router.use("/proofread", proofreadRoutes);
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
        getSettings: "GET /api/users/settings",
        updateSettings: "PUT /api/users/settings",
        uploadAvatar: "POST /api/users/avatar",
        changePassword: "PUT /api/users/change-password",
        getProgress: "GET /api/users/progress",
        addXP: "POST /api/users/xp",
        getStatistics: "GET /api/users/statistics",
        searchUsers: "GET /api/users/search?q=keyword",
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
        getLearned: "GET /api/vocabulary/learned",
        getFavorites: "GET /api/vocabulary/favorites",
        getStatistics: "GET /api/vocabulary/statistics",
        markFavorite: "POST /api/vocabulary/:id/favorite",
        unmarkFavorite: "DELETE /api/vocabulary/:id/favorite",
        updateProgress: "PUT /api/vocabulary/:id/progress",
      },
      grammar: {
        getAll: "GET /api/grammar",
        getLearned: "GET /api/grammar/learned",
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
      ai: {
        getTopics: "GET /api/ai/topics",
        startConversation: "POST /api/ai/conversations/start",
        sendMessage: "POST /api/ai/conversations/:conversationId/message",
        getConversation: "GET /api/ai/conversations/:conversationId",
        endConversation: "POST /api/ai/conversations/:conversationId/end",
        getConversations: "GET /api/ai/conversations",
        getRecommendations: "GET /api/ai/recommendations",
        generateQuestions: "POST /api/ai/practice-questions",
        generateExplanation: "POST /api/ai/vocabulary/explanation",
        analyzeProgress: "GET /api/ai/analysis",
      },
      payments: {
        getPackages: "GET /api/payments/packages",
        createOrder: "POST /api/payments/orders",
        getMyOrders: "GET /api/payments/orders",
        getOrderStatus: "GET /api/payments/orders/:id",
        cancelOrder: "PUT /api/payments/orders/:id/cancel",
        completeOrder: "POST /api/payments/orders/:id/complete",
        cancelSubscription: "PUT /api/payments/subscription/cancel",
        resumeSubscription: "PUT /api/payments/subscription/resume",
        sepayWebhook: "POST /api/payments/webhook/sepay",
      },
      adminPayments: {
        getAllOrders: "GET /api/admin/payments/orders",
        getPendingOrders: "GET /api/admin/payments/orders/pending",
        getOrderById: "GET /api/admin/payments/orders/:id",
        approveOrder: "POST /api/admin/payments/orders/:id/approve",
        rejectOrder: "POST /api/admin/payments/orders/:id/reject",
      },
      missions: {
        getAll: "GET /api/missions",
        getByType: "GET /api/missions?type=daily|achievement",
        updateProgress: "POST /api/missions/progress",
        claimReward: "POST /api/missions/:missionId/claim",
      },
      leaderboard: {
        getWeekly: "GET /api/leaderboard",
        getUserRank: "GET /api/leaderboard/me",
        getAllTime: "GET /api/leaderboard/all-time",
        getByLeague: "GET /api/leaderboard/league/:league",
        getTopThreeLastWeek: "GET /api/leaderboard/top-three",
        getFullData: "GET /api/leaderboard/full",
      },
      friends: {
        getFriends: "GET /api/friends",
        addFriend: "POST /api/friends/:userId",
        removeFriend: "DELETE /api/friends/:userId",
      },
      messages: {
        uploadMedia: "POST /api/messages/media",
        downloadMedia: "GET /api/messages/media/download/:filename",
        getConversation: "GET /api/messages/:friendId",
        sendMessage: "POST /api/messages/:friendId",
      },
      practice: {
        getModes: "GET /api/practice/modes",
        getTopics: "GET /api/practice/:mode/topics",
        getTopicDetail: "GET /api/practice/:mode/topics/:slug",
        startAttempt: "POST /api/practice/:mode/topics/:slug/start",
        completeAttempt: "POST /api/practice/attempts/:attemptId/complete",
      },
      placement: {
        getTopics: "GET /api/placement/topics?age=12 (age optional)",
        generateTest: "POST /api/placement/generate",
        submitTest: "POST /api/placement/:sessionId/submit",
        getResult: "GET /api/placement/:sessionId/result",
        getHistory: "GET /api/placement/history",
      },
      checkpoints: {
        getAll: "GET /api/checkpoints",
        getById: "GET /api/checkpoints/:id",
        start: "POST /api/checkpoints/:id/start",
        submit: "POST /api/checkpoints/:id/submit",
        getResult: "GET /api/checkpoints/:id/result/:sessionId",
        getHistory: "GET /api/checkpoints/history",
      },
      challenges: {
        getByUnit: "GET /api/challenges/unit/:unitId",
        start: "POST /api/challenges/unit/:unitId/start",
        submit: "POST /api/challenges/unit/:unitId/submit",
        getResult: "GET /api/challenges/unit/:unitId/result/:sessionId",
        getHistory: "GET /api/challenges/history",
      },
      feedback: {
        submit: "POST /api/feedback",
        getMine: "GET /api/feedback/mine",
      },
      adminFeedback: {
        getAll: "GET /api/admin/feedback",
        getStats: "GET /api/admin/feedback/stats",
        updateStatus: "PATCH /api/admin/feedback/:id/status",
      },
      adminUsers: {
        getAll: "GET /api/admin/users",
        getById: "GET /api/admin/users/:id",
        updateStatus: "PATCH /api/admin/users/:id/status",
      },
      adminDashboard: {
        getSummary: "GET /api/admin/dashboard/summary",
      },
      adminSepayPolling: {
        getStatus: "GET /api/admin/sepay-polling/status",
        start: "POST /api/admin/sepay-polling/start",
        stop: "POST /api/admin/sepay-polling/stop",
        forceCheck: "POST /api/admin/sepay-polling/check",
      },
      adminResources: {
        getTree: "GET /api/admin/resources/tree",
        getUnits: "GET /api/admin/resources/units",
        getLessons: "GET /api/admin/resources/units/:unitId/lessons",
        uploadMedia: "POST /api/admin/resources/upload (multipart field 'file')",
        upload: "POST /api/admin/resources",
      },
      notifications: {
        list: "GET /api/notifications",
        markRead: "PATCH /api/notifications/:id/read",
        markAllRead: "POST /api/notifications/read-all",
      },
      adminNotifications: {
        inbox: "GET /api/admin/notifications/inbox",
        listTemplates: "GET /api/admin/notifications/templates",
        updateTemplate: "PUT /api/admin/notifications/templates/:id",
        listCampaigns: "GET /api/admin/notifications/campaigns",
        createCampaign: "POST /api/admin/notifications/campaigns",
        updateCampaignStatus: "PATCH /api/admin/notifications/campaigns/:id/status",
        deleteCampaign: "DELETE /api/admin/notifications/campaigns/:id",
      },
      proofread: {
        submit: "POST /api/proofread (multipart: image, language, level)",
        submitText: "POST /api/proofread/text (json: text, language, level)",
        ocrOnly: "POST /api/proofread/ocr (multipart: image)",
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
