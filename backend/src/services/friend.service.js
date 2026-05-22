const { Friendship, User } = require("../models");
const { Op } = require("sequelize");

class FriendService {
  async addFriend(currentUserId, friendId) {
    if (currentUserId === friendId) {
      throw new Error("Cannot add yourself as a friend");
    }

    const targetUser = await User.findByPk(friendId);
    if (!targetUser) {
      throw new Error("User not found");
    }

    const existing = await Friendship.findOne({
      where: this.getPairWhere(currentUserId, friendId),
    });

    if (existing) {
      if (existing.status !== "accepted") {
        await existing.update({ status: "accepted" });
      }
      return existing;
    }

    return Friendship.create({
      requester_id: currentUserId,
      addressee_id: friendId,
      status: "accepted",
    });
  }

  async removeFriend(currentUserId, friendId) {
    const deletedCount = await Friendship.destroy({
      where: this.getPairWhere(currentUserId, friendId),
    });

    return {
      removed: deletedCount > 0,
    };
  }

  getPairWhere(userA, userB) {
    return {
      [Op.or]: [
        { requester_id: userA, addressee_id: userB },
        { requester_id: userB, addressee_id: userA },
      ],
    };
  }
}

module.exports = new FriendService();
