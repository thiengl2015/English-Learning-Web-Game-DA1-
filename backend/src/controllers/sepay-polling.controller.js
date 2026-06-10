/**
 * SePay Polling Controller
 * Quản lý trạng thái polling service (admin only)
 */

const sepayPollingService = require("../services/sepay-polling.service");
const { successResponse, errorResponse } = require("../utils/response.util");

class SepayPollingController {
  /**
   * @route GET /api/admin/sepay-polling/status
   * @desc Lấy trạng thái polling service
   * @access Admin
   */
  getStatus(req, res, next) {
    try {
      const status = sepayPollingService.getStatus();
      return successResponse(res, status, "Lấy trạng thái thành công");
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route POST /api/admin/sepay-polling/start
   * @desc Bắt đầu polling service
   * @access Admin
   */
  start(req, res, next) {
    try {
      sepayPollingService.start();
      return successResponse(res, sepayPollingService.getStatus(), "Polling service đã bắt đầu");
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route POST /api/admin/sepay-polling/stop
   * @desc Dừng polling service
   * @access Admin
   */
  stop(req, res, next) {
    try {
      sepayPollingService.stop();
      return successResponse(res, sepayPollingService.getStatus(), "Polling service đã dừng");
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route POST /api/admin/sepay-polling/check
   * @desc Force check ngay lập tức
   * @access Admin
   */
  forceCheck(req, res, next) {
    try {
      sepayPollingService.forceCheck();
      return successResponse(res, sepayPollingService.getStatus(), "Force check đã được kích hoạt");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new SepayPollingController();
