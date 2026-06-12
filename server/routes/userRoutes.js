const express = require("express");
const router = express.Router();

const {
  getProfile,
  updateProfile,
  getAllUsers,
  getUserById,
} = require("../controllers/userController");
const { protect } = require("../middleware/authMiddleware");

router.get("/", getAllUsers);
router.get("/profile", protect, getProfile);
router.put(
  "/profile",
  protect,
  updateProfile
);
router.get("/:id", getUserById);

module.exports = router;