const express = require("express");
const router = express.Router();

const {
  getMyVerificationApplications,
  submitVerificationApplication,
} = require("../controllers/verificationController");

const {
  protect,
} = require("../middleware/authMiddleware");

router.get(
  "/applications/me",
  protect,
  getMyVerificationApplications
);

router.post(
  "/applications",
  protect,
  submitVerificationApplication
);

module.exports = router;
