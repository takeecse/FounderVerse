const express = require("express");
const router = express.Router();

const {
  createStartup,
  getStartups,
  getMyStartups,
  getStartupById,
  updateStartup,
  deleteStartup,
  removeTeamMember,
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

router.put(
  "/:id",
  protect,
  updateStartup
);

router.delete(
  "/:id",
  protect,
  deleteStartup
);

router.delete(
  "/:id/team/:memberId",
  protect,
  removeTeamMember
);

module.exports = router;