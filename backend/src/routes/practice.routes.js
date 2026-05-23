const express = require("express");
const router = express.Router();
const practiceController = require("../controllers/practice.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");
const {
  modeValidation,
  slugValidation,
  completeAttemptValidation,
} = require("../validators/practice.validator");

router.use(authMiddleware);

router.get("/modes", practiceController.getModes);
router.get("/:mode/topics", modeValidation, validate, practiceController.getTopics);
router.get("/:mode/topics/:slug", slugValidation, validate, practiceController.getTopicDetail);
router.post("/:mode/topics/:slug/start", slugValidation, validate, practiceController.startAttempt);
router.post(
  "/attempts/:attemptId/complete",
  completeAttemptValidation,
  validate,
  practiceController.completeAttempt
);

module.exports = router;
