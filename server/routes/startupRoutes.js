const express = require("express");
const router = express.Router();

const {
  createStartup,
  getStartups,
} = require("../controllers/startupController");

const {
  protect,
} = require("../middleware/authMiddleware");

router.get("/", getStartups);

router.post(
  "/",
  protect,
  createStartup
);

module.exports = router;