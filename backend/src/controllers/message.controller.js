const messageService = require("../services/message.service");
const moderationService = require("../services/moderation.service");
const { uploadBuffer } = require("../config/cloudinary");
const { successResponse, errorResponse } = require("../utils/response.util");
const path = require("path");

const isModerationBlock = (error) => error?.code === "CONTENT_BLOCKED";

class MessageController {
  async getConversation(req, res, next) {
    try {
      const messages = await messageService.getConversation(
        req.user.id,
        req.params.friendId
      );
      return successResponse(res, messages, "Messages loaded successfully");
    } catch (error) {
      next(error);
    }
  }

  async sendMessage(req, res, next) {
    try {
      const message = await messageService.sendMessage(
        req.user.id,
        req.params.friendId,
        req.body
      );
      return successResponse(res, message, "Message sent successfully", 201);
    } catch (error) {
      next(error);
    }
  }

  async uploadMedia(req, res, next) {
    if (!req.file) {
      return errorResponse(res, "Please choose a media file", 400);
    }

    try {
      const isImage = req.file.mimetype?.startsWith("image/");
      const isAudio = req.file.mimetype?.startsWith("audio/");

      if (isImage) {
        const verdict = await moderationService.moderateImage(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );

        if (verdict.flagged) {
          return res.status(400).json({
            success: false,
            message: "Image content was blocked by moderation.",
            code: "CONTENT_BLOCKED",
          });
        }
      }

      const upload = await uploadBuffer(req.file.buffer, {
        folder: isAudio
          ? "english-learning/chat/audio"
          : "english-learning/chat/images",
        resourceType: isAudio ? "video" : "image",
      });

      return successResponse(
        res,
        {
          mediaUrl: upload.url,
          public_id: upload.public_id,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
        },
        "Media uploaded successfully",
        201
      );
    } catch (error) {
      if (isImageError(req.file) && isModerationBlock(error)) {
        return res.status(400).json({
          success: false,
          message: error.message || "Image moderation failed",
          code: error.code || "CONTENT_BLOCKED",
        });
      }
      next(error);
    }
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

const isImageError = (file) => Boolean(file?.mimetype?.startsWith("image/"));

module.exports = new MessageController();
