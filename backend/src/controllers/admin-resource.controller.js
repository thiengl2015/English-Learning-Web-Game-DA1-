const adminResourceService = require("../services/admin-resource.service");
const { successResponse } = require("../utils/response.util");
const { uploadBuffer } = require("../config/cloudinary");

class AdminResourceController {
  // Upload a single image/audio file to Cloudinary; returns the stored URL so
  // the wizard can save it into vocabulary/grammar/game content.
  async uploadMedia(req, res, next) {
    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ success: false, message: "Không tìm thấy file tải lên" });
      }
      const isAudio = (req.file.mimetype || "").startsWith("audio/");
      const result = await uploadBuffer(req.file.buffer, {
        folder: isAudio ? "english-learning/audio" : "english-learning/images",
        resourceType: isAudio ? "video" : "image",
      });
      return successResponse(res, { url: result.url, public_id: result.public_id }, "Tải media thành công");
    } catch (error) {
      next(error);
    }
  }

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

  async updateUnit(req, res, next) {
    try {
      const r = await adminResourceService.updateUnit(req.params.id, req.body);
      return successResponse(res, r, "Cập nhật unit thành công");
    } catch (error) {
      next(error);
    }
  }

  async deleteUnit(req, res, next) {
    try {
      const r = await adminResourceService.deleteUnit(req.params.id);
      return successResponse(res, r, "Xóa unit thành công");
    } catch (error) {
      next(error);
    }
  }

  async updateLesson(req, res, next) {
    try {
      const r = await adminResourceService.updateLesson(req.params.id, req.body);
      return successResponse(res, r, "Cập nhật lesson thành công");
    } catch (error) {
      next(error);
    }
  }

  async deleteLesson(req, res, next) {
    try {
      const r = await adminResourceService.deleteLesson(req.params.id);
      return successResponse(res, r, "Xóa lesson thành công");
    } catch (error) {
      next(error);
    }
  }

  async updateVocabulary(req, res, next) {
    try {
      const r = await adminResourceService.updateVocabulary(req.params.id, req.body);
      return successResponse(res, r, "Cập nhật từ vựng thành công");
    } catch (error) {
      next(error);
    }
  }

  async deleteVocabulary(req, res, next) {
    try {
      const r = await adminResourceService.deleteVocabulary(req.params.id);
      return successResponse(res, r, "Xóa từ vựng thành công");
    } catch (error) {
      next(error);
    }
  }

  async updateGrammar(req, res, next) {
    try {
      const r = await adminResourceService.updateGrammar(req.params.id, req.body);
      return successResponse(res, r, "Cập nhật ngữ pháp thành công");
    } catch (error) {
      next(error);
    }
  }

  async deleteGrammar(req, res, next) {
    try {
      const r = await adminResourceService.deleteGrammar(req.params.id);
      return successResponse(res, r, "Xóa ngữ pháp thành công");
    } catch (error) {
      next(error);
    }
  }

  async deleteGame(req, res, next) {
    try {
      const r = await adminResourceService.deleteGame(req.params.id);
      return successResponse(res, r, "Xóa game thành công");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminResourceController();
