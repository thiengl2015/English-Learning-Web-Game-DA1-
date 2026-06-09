const express = require("express");
const feedbackController = require("../controllers/feedback.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");
const { createFeedbackSchema } = require("../validators/feedback.validator");

const router = express.Router();

router.use(authMiddleware);

router.post("/", validate(createFeedbackSchema), feedbackController.createFeedback);
router.get("/mine", feedbackController.getMyFeedback);

module.exports = router;
