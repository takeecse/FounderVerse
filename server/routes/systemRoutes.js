const express = require("express");
const router = express.Router();
const {
  getSystemOverview,
  getSystemAccounts,
  updateOperatorAccess,
} = require("../controllers/systemController");
const {
  protect,
  requireSystem,
} = require("../middleware/authMiddleware");

router.use(protect, requireSystem);
router.get("/overview", getSystemOverview);
router.get("/accounts", getSystemAccounts);
router.patch("/operators/:id", updateOperatorAccess);

module.exports = router;
