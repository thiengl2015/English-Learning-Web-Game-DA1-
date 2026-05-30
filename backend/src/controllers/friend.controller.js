const friendService = require("../services/friend.service");
const { successResponse } = require("../utils/response.util");

class FriendController {
  async getFriends(req, res, next) {
    try {
      const friends = await friendService.getFriends(req.user.id);

      return successResponse(res, friends, "Friends loaded successfully");
    } catch (error) {
      next(error);
    }
  }

  async addFriend(req, res, next) {
    try {
      const friendship = await friendService.addFriend(req.user.id, req.params.userId);

      return successResponse(res, friendship, "Friend request sent");
    } catch (error) {
      next(error);
    }
  }

  async acceptFriend(req, res, next) {
    try {
      const friendship = await friendService.acceptFriend(req.user.id, req.params.userId);

      return successResponse(res, friendship, "Friend request accepted");
    } catch (error) {
      next(error);
    }
  }

  async rejectFriend(req, res, next) {
    try {
      const result = await friendService.rejectFriend(req.user.id, req.params.userId);

      return successResponse(res, result, "Friend request rejected");
    } catch (error) {
      next(error);
    }
  }

  async cancelRequest(req, res, next) {
    try {
      const result = await friendService.cancelRequest(req.user.id, req.params.userId);

      return successResponse(res, result, "Friend request cancelled");
    } catch (error) {
      next(error);
    }
  }

  async getPendingRequests(req, res, next) {
    try {
      const result = await friendService.getPendingRequests(req.user.id);

      return successResponse(res, result, "Pending requests loaded");
    } catch (error) {
      next(error);
    }
  }

  async removeFriend(req, res, next) {
    try {
      const result = await friendService.removeFriend(req.user.id, req.params.userId);

      return successResponse(res, result, "Friend removed successfully");
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new FriendController();
