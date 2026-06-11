const adminResourceService = require("../services/admin-resource.service");
const { successResponse } = require("../utils/response.util");

class AdminResourceController {
  async getUnits(req, res, next) {
    try {
      const units = await adminResourceService.getUnits();
      return successResponse(res, units, "Lấy danh sách unit thành công");
    } catch (error) {
      next(error);
    }
  }

  async getLessons(req, res, next) {
    try {
      const lessons = await adminResourceService.getLessons(req.params.unitId);
      return successResponse(res, lessons, "Lấy danh sách lesson thành công");
    } catch (error) {
      next(error);
    }
  }

  async getTree(req, res, next) {
    try {
      const tree = await adminResourceService.getTree();
      return successResponse(res, tree, "Lấy cây tài nguyên thành công");
    } catch (error) {
      next(error);
    }
  }

  async createResource(req, res, next) {
    try {
      const result = await adminResourceService.createResource(req.body);
      return successResponse(res, result, "Tải tài nguyên thành công", 201);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminResourceController();
