const express = require("express");
const router = express.Router();

const {
  sendMessage,
  getConversation,
  getConversations,
} = require("../controllers/chatController");

const {
  protect,
} = require("../middleware/authMiddleware");

router.post(
  "/send",
  protect,
  sendMessage
);

router.get(
  "/conversations",
  protect,
  getConversations
);

router.get(
  "/:userId",
  protect,
  getConversation
);

module.exports = router;