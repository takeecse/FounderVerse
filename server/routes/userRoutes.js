const express = require("express");
const router = express.Router();

const {
  getProfile,
  updateProfile,
  getAllUsers,
  getUserById,
  getConnections,
  blockUser,
  unblockUser,
} = require("../controllers/userController");

const {
  protect,
  optionalProtect,
} = require("../middleware/authMiddleware");

router.get("/", getAllUsers);

router.get(
  "/profile",
  protect,
  getProfile
);

router.put(
  "/profile",
  protect,
  updateProfile
);

router.get(
  "/connections",
  protect,
  getConnections
);

router.post("/:id/block", protect, blockUser);
router.delete("/:id/block", protect, unblockUser);

router.get("/:id", optionalProtect, getUserById);

module.exports = router;
