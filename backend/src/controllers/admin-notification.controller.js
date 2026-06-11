const adminNotificationService = require("../services/admin-notification.service");
const { successResponse } = require("../utils/response.util");

class AdminNotificationController {
  async listCampaigns(req, res, next) {
    try {
      const data = await adminNotificationService.listCampaigns();
      return successResponse(res, data, "Lấy danh sách campaign thành công");
    } catch (error) {
      next(error);
    }
  }

  async createCampaign(req, res, next) {
    try {
      const data = await adminNotificationService.createCampaign(req.body, req.user.id);
      return successResponse(res, data, "Tạo campaign thành công", 201);
    } catch (error) {
      next(error);
    }
  }

  async updateCampaignStatus(req, res, next) {
    try {
      const data = await adminNotificationService.updateCampaignStatus(req.params.id, req.body.status);
      return successResponse(res, data, "Cập nhật campaign thành công");
    } catch (error) {
      next(error);
    }
  }

  async deleteCampaign(req, res, next) {
    try {
      const data = await adminNotificationService.deleteCampaign(req.params.id);
      return successResponse(res, data, "Xóa campaign thành công");
    } catch (error) {
      next(error);
    }
  }

  async listTemplates(req, res, next) {
    try {
      const data = await adminNotificationService.listTemplates();
      return successResponse(res, data, "Lấy danh sách template thành công");
    } catch (error) {
      next(error);
    }
  }

  async createTemplate(req, res, next) {
    try {
      const data = await adminNotificationService.createTemplate(req.body);
      return successResponse(res, data, "Tạo template thành công", 201);
    } catch (error) {
      next(error);
    }
  }

  async updateTemplate(req, res, next) {
    try {
      const data = await adminNotificationService.updateTemplate(req.params.id, req.body);
      return successResponse(res, data, "Cập nhật template thành công");
    } catch (error) {
      next(error);
    }
  }

  async getInbox(req, res, next) {
    try {
      const data = await adminNotificationService.getInbox(req.user.id);
      return successResponse(res, data, "Lấy hộp thư admin thành công");
    } catch (error) {
      next(error);
    }
  }

  async markInboxRead(req, res, next) {
    try {
      const data = await adminNotificationService.markInboxRead(req.user.id, req.params.id);
      return successResponse(res, data, "Đã đánh dấu đã đọc");
    } catch (error) {
      next(error);
    }
  }

  async markInboxAllRead(req, res, next) {
    try {
      const data = await adminNotificationService.markInboxAllRead(req.user.id);
      return successResponse(res, data, "Đã đánh dấu tất cả đã đọc");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminNotificationController();
