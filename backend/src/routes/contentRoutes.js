const express = require("express");
const {
  getUnits,
  getUnitById,
  createUnit,
  updateUnit,
  deleteUnit,
} = require("../src/controllers/contentController");

const router = express.Router();

router.get("/", getUnits);
router.get("/:id", getUnitById);
router.post("/", createUnit);
router.put("/:id", updateUnit);
router.delete("/:id", deleteUnit);

module.exports = router;
