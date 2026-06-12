const express = require("express");
const adminNotificationController = require("../controllers/admin-notification.controller");
const { authMiddleware, adminMiddleware } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authMiddleware);
router.use(adminMiddleware);

// Admin inbox
router.get("/inbox", adminNotificationController.getInbox);
router.post("/inbox/read-all", adminNotificationController.markInboxAllRead);
router.patch("/inbox/:id/read", adminNotificationController.markInboxRead);

// Templates
router.get("/templates", adminNotificationController.listTemplates);
router.post("/templates", adminNotificationController.createTemplate);
router.put("/templates/:id", adminNotificationController.updateTemplate);

// Campaigns
router.get("/campaigns", adminNotificationController.listCampaigns);
router.post("/campaigns", adminNotificationController.createCampaign);
router.patch("/campaigns/:id/status", adminNotificationController.updateCampaignStatus);
router.delete("/campaigns/:id", adminNotificationController.deleteCampaign);

module.exports = router;
