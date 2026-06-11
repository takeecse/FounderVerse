const User = require("../models/User");

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    res.json(user);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    user.bio = req.body.bio || user.bio;
    user.github = req.body.github || user.github;
    user.linkedin = req.body.linkedin || user.linkedin;
    user.skills = req.body.skills || user.skills;

    const updatedUser = await user.save();

   const userResponse = await User.findById(
  req.user.id
).select("-password");

res.json(userResponse);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
};