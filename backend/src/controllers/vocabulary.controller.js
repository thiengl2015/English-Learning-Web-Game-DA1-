const vocabularyService = require("../services/vocabulary.service");
const { successResponse, errorResponse } = require("../utils/response.util");

class VocabularyController {
  /**
   * @route   GET /api/vocabulary
   * @desc    Get all vocabulary with filters
   * @access  Private
   */
  async getAllVocabulary(req, res, next) {
    try {
      const userId = req.user.id;
      const filters = req.query;

      const result = await vocabularyService.getAllVocabulary(userId, filters);

      return successResponse(res, result, "Lấy danh sách từ vựng thành công");
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/vocabulary/:id
   * @desc    Get vocabulary by ID
   * @access  Private
   */
  async getVocabularyById(req, res, next) {
    try {
      const userId = req.user.id;
      const vocabId = req.params.id;

      const vocab = await vocabularyService.getVocabularyById(vocabId, userId);

      return successResponse(res, vocab, "Lấy thông tin từ vựng thành công");
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/lessons/:lessonId/vocabulary
   * @desc    Get vocabulary by lesson
   * @access  Private
   */
  async getVocabularyByLesson(req, res, next) {
    try {
      const userId = req.user.id;
      const lessonId = req.params.lessonId;

      const vocabulary = await vocabularyService.getVocabularyByLesson(
        lessonId,
        userId
      );

      return successResponse(res, vocabulary, "Lấy từ vựng lesson thành công");
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   GET /api/units/:unitId/vocabulary
   * @desc    Get vocabulary by unit
   * @access  Private
   */
  async getVocabularyByUnit(req, res, next) {
    try {
      const userId = req.user.id;
      const unitId = req.params.unitId;

      const vocabulary = await vocabularyService.getVocabularyByUnit(
        unitId,
        userId
      );

      return successResponse(res, vocabulary, "Lấy từ vựng unit thành công");
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   POST /api/vocabulary/:id/favorite
   * @desc    Mark vocabulary as favorite
   * @access  Private
   */
  async markFavorite(req, res, next) {
    try {
      const userId = req.user.id;
      const vocabId = req.params.id;

      const result = await vocabularyService.markFavorite(vocabId, userId);

      return successResponse(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route   DELETE /api/vocabulary/:id/favorite
   * @desc    Unmark vocabulary as favorite
   * @access  Private
   */
  async unmarkFavorite(req, res, next) {
    try {
      const userId = req.user.id;
      const vocabId = req.params;
      const result = await vocabularyService.unmarkFavorite(vocabId, userId);

      return successResponse(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }
  /**
    @route   GET /api/vocabulary/favorites
    @desc    Get user's favorite vocabulary
    @access  Private
    */
  async getFavoriteVocabulary(req, res, next) {
    try {
      const userId = req.user.id;
      const favorites = await vocabularyService.getFavoriteVocabulary(userId);
      return successResponse(
        res,
        favorites,
        "Lấy danh sách yêu thích thành công"
      );
    } catch (error) {
      next(error);
    }
  }

  /**
    @route   PUT /api/vocabulary/:id/progress
    @desc    Update vocabulary progress
    @access  Private
    */
  async updateProgress(req, res, next) {
    try {
      const userId = req.user.id;
      const vocabId = req.params.id;
      const progressData = req.body;
      const progress = await vocabularyService.updateProgress(
        vocabId,
        userId,
        progressData
      );
      return successResponse(res, progress, "Cập nhật tiến độ thành công");
    } catch (error) {
      next(error);
    }
  }

  /**
    @route   GET /api/vocabulary/statistics
    @desc    Get vocabulary statistics
    @access  Private
    */
  async getStatistics(req, res, next) {
    try {
      const userId = req.user.id;
      const stats = await vocabularyService.getStatistics(userId);
      return successResponse(res, stats, "Lấy thống kê từ vựng thành công");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new VocabularyController();
