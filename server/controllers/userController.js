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

    user.bio = req.body.bio ?? user.bio;
    user.github = req.body.github ?? user.github;
    user.linkedin = req.body.linkedin ?? user.linkedin;
    user.skills = req.body.skills ?? user.skills;

    user.role = req.body.role ?? user.role;
    user.location = req.body.location ?? user.location;
    user.interests =
      req.body.interests ?? user.interests;

    user.lookingFor =
      req.body.lookingFor ?? user.lookingFor;

    user.portfolio =
      req.body.portfolio ?? user.portfolio;

    user.photoURL =
      req.body.photoURL ?? user.photoURL;

    user.profileCompleted = true;

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

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password");

    res.json(users);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findById(
      req.params.id
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json(user);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getConnections = async (req, res) => {
  try {

    const user = await User.findById(
      req.user.id
    )
      .populate(
        "connections",
        "name email photoURL role location"
      );

    res.json(user.connections);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  getAllUsers,
  getUserById,
  getConnections,
};