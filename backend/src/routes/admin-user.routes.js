const express = require("express");
const adminUserController = require("../controllers/admin-user.controller");
const { authMiddleware, adminMiddleware } = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validation.middleware");
const { updateAdminUserStatusSchema } = require("../validators/admin-user.validator");

const router = express.Router();

router.use(authMiddleware);
router.use(adminMiddleware);

router.get("/", adminUserController.getUsers);
router.get("/:id", adminUserController.getUserById);
router.patch("/:id/status", validate(updateAdminUserStatusSchema), adminUserController.updateStatus);

module.exports = router;
