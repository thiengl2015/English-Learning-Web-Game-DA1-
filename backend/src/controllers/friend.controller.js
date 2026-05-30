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

      return successResponse(res, friendship, "Friend added successfully");
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
