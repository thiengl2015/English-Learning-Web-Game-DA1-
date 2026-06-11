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

module.exports = router;
