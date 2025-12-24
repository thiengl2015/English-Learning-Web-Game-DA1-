const gameService = require("../services/game.service");
const { successResponse, errorResponse } = require("../utils/response.util");

class GameController {
  /**
   * @route GET /api/games/types
   * @desc Get all game types
   * @access Private
   */
  async getGameTypes(req, res, next) {
    try {
      const types = await gameService.getGameTypes();

      return successResponse(res, types, "Lấy danh sách game types thành công");
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route GET /api/games/lesson/:lessonId
   * @desc Get games available for a lesson
   * @access Private
   */
  async getGamesByLesson(req, res, next) {
    try {
      const userId = req.user.id;
      const lessonId = req.params.lessonId;

      const games = await gameService.getGamesByLesson(lessonId, userId);

      return successResponse(res, games, "Lấy danh sách games thành công");
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route POST /api/games/start
   * @desc Start a new game session
   * @access Private
   */
  async startGame(req, res, next) {
    try {
      const userId = req.user.id;
      const { game_config_id } = req.body;

      const session = await gameService.startGame(game_config_id, userId);

      return successResponse(res, session, "Game started successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route POST /api/games/:sessionId/answer
   * @desc Submit answer for a question
   * @access Private
   */
  async submitAnswer(req, res, next) {
    try {
      const userId = req.user.id;
      const sessionId = req.params.sessionId;
      const answerData = req.body;

      const result = await gameService.submitAnswer(
        sessionId,
        userId,
        answerData
      );

      return successResponse(
        res,
        result,
        result.is_correct ? "Correct answer!" : "Incorrect answer"
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route POST /api/games/:sessionId/complete
   * @desc Complete a game session
   * @access Private
   */
  async completeGame(req, res, next) {
    try {
      const userId = req.user.id;
      const sessionId = req.params.sessionId;
      const completionData = req.body;

      const result = await gameService.completeGame(
        sessionId,
        userId,
        completionData
      );

      return successResponse(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route GET /api/games/:sessionId/results
   * @desc Get game session results
   * @access Private
   */
  async getGameResults(req, res, next) {
    try {
      const userId = req.user.id;
      const sessionId = req.params.sessionId;

      const results = await gameService.getGameResults(sessionId, userId);

      return successResponse(res, results, "Lấy kết quả game thành công");
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route GET /api/games/:sessionId/wrong-answers
   * @desc Get wrong answers for a session
   * @access Private
   */
  async getWrongAnswers(req, res, next) {
    try {
      const userId = req.user.id;
      const sessionId = req.params.sessionId;

      const wrongAnswers = await gameService.getWrongAnswers(sessionId, userId);

      return successResponse(
        res,
        wrongAnswers,
        "Lấy danh sách câu trả lời sai thành công"
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route GET /api/games/history
   * @desc Get user's game history
   * @access Private
   */
  async getGameHistory(req, res, next) {
    try {
      const userId = req.user.id;
      const filters = req.query;

      const history = await gameService.getGameHistory(userId, filters);

      return successResponse(res, history, "Lấy lịch sử game thành công");
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route GET /api/games/statistics
   * @desc Get user's game statistics
   * @access Private
   */
  async getGameStatistics(req, res, next) {
    try {
      const userId = req.user.id;

      const stats = await gameService.getGameStatistics(userId);

      return successResponse(res, stats, "Lấy thống kê game thành công");
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route POST /api/games/:gameConfigId/replay
   * @desc Replay a game
   * @access Private
   */
  async replayGame(req, res, next) {
    try {
      const userId = req.user.id;
      const gameConfigId = req.params.gameConfigId;

      const session = await gameService.replayGame(gameConfigId, userId);

      return successResponse(res, session, "Game restarted successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  /**
   * @route POST /api/games/:sessionId/abandon
   * @desc Abandon a game (quit mid-game)
   * @access Private
   */
  async abandonGame(req, res, next) {
    try {
      const userId = req.user.id;
      const sessionId = req.params.sessionId;

      const result = await gameService.abandonGame(sessionId, userId);

      return successResponse(res, result, result.message);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new GameController();
