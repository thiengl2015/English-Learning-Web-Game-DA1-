const express = require("express");
const { exportUsersReport } = require("../controllers/reportController");
const router = express.Router();

router.get("/users", exportUsersReport);

module.exports = router;
