const missionService = require("../services/mission.service");
const { successResponse, errorResponse } = require("../utils/response.util");

class MissionController {
  async getMissions(req, res, next) {
    try {
      const userId = req.user.id;
      const { type } = req.query;

      const missions = await missionService.getMissions(userId, type);

      return successResponse(res, missions, "Lấy danh sách nhiệm vụ thành công");
    } catch (err) {
      next(err);
    }
  }

  async updateProgress(req, res, next) {
    try {
      const userId = req.user.id;
      const { missionCode, increment } = req.body;

      if (!missionCode) {
        return errorResponse(res, "Mã nhiệm vụ là bắt buộc", 400);
      }

      const result = await missionService.updateProgress(
        userId,
        missionCode,
        increment || 1
      );

      if (!result) {
        return errorResponse(res, "Nhiệm vụ không tồn tại", 404);
      }

      return successResponse(res, result, "Cập nhật tiến độ thành công");
    } catch (err) {
      next(err);
    }
  }

  async claimReward(req, res, next) {
    try {
      const userId = req.user.id;
      const { missionId } = req.params;

      const result = await missionService.claimReward(userId, missionId);

      return successResponse(res, result, "Nhận thưởng thành công");
    } catch (err) {
      return errorResponse(res, err.message, 400);
    }
  }

  async seedMissions(req, res, next) {
    try {
      const result = await missionService.seedMissions();
      return successResponse(res, result);
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new MissionController();
