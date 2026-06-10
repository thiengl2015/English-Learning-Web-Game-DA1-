/**
 * SePay Polling Routes (Admin)
 * Quản lý trạng thái polling service
 */

const express = require("express");
const router = express.Router();
const sepayPollingController = require("../controllers/sepay-polling.controller");
const { authMiddleware, adminMiddleware } = require("../middlewares/auth.middleware");

// Áp dụng auth cho tất cả routes
router.use(authMiddleware);

/**
 * @route GET /api/admin/sepay-polling/status
 * @desc Lấy trạng thái polling service
 * @access Admin
 */
router.get("/status", sepayPollingController.getStatus);

/**
 * @route POST /api/admin/sepay-polling/start
 * @desc Bắt đầu polling service
 * @access Admin
 */
router.post("/start", sepayPollingController.start);

/**
 * @route POST /api/admin/sepay-polling/stop
 * @desc Dừng polling service
 * @access Admin
 */
router.post("/stop", sepayPollingController.stop);

/**
 * @route POST /api/admin/sepay-polling/check
 * @desc Force check ngay lập tức
 * @access Admin
 */
router.post("/check", sepayPollingController.forceCheck);

module.exports = router;
