const express = require("express");
const router = express.Router();

/**
 * @route GET /api/socket/status
 * @desc Get Socket.IO connection info
 * @access Public
 */
router.get("/status", (req, res) => {
  res.json({
    success: true,
    message: "Socket.IO is running",
    features: [
      "conversation:join - Join a conversation room",
      "conversation:message - Send a message",
      "conversation:typing_start - Notify typing started",
      "conversation:typing_stop - Notify typing stopped",
      "conversation:end - End a conversation",
    ],
  });
});

module.exports = router;
