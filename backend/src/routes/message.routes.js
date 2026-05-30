const express = require("express");
const router = express.Router();
const messageController = require("../controllers/message.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");
const {
  uploadChatMedia,
  handleUploadError,
} = require("../middlewares/upload.middleware");

router.use(authMiddleware);

router.post("/media", uploadChatMedia, handleUploadError, messageController.uploadMedia);
router.get("/media/download/:filename", messageController.downloadMedia);
router.get("/:friendId", messageController.getConversation);
router.post("/:friendId", messageController.sendMessage);

module.exports = router;
