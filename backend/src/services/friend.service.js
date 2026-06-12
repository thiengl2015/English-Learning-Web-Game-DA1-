const { Friendship, User, UserProgress } = require("../models");
const { Op } = require("sequelize");
const messageService = require("./message.service");
const notificationService = require("./notification.service");

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
      if (existing.status === "pending") {
        if (existing.requester_id === currentUserId) {
          throw new Error("Friend request already sent");
        }
        await existing.update({ status: "accepted" });
        return existing;
      }
      if (existing.status === "accepted") {
        throw new Error("Already friends");
      }
    }

    const friendship = await Friendship.create({
      requester_id: currentUserId,
      addressee_id: friendId,
      status: "pending",
    });

    await this.notifyFriendRequest(currentUserId, friendId);

    return friendship;
  }

  // Notify the addressee that someone sent them a friend request (best-effort).
  async notifyFriendRequest(senderId, addresseeId) {
    try {
      const sender = await User.findByPk(senderId, {
        attributes: ["id", "username", "display_name", "avatar"],
        include: [
          { model: UserProgress, as: "progress", attributes: ["total_xp", "league"] },
        ],
      });
      if (!sender) return;

      const senderName = sender.display_name || sender.username;
      await notificationService.deliverEventToUser(
        "friend_request",
        addresseeId,
        { sender: senderName },
        {
          fromUser: {
            id: sender.id,
            name: senderName,
            avatar: sender.avatar || "/placeholder.svg",
            totalXP: sender.progress?.total_xp || 0,
            highestRank: sender.progress?.league || "Bronze",
            highestPosition: 1,
          },
        }
      );
    } catch (error) {
      console.error("friend_request notification failed:", error.message);
    }
  }

  async acceptFriend(currentUserId, requesterId) {
    const friendship = await Friendship.findOne({
      where: {
        requester_id: requesterId,
        addressee_id: currentUserId,
        status: "pending",
      },
    });

    if (!friendship) {
      throw new Error("No pending friend request from this user");
    }

    await friendship.update({ status: "accepted" });
    return friendship;
  }

  async rejectFriend(currentUserId, requesterId) {
    const friendship = await Friendship.findOne({
      where: {
        requester_id: requesterId,
        addressee_id: currentUserId,
        status: "pending",
      },
    });

    if (!friendship) {
      throw new Error("No pending friend request from this user");
    }

    await friendship.destroy();
    return { rejected: true };
  }

  async cancelRequest(currentUserId, addresseeId) {
    const friendship = await Friendship.findOne({
      where: {
        requester_id: currentUserId,
        addressee_id: addresseeId,
        status: "pending",
      },
    });

    if (!friendship) {
      throw new Error("No pending friend request to this user");
    }

    await friendship.destroy();
    return { cancelled: true };
  }

  async getPendingRequests(currentUserId) {
    const [received, sent] = await Promise.all([
      this.getPendingReceived(currentUserId),
      this.getPendingSent(currentUserId),
    ]);

    return { received, sent };
  }

  async getPendingReceived(currentUserId) {
    const friendships = await Friendship.findAll({
      where: {
        addressee_id: currentUserId,
        status: "pending",
      },
      include: [
        {
          model: User,
          as: "requester",
          attributes: ["id", "username", "display_name", "avatar"],
          include: [{ model: UserProgress, as: "progress" }],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return friendships.map((f) => {
      const user = f.requester;
      const progress = user?.progress || {};
      return {
        id: user.id,
        name: user.display_name || user.username,
        username: user.username,
        avatar: user.avatar || "/placeholder.svg",
        totalXP: progress.total_xp || 0,
        league: progress.league || "Bronze",
        requestedAt: f.created_at,
      };
    });
  }

  async getPendingSent(currentUserId) {
    const friendships = await Friendship.findAll({
      where: {
        requester_id: currentUserId,
        status: "pending",
      },
      include: [
        {
          model: User,
          as: "addressee",
          attributes: ["id", "username", "display_name", "avatar"],
          include: [{ model: UserProgress, as: "progress" }],
        },
      ],
      order: [["created_at", "DESC"]],
    });

    return friendships.map((f) => {
      const user = f.addressee;
      const progress = user?.progress || {};
      return {
        id: user.id,
        name: user.display_name || user.username,
        username: user.username,
        avatar: user.avatar || "/placeholder.svg",
        totalXP: progress.total_xp || 0,
        league: progress.league || "Bronze",
        sentAt: f.created_at,
      };
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

  async getFriends(currentUserId) {
    const friendships = await Friendship.findAll({
      where: {
        status: "accepted",
        [Op.or]: [
          { requester_id: currentUserId },
          { addressee_id: currentUserId },
        ],
      },
      include: [
        {
          model: User,
          as: "requester",
          attributes: ["id", "username", "display_name", "avatar"],
          include: [{ model: UserProgress, as: "progress" }],
        },
        {
          model: User,
          as: "addressee",
          attributes: ["id", "username", "display_name", "avatar"],
          include: [{ model: UserProgress, as: "progress" }],
        },
      ],
      order: [["updated_at", "DESC"]],
    });

    const friends = await Promise.all(
      friendships.map(async (friendship) => {
        const user =
          friendship.requester_id === currentUserId
            ? friendship.addressee
            : friendship.requester;
        const progress = user.progress || {};
        const lastMessage = await messageService.getLastMessage(currentUserId, user.id);
        const unreadCount = await messageService.getUnreadCount(currentUserId, user.id);

        return {
          id: user.id,
          name: user.display_name || user.username,
          username: user.username,
          avatar: user.avatar || "/placeholder.svg",
          lastMessage: lastMessage ? lastMessage.content : "",
          lastMessageTime: lastMessage ? lastMessage.timestamp : friendship.updated_at,
          unreadCount,
          isOnline: false,
          totalXP: progress.total_xp || 0,
          highestRank: progress.league || "Bronze",
          highestPosition: 1,
        };
      })
    );

    return friends.sort(
      (a, b) =>
        new Date(b.lastMessageTime || 0).getTime() -
        new Date(a.lastMessageTime || 0).getTime()
    );
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
