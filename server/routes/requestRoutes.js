const express = require("express");
const router = express.Router();

const {
  sendRequest,
  getReceivedRequests,
  getSentRequests,
  acceptRequest,
  rejectRequest,
} = require("../controllers/requestController");

const {
  protect,
} = require("../middleware/authMiddleware");

router.get(
  "/received",
  protect,
  getReceivedRequests
);

router.get(
  "/sent",
  protect,
  getSentRequests
);

router.post(
  "/",
  protect,
  sendRequest
);

router.put(
  "/:id/accept",
  protect,
  acceptRequest
);

router.put(
  "/:id/reject",
  protect,
  rejectRequest
);

module.exports = router;