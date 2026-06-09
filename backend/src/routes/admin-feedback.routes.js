const express = require("express");
const feedbackController = require("../controllers/feedback.controller");
const { authMiddleware, adminMiddleware } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");
const { updateFeedbackStatusSchema } = require("../validators/feedback.validator");

const router = express.Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get("/", feedbackController.getAdminFeedback);
router.get("/stats", feedbackController.getFeedbackStats);
router.patch("/:id/status", validate(updateFeedbackStatusSchema), feedbackController.updateFeedbackStatus);

module.exports = router;
