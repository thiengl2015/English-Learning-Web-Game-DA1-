/**
 * Payment Controller
 * User-facing payment endpoints.
 */

const paymentService = require("../services/payment.service");
const { successResponse, errorResponse } = require("../utils/response.util");

class PaymentController {
  async createOrder(req, res, next) {
    try {
      const userId = req.user.id;
      const { package_type, months } = req.body;

      if (!package_type && !months) {
        return errorResponse(res, "package_type hoac months la bat buoc", 400);
      }

      const order = await paymentService.createOrder(userId, package_type, months);
      return successResponse(res, order, "Tao don hang thanh cong", 201);
    } catch (error) {
      next(error);
    }
  }

  async getMyOrders(req, res, next) {
    try {
      const userId = req.user.id;
      const { page = 1, limit = 20, status } = req.query;

      const result = await paymentService.getMyOrders(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        status,
      });

      return successResponse(res, result, "Lay danh sach don hang thanh cong");
    } catch (error) {
      next(error);
    }
  }

  async getOrderStatus(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const order = await paymentService.getOrderStatus(id, userId);
      return successResponse(res, order, "Lay thong tin don hang thanh cong");
    } catch (error) {
      next(error);
    }
  }

  async cancelOrder(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const order = await paymentService.cancelOrder(id, userId);
      return successResponse(res, order, "Huy don hang thanh cong");
    } catch (error) {
      next(error);
    }
  }

  async completeOrder(req, res, next) {
    try {
      const userId = req.user.id;
      const { id } = req.params;

      const order = await paymentService.completeOrder(id, userId, req.body || {});
      return successResponse(res, order, "Thanh toan thanh cong");
    } catch (error) {
      next(error);
    }
  }

  async cancelSubscription(req, res, next) {
    try {
      const userId = req.user.id;
      const subscription = await paymentService.cancelSubscription(userId);
      return successResponse(res, subscription, "Huy gia han thanh cong");
    } catch (error) {
      next(error);
    }
  }

  async resumeSubscription(req, res, next) {
    try {
      const userId = req.user.id;
      const subscription = await paymentService.resumeSubscription(userId);
      return successResponse(res, subscription, "Bat lai gia han thanh cong");
    } catch (error) {
      next(error);
    }
  }

  async handleWebhook(req, res, next) {
    try {
      const order = await paymentService.completeOrderFromWebhook(req.body || {});
      return successResponse(res, order, "Webhook payment confirmed");
    } catch (error) {
      next(error);
    }
  }

  async getPackages(req, res, next) {
    try {
      const packages = paymentService.getPackages();
      return successResponse(res, packages, "Lay danh sach goi thanh cong");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PaymentController();
