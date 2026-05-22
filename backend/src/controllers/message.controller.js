const messageService = require("../services/message.service");
const { successResponse, errorResponse } = require("../utils/response.util");
const path = require("path");

class MessageController {
  async getConversation(req, res, next) {
    try {
      const messages = await messageService.getConversation(req.user.id, req.params.friendId);
      return successResponse(res, messages, "Messages loaded successfully");
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req, res, next) {
    try {
      const message = await messageService.sendMessage(req.user.id, req.params.friendId, req.body);
      return successResponse(res, message, "Message sent successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  async uploadMedia(req, res) {
    if (!req.file) {
      return errorResponse(res, "Please choose a media file", 400);
    }

    const mediaUrl = `/uploads/chat/${req.file.filename}`;
    return successResponse(
      res,
      {
        mediaUrl,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
      },
      "Media uploaded successfully",
      201
    );
  }

  async downloadMedia(req, res, next) {
    try {
      const filename = path.basename(req.params.filename);
      const filePath = path.join(process.cwd(), "uploads", "chat", filename);
      return res.download(filePath);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MessageController();
