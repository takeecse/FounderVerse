const express = require("express");
const router = express.Router();

const {
  createStartup,
  getStartups,
  getMyStartups,
  getStartupById,
} = require("../controllers/startupController");

const {
  protect,
} = require("../middleware/authMiddleware");

router.get("/", getStartups);

router.get(
  "/my",
  protect,
  getMyStartups
);

router.get("/:id", getStartupById);

router.post(
  "/",
  protect,
  createStartup
);

module.exports = router;