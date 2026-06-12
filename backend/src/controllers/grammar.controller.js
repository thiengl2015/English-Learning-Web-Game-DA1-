const grammarService = require("../services/grammar.service");
const { successResponse } = require("../utils/response.util");

class GrammarController {
  // All grammar in the system (for the "Ngữ pháp tổng hợp" tab; grouped by type on FE).
  async getAllGrammar(req, res, next) {
    try {
      const data = await grammarService.getAllGrammar(req.user.id);
      return successResponse(res, data, "Lấy danh sách ngữ pháp thành công");
    } catch (error) {
      next(error);
    }
  }

  // Grammar from the user's completed lessons (for the "Ngữ pháp đã học" tab).
  async getLearnedGrammar(req, res, next) {
    try {
      const data = await grammarService.getLearnedGrammar(req.user.id);
      return successResponse(res, data, "Lấy ngữ pháp đã học thành công");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new GrammarController();
