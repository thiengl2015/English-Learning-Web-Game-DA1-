const adminUserService = require("../services/admin-user.service");
const { successResponse, errorResponse } = require("../utils/response.util");

class AdminUserController {
  async getUsers(req, res, next) {
    try {
      const result = await adminUserService.getUsers(req.query);
      return successResponse(res, result, "Users loaded successfully");
    } catch (error) {
      next(error);
    }
  }

  async getUserById(req, res, next) {
    try {
      const user = await adminUserService.getUserById(req.params.id);
      return successResponse(res, user, "User loaded successfully");
    } catch (error) {
      if (error.statusCode) return errorResponse(res, error.message, error.statusCode);
      next(error);
    }
  }

  async updateStatus(req, res, next) {
    try {
      const user = await adminUserService.updateStatus(req.params.id, req.body.status);
      return successResponse(res, user, "User status updated successfully");
    } catch (error) {
      if (error.statusCode) return errorResponse(res, error.message, error.statusCode);
      next(error);
    }
  }
}

module.exports = new AdminUserController();
