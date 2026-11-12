const express = require("express");
const router = express.Router();

const {
  createStartup,
  getStartups,
  getRecommendedStartups,
  getMyStartups,
  getStartupById,
  updateStartup,
  deleteStartup,
  removeTeamMember,
} = require("../controllers/startupController");

const {
  protect,
  optionalProtect,
} = require("../middleware/authMiddleware");

router.get("/", optionalProtect, getStartups);

// must stay above "/:id", otherwise "recommended" is treated as an id
router.get(
  "/recommended",
  protect,
  getRecommendedStartups
);

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