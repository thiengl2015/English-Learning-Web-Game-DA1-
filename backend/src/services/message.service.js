const { DirectMessage, Friendship } = require("../models");
const { Op } = require("sequelize");
const { isCloudinaryUrl } = require("../config/cloudinary");
const moderationService = require("./moderation.service");

const badRequest = (message) => {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
};

class MessageService {
  getPairWhere(userA, userB) {
    return {
      [Op.or]: [
        { sender_id: userA, receiver_id: userB },
        { sender_id: userB, receiver_id: userA },
      ],
    };
  }

  async ensureCanChat(userId, friendId) {
    if (userId === friendId) {
      throw new Error("Cannot chat with yourself");
    }

    const friendship = await Friendship.findOne({
      where: {
        status: "accepted",
        [Op.or]: [
          { requester_id: userId, addressee_id: friendId },
          { requester_id: friendId, addressee_id: userId },
        ],
      },
    });

    if (!friendship) {
      throw new Error("You can only chat with friends");
    }
  }

  serializeMessage(message) {
    return {
      id: message.id,
      senderId: message.sender_id,
      receiverId: message.receiver_id,
      content: message.content,
      type: message.type,
      imageUrl: message.type === "image" ? message.media_url : undefined,
      voiceUrl: message.type === "voice" ? message.media_url : undefined,
      voiceDuration: message.voice_duration || undefined,
      timestamp: message.created_at,
      created_at: message.created_at,
    };
  }

  serializeUser(user, isFriend = false) {
    const progress = user.progress || {};
    return {
      id: user.id,
      name: user.display_name || user.username,
      username: user.username,
      avatar: user.avatar || "/placeholder.svg",
      totalXP: progress.total_xp || 0,
      highestRank: progress.league || "Bronze",
      highestPosition: 1,
      isFriend,
    };
  }

  async getConversation(currentUserId, friendId) {
    await this.ensureCanChat(currentUserId, friendId);

    const messages = await DirectMessage.findAll({
      where: this.getPairWhere(currentUserId, friendId),
      order: [["created_at", "ASC"]],
      limit: 200,
    });

    await DirectMessage.update(
      { read_at: new Date() },
      {
        where: {
          sender_id: friendId,
          receiver_id: currentUserId,
          read_at: null,
        },
      }
    );

    return messages.map((message) => this.serializeMessage(message));
  }

  async sendMessage(currentUserId, receiverId, payload = {}) {
    await this.ensureCanChat(currentUserId, receiverId);

    const type = payload.type || "text";
    if (!["text", "image", "voice"].includes(type)) {
      throw new Error("Unsupported message type");
    }

    const content = (payload.content || "").trim();
    const mediaUrl = payload.mediaUrl || payload.media_url || null;

    if (type === "text" && !content) {
      throw new Error("Message content is required");
    }

    if ((type === "image" || type === "voice") && !mediaUrl) {
      throw new Error("Media URL is required");
    }

    if ((type === "image" || type === "voice") && !isCloudinaryUrl(mediaUrl)) {
      throw badRequest("Media files must be uploaded to Cloudinary first");
    }

    // Text chat between friends is moderated before any DB write or socket echo.
    if (type === "text") {
      await moderationService.assertTextAllowed(content);
    }

    const message = await DirectMessage.create({
      sender_id: currentUserId,
      receiver_id: receiverId,
      type,
      content: content || (type === "image" ? "Image" : "Voice message"),
      media_url: mediaUrl,
      voice_duration: payload.voiceDuration || payload.voice_duration || null,
    });

    return this.serializeMessage(message);
  }

  async getLastMessage(userA, userB) {
    const message = await DirectMessage.findOne({
      where: this.getPairWhere(userA, userB),
      order: [["created_at", "DESC"]],
    });

    return message ? this.serializeMessage(message) : null;
  }

  async getUnreadCount(currentUserId, friendId) {
    return DirectMessage.count({
      where: {
        sender_id: friendId,
        receiver_id: currentUserId,
        read_at: null,
      },
    });
  }
}

module.exports = new MessageService();
