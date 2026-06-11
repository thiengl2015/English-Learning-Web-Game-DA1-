const notificationService = require("../services/notification.service");
const { successResponse } = require("../utils/response.util");

class NotificationController {
  async list(req, res, next) {
    try {
      const result = await notificationService.listForUser(req.user);
      return successResponse(res, result, "Lấy thông báo thành công");
    } catch (error) {
      next(error);
    }
  }

  async markRead(req, res, next) {
    try {
      const result = await notificationService.markRead(req.user.id, req.params.id);
      return successResponse(res, result, "Đã đánh dấu đã đọc");
    } catch (error) {
      next(error);
    }
  }

  async markAllRead(req, res, next) {
    try {
      const result = await notificationService.markAllRead(req.user.id, "user");
      return successResponse(res, result, "Đã đánh dấu tất cả đã đọc");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new NotificationController();
