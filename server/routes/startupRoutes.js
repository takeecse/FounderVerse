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
  updateTeamMember,
  submitStartupAppeal,
} = require("../controllers/startupController");
const { inviteStartupMember } = require("../controllers/requestController");

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

router.post(
  "/:id/appeal",
  protect,
  submitStartupAppeal
);

router.post(
  "/:id/invitations",
  protect,
  inviteStartupMember
);

router.get("/:id", optionalProtect, getStartupById);

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

router.patch(
  "/:id/team/:memberId",
  protect,
  updateTeamMember
);

module.exports = router;
