const express = require("express");
const router = express.Router();

const {
  registerUser,
  loginUser,
  googleLogin,
  firebaseLogin,
} = require("../controllers/authController");

router.get("/test", (req, res) => {
  res.json({
    message: "Auth Route Working",
  });
});

router.post("/register", registerUser);
router.post("/login", loginUser);
router.post("/firebase", firebaseLogin);
router.post("/google", googleLogin);

module.exports = router;
