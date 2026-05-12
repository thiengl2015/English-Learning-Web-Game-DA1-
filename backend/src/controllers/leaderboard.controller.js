const leaderboardService = require("../services/leaderboard.service");
const { successResponse, errorResponse } = require("../utils/response.util");

class LeaderboardController {
  async getWeeklyLeaderboard(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const data = await leaderboardService.getWeeklyLeaderboard(limit);

      return successResponse(res, data, "Lấy bảng xếp hạng tuần thành công");
    } catch (err) {
      next(err);
    }
  }

  async getUserRank(req, res, next) {
    try {
      const userId = req.user.id;
      const data = await leaderboardService.getUserRank(userId);

      return successResponse(res, data, "Lấy thứ hạng người dùng thành công");
    } catch (err) {
      next(err);
    }
  }

  async getAllTimeLeaderboard(req, res, next) {
    try {
      const limit = parseInt(req.query.limit) || 20;
      const data = await leaderboardService.getAllTimeLeaderboard(limit);

      return successResponse(res, data, "Lấy bảng xếp hạng mọi thời đại thành công");
    } catch (err) {
      next(err);
    }
  }

  async getLeagueLeaderboard(req, res, next) {
    try {
      const { league } = req.params;
      const limit = parseInt(req.query.limit) || 50;

      if (!["Bronze", "Silver", "Gold", "Diamond"].includes(league)) {
        return errorResponse(res, "Liên đới không hợp lệ. Các liên đới hợp lệ: Bronze, Silver, Gold, Diamond", 400);
      }

      const data = await leaderboardService.getLeagueLeaderboard(league, limit);

      return successResponse(res, data, `Lấy bảng xếp hạng liên đới ${league} thành công`);
    } catch (err) {
      next(err);
    }
  }

  async getTopThreeLastWeek(req, res, next) {
    try {
      const data = await leaderboardService.getTopThreeLastWeek();

      return successResponse(res, data, "Lấy top 3 tuần trước thành công");
    } catch (err) {
      next(err);
    }
  }

  async getFullLeaderboardData(req, res, next) {
    try {
      const userId = req.user.id;
      const limit = parseInt(req.query.limit) || 20;

      const [weeklyLeaderboard, userRank, topThree] = await Promise.all([
        leaderboardService.getWeeklyLeaderboard(limit),
        leaderboardService.getUserRank(userId),
        leaderboardService.getTopThreeLastWeek(),
      ]);

      return successResponse(res, {
        weeklyLeaderboard,
        userRank,
        topThreeLastWeek: topThree,
      }, "Lấy dữ liệu bảng xếp hạng đầy đủ thành công");
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new LeaderboardController();
