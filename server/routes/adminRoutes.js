const express = require("express");
const router = express.Router();

const {
  getModerationQueue,
  getOverview,
  getStartups,
  deleteAdminStartup,
  getStartupAppeals,
  reviewStartupAppeal,
  markAdminInboxRead,
  getUsers,
  moderateStartup,
  getVerificationApplications,
  reviewVerificationApplication,
  updateUser,
} = require("../controllers/adminController");
const {
  getReports,
  reviewReport,
} = require("../controllers/reportController");

const {
  protect,
  requireAdmin,
} = require("../middleware/authMiddleware");

router.use(protect, requireAdmin);

router.get("/overview", getOverview);
router.post("/inbox/read", markAdminInboxRead);
router.get("/verification", getVerificationApplications);
router.patch(
  "/verification/:id",
  reviewVerificationApplication
);
router.get("/users", getUsers);
router.patch("/users/:id", updateUser);
router.get("/startups", getStartups);
router.patch("/startups/:id/moderation", moderateStartup);
router.delete("/startups/:id", deleteAdminStartup);
router.get("/startup-appeals", getStartupAppeals);
router.patch("/startup-appeals/:id", reviewStartupAppeal);
router.get("/reports", getReports);
router.patch("/reports/:id", reviewReport);
router.get("/moderation", getModerationQueue);

module.exports = router;
