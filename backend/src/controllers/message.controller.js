const messageService = require("../services/message.service");
const moderationService = require("../services/moderation.service");
const { successResponse, errorResponse } = require("../utils/response.util");
const { deleteFile } = require("../utils/file.util");
const fs = require("fs");
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

    // Kiểm duyệt ảnh (Falconsai/nsfw_image_detection) trước khi trả URL.
    // Voice/audio không kiểm duyệt (không có speech-to-text).
    if (req.file.mimetype && req.file.mimetype.startsWith("image/")) {
      try {
        const buffer = fs.readFileSync(req.file.path);
        const verdict = await moderationService.moderateImage(
          buffer,
          req.file.originalname,
          req.file.mimetype
        );
        if (verdict.flagged) {
          deleteFile(req.file.path);
          return res.status(400).json({
            success: false,
            message: "Hình ảnh chứa nội dung nhạy cảm và đã bị chặn.",
            code: "CONTENT_BLOCKED",
          });
        }
      } catch (error) {
        // fail-closed (ContentBlockedError) -> chặn; lỗi khác coi như chặn an toàn.
        deleteFile(req.file.path);
        return res.status(400).json({
          success: false,
          message: error.message || "Image moderation failed",
          code: error.code || "CONTENT_BLOCKED",
        });
      }
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
