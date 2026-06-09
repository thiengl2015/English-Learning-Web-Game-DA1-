const express = require("express");
const adminDashboardController = require("../controllers/admin-dashboard.controller");
const { authMiddleware, adminMiddleware } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get("/summary", adminDashboardController.getSummary);

module.exports = router;
