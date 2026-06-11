const express = require("express");
const router = express.Router();

const {
  createStartup,
} = require("../controllers/startupController");

const {
  protect,
} = require("../middleware/authMiddleware");

router.post(
  "/",
  protect,
  createStartup
);

module.exports = router;