const express = require("express");
const router = express.Router();
const grammarController = require("../controllers/grammar.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");

// All routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/grammar/learned
 * @desc    Grammar from the user's completed lessons ("Ngữ pháp đã học")
 * @access  Private
 */
router.get("/learned", grammarController.getLearnedGrammar);

/**
 * @route   GET /api/grammar
 * @desc    All grammar in the system ("Ngữ pháp tổng hợp")
 * @access  Private
 */
router.get("/", grammarController.getAllGrammar);

module.exports = router;
