const express = require("express");
const router = express.Router();

const {
  sendRequest,
  getReceivedRequests,
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