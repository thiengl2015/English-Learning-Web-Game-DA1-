const express = require("express");
const router = express.Router();
const friendController = require("../controllers/friend.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

router.use(authMiddleware);

router.get("/", friendController.getFriends);
router.post("/:userId", friendController.addFriend);
router.delete("/:userId", friendController.removeFriend);

module.exports = router;
