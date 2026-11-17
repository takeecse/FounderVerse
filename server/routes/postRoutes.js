const express = require("express");
const router = express.Router();
const {
  addComment,
  createPost,
  getComments,
  getFeed,
  getStartupPosts,
  getUserPosts,
  toggleReaction,
} = require("../controllers/postController");
const { optionalProtect, protect } = require("../middleware/authMiddleware");

router.get("/feed", optionalProtect, getFeed);
router.get("/user/:id", optionalProtect, getUserPosts);
router.get("/startup/:id", optionalProtect, getStartupPosts);
router.get("/:id/comments", optionalProtect, getComments);
router.post("/", protect, createPost);
router.put("/:id/reaction", protect, toggleReaction);
router.post("/:id/comments", protect, addComment);

module.exports = router;
