// routes/adminRoutes.js
const express = require("express");
const {
  getUsers,
  getUserById,
  updateStatus,
  updateSubscription,
  deleteUser,
  getDashboardSummary,
} = require("../src/controllers/adminController");

const router = express.Router();

router.get("/users", getUsers);
router.get("/users/:id", getUserById);
router.patch("/users/:id/status", updateStatus);
router.patch("/users/:id/subscription", updateSubscription);
router.delete("/users/:id", deleteUser);

router.get("/dashboard/summary", getDashboardSummary);

module.exports = router;
