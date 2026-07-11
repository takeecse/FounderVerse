const User = require("../models/User");

const REQUIRED_PROFILE_FIELDS = [
  "name",
  "role",
  "location",
  "bio",
  "skills",
  "interests",
  "lookingFor",
];

const cleanText = (value) =>
  typeof value === "string" ? value.trim() : "";

const cleanList = (value) =>
  Array.isArray(value)
    ? value
        .map((item) => cleanText(item))
        .filter(Boolean)
    : [];

const getMissingProfileFields = (user) =>
  REQUIRED_PROFILE_FIELDS.filter((field) => {
    const value = user[field];

    if (Array.isArray(value)) {
      return value.length === 0;
    }

    return !cleanText(value);
  });

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

    if (req.body.name !== undefined) {
      user.name = cleanText(req.body.name);
    }

    if (req.body.bio !== undefined) {
      user.bio = cleanText(req.body.bio);
    }

    user.github =
      req.body.github !== undefined
        ? cleanText(req.body.github)
        : user.github;

    user.linkedin =
      req.body.linkedin !== undefined
        ? cleanText(req.body.linkedin)
        : user.linkedin;

    if (req.body.skills !== undefined) {
      user.skills = cleanList(req.body.skills);
    }

    if (req.body.role !== undefined) {
      user.role = cleanText(req.body.role);
    }

    if (req.body.location !== undefined) {
      user.location = cleanText(req.body.location);
    }

    if (req.body.interests !== undefined) {
      user.interests = cleanList(req.body.interests);
    }

    if (req.body.lookingFor !== undefined) {
      user.lookingFor = cleanList(req.body.lookingFor);
    }

    user.portfolio =
      req.body.portfolio !== undefined
        ? cleanText(req.body.portfolio)
        : user.portfolio;

    if (req.body.photoURL !== undefined) {
      const nextPhotoURL = req.body.photoURL;
      const canUsePhoto =
        typeof nextPhotoURL === "string" &&
        (nextPhotoURL === "" ||
          nextPhotoURL === user.photoURL ||
          nextPhotoURL.startsWith("data:image/"));

      if (!canUsePhoto) {
        return res.status(400).json({
          message:
            "Profile photo must be uploaded instead of pasted as a URL",
        });
      }

      user.photoURL = nextPhotoURL;
    }

    const missingFields = getMissingProfileFields(user);

    if (missingFields.length > 0) {
      return res.status(400).json({
        message: `Please complete required profile fields: ${missingFields.join(
          ", "
        )}`,
        missingFields,
      });
    }

    user.profileCompleted = true;

    await user.save();

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
