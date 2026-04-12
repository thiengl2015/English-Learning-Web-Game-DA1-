/**
 * Admin Payment Controller
 * Admin-only endpoints for reviewing payment orders.
 *
 * POST   /api/admin/payments/orders           -> get all / pending orders
 * GET    /api/admin/payments/orders/pending  -> get pending orders
 * GET    /api/admin/payments/orders/:id       -> get order details
 * POST   /api/admin/payments/orders/:id/approve
 * POST   /api/admin/payments/orders/:id/reject
 */

const adminPaymentService = require("../services/admin-payment.service");
const { successResponse, errorResponse } = require("../utils/response.util");

class AdminPaymentController {
  /**
   * @route   GET /api/admin/payments/orders
   * @desc    Get all orders (with filters: status, user_id, search, page, limit)
   * @access  Private / Admin
   */
  async getAllOrders(req, res, next) {
    try {
      const { status, user_id, search, page, limit, start_date, end_date } =
        req.query;

      const result = await adminPaymentService.getAllOrders({
        status,
        user_id,
        search,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
        start_date,
        end_date,
      });

      return successResponse(res, result, "Lấy danh sách đơn hàng thành công");
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/admin/payments/orders/pending
   * @desc    Get only pending orders
   * @access  Private / Admin
   */
  async getPendingOrders(req, res, next) {
    try {
      const { page, limit } = req.query;

      const result = await adminPaymentService.getPendingOrders({
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 20,
      });

      return successResponse(
        res,
        result,
        "Lấy danh sách đơn chờ duyệt thành công"
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/admin/payments/orders/:id
   * @desc    Get order details
   * @access  Private / Admin
   */
  async getOrderById(req, res, next) {
    try {
      const { id } = req.params;
      const order = await adminPaymentService.getOrderById(id);
      return successResponse(res, order, "Lấy thông tin đơn hàng thành công");
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/admin/payments/orders/:id/approve
   * @desc    Approve payment order and upgrade user subscription
   * @access  Private / Admin
   */
  async approveOrder(req, res, next) {
    try {
      const adminId = req.user.id;
      const { id } = req.params;
      const { admin_note } = req.body;

      const order = await adminPaymentService.approveOrder(id, adminId, admin_note);
      return successResponse(
        res,
        order,
        "Duyệt đơn hàng và nâng cấp Premium thành công"
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/admin/payments/orders/:id/reject
   * @desc    Reject payment order
   * @access  Private / Admin
   */
  async rejectOrder(req, res, next) {
    try {
      const adminId = req.user.id;
      const { id } = req.params;
      const { admin_note } = req.body;

      if (!admin_note || !admin_note.trim()) {
        return errorResponse(res, "admin_note (lý do từ chối) là bắt buộc", 400);
      }

      const order = await adminPaymentService.rejectOrder(
        id,
        adminId,
        admin_note
      );
      return successResponse(res, order, "Từ chối đơn hàng thành công");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminPaymentController();
