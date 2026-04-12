/**
 * Payment Routes (User)
 */

const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/payment.controller");

/**
 * @route   GET /api/payments/packages
 * @desc    Get available subscription packages
 * @access  Public
 */
router.get("/packages", paymentController.getPackages);

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

module.exports = router;
