/**
 * Payment Controller
 * User-facing payment endpoints.
 *
 * POST /api/payments/orders          -> create order & QR code
 * GET  /api/payments/orders          -> user's order history
 * GET  /api/payments/orders/:id      -> order status / details
 * PUT  /api/payments/orders/:id/cancel -> cancel pending order
 * GET  /api/payments/packages        -> available packages
 */

const paymentService = require("../services/payment.service");
const { successResponse, errorResponse } = require("../utils/response.util");

class PaymentController {
  /**
   * @route   POST /api/payments/orders
   * @desc    Create a payment order and generate QR code
   * @access  Private
   */
  async createOrder(req, res, next) {
    try {
      const userId = req.user.id;
      const { package_type } = req.body;

      if (!package_type) {
        return errorResponse(res, "package_type là bắt buộc", 400);
      }

      const order = await paymentService.createOrder(userId, package_type);
      return successResponse(res, order, "Tạo đơn hàng thành công", 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/payments/orders
   * @desc    Get current user's orders (paginated)
   * @access  Private
   */
  async getMyOrders(req, res, next) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, status } = req.query;

      const result = await paymentService.getMyOrders(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
      });

      return successResponse(res, result, "Lấy danh sách đơn hàng thành công");
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/payments/orders/:id
   * @desc    Get order details
   * @access  Private
   */
  async getOrderStatus(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const order = await paymentService.getOrderStatus(id, userId);
      return successResponse(res, order, "Lấy thông tin đơn hàng thành công");
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   PUT /api/payments/orders/:id/cancel
   * @desc    Cancel a pending order
   * @access  Private
   */
  async cancelOrder(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const order = await paymentService.cancelOrder(id, userId);
      return successResponse(res, order, "Hủy đơn hàng thành công");
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/payments/packages
   * @desc    Get available subscription packages
   * @access  Public
   */
  async getPackages(req, res, next) {
    try {
      const packages = paymentService.getPackages();
      return successResponse(res, packages, "Lấy danh sách gói thành công");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PaymentController();
