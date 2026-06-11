const express = require("express");
const adminResourceController = require("../controllers/admin-resource.controller");
const { authMiddleware, adminMiddleware } = require("../middlewares/auth.middleware");

const router = express.Router();

router.use(authMiddleware);
router.use(adminMiddleware);

// Listing / tree
router.get("/tree", adminResourceController.getTree);
router.get("/units", adminResourceController.getUnits);
router.get("/units/:unitId/lessons", adminResourceController.getLessons);

// Upload (create unit/lesson/vocab|grammar/game content)
router.post("/", adminResourceController.createResource);

// Manage (edit / delete)
router.put("/units/:id", adminResourceController.updateUnit);
router.delete("/units/:id", adminResourceController.deleteUnit);
router.put("/lessons/:id", adminResourceController.updateLesson);
router.delete("/lessons/:id", adminResourceController.deleteLesson);
router.put("/vocabulary/:id", adminResourceController.updateVocabulary);
router.delete("/vocabulary/:id", adminResourceController.deleteVocabulary);
router.put("/grammar/:id", adminResourceController.updateGrammar);
router.delete("/grammar/:id", adminResourceController.deleteGrammar);
router.delete("/games/:id", adminResourceController.deleteGame);

module.exports = router;
