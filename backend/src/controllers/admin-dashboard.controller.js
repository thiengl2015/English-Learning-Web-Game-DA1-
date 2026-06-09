const adminUserService = require("../services/admin-user.service");
const { successResponse } = require("../utils/response.util");

class AdminDashboardController {
  async getSummary(req, res, next) {
    try {
      const summary = await adminUserService.getDashboardSummary();
      return successResponse(res, summary, "Dashboard summary loaded successfully");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminDashboardController();
