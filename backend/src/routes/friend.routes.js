const express = require("express");
const router = express.Router();
const friendController = require("../controllers/friend.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

router.use(authMiddleware);

router.get("/", friendController.getFriends);
router.get("/requests", friendController.getPendingRequests);
router.post("/:userId", friendController.addFriend);
router.post("/:userId/accept", friendController.acceptFriend);
router.post("/:userId/reject", friendController.rejectFriend);
router.delete("/:userId", friendController.removeFriend);
router.delete("/requests/:userId", friendController.cancelRequest);

module.exports = router;
