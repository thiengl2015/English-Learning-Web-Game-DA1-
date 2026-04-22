/**
 * Admin Payment Routes
 */

const express = require("express");
const router = express.Router();
const adminPaymentController = require("../controllers/admin-payment.controller");
const { authMiddleware, adminMiddleware } = require("../middlewares/auth.middleware");

router.use(authMiddleware);
router.use(adminMiddleware);

/**
 * @route   GET /api/admin/payments/orders
 * @desc    Get all orders (filters: status, user_id, search, page, limit)
 * @access  Private / Admin
 */
router.get("/orders", adminPaymentController.getAllOrders);

/**
 * @route   GET /api/admin/payments/orders/pending
 * @desc    Get only pending orders
 * @access  Private / Admin
 */
router.get("/orders/pending", adminPaymentController.getPendingOrders);

/**
 * @route   GET /api/admin/payments/orders/:id
 * @desc    Get order details
 * @access  Private / Admin
 */
router.get("/orders/:id", adminPaymentController.getOrderById);

/**
 * @route   POST /api/admin/payments/orders/:id/approve
 * @desc    Approve payment and upgrade user subscription
 * @access  Private / Admin
 */
router.post("/orders/:id/approve", adminPaymentController.approveOrder);

/**
 * @route   POST /api/admin/payments/orders/:id/reject
 * @desc    Reject payment order
 * @access  Private / Admin
 */
router.post("/orders/:id/reject", adminPaymentController.rejectOrder);

module.exports = router;
