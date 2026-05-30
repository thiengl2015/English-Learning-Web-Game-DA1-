/**
 * Payment Routes (User)
 */

const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

/**
 * @route   GET /api/payments/packages
 * @desc    Get available subscription packages
 * @access  Public
 */
router.get("/packages", paymentController.getPackages);
router.post("/webhook/sepay", paymentController.handleWebhook);

router.use(authMiddleware);

/**
 * @route   POST /api/payments/orders
 * @desc    Create a new payment order and generate QR code
 * @access  Private
 */
router.post("/orders", paymentController.createOrder);

/**
 * @route   GET /api/payments/orders
 * @desc    Get current user's orders (paginated)
 * @access  Private
 */
router.get("/orders", paymentController.getMyOrders);

/**
 * @route   GET /api/payments/orders/:id
 * @desc    Get order details
 * @access  Private
 */
router.get("/orders/:id", paymentController.getOrderStatus);

/**
 * @route   PUT /api/payments/orders/:id/cancel
 * @desc    Cancel a pending order
 * @access  Private
 */
router.put("/orders/:id/cancel", paymentController.cancelOrder);

/**
 * @route   POST /api/payments/orders/:id/complete
 * @desc    Mark payment as received. In local/dev this simulates bank webhook confirmation.
 * @access  Private
 */
router.post("/orders/:id/complete", paymentController.completeOrder);

router.put("/subscription/cancel", paymentController.cancelSubscription);
router.put("/subscription/resume", paymentController.resumeSubscription);

module.exports = router;
