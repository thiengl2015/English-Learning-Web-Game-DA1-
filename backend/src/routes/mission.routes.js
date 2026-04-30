const express = require("express");
const router = express.Router();
const missionController = require("../controllers/mission.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

router.get("/", authMiddleware, missionController.getMissions);
router.post("/progress", authMiddleware, missionController.updateProgress);
router.post("/:missionId/claim", authMiddleware, missionController.claimReward);
router.post("/seed", missionController.seedMissions);

module.exports = router;
