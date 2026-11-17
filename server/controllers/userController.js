const User = require("../models/User");
const mongoose = require("mongoose");
const {
  VERIFIABLE_ROLES,
  getPrimaryRole,
  getUserRoles,
  getVerificationMap,
  normalizeRoles,
} = require("../utils/roles");

const REQUIRED_PROFILE_FIELDS = [
  "name",
  "username",
  "roles",
  "location",
];

const USERNAME_PATTERN = /^[a-z0-9][a-z0-9_.]{2,23}$/;

const cleanText = (value) =>
  typeof value === "string" ? value.trim() : "";

const normalizeUsername = (value) =>
  cleanText(value).replace(/^@/, "").toLowerCase();

const cleanList = (value) =>
  Array.isArray(value)
    ? value
        .map((item) => cleanText(item))
        .filter(Boolean)
    : [];

const ensureRoleVerificationDefaults = (user) => {
  if (!user.verification) {
    user.verification = new Map();
  }

  (user.roles || []).forEach((role) => {
    if (
      VERIFIABLE_ROLES.includes(role) &&
      !user.verification.get(role)
    ) {
      user.verification.set(role, "pending");
    }
  });
};

const serializeUser = (user, options = {}) => {
  const value =
    typeof user.toObject === "function"
      ? user.toObject()
      : { ...user };

  delete value.password;
  delete value.blockedUsers;

  const systemRole = value.systemRole;
  const accountStatus = value.accountStatus || "active";
  delete value.systemRole;
  delete value.accountStatus;

  value.roles = getUserRoles(value);
  value.role = getPrimaryRole(value);
  value.verification = getVerificationMap(value.verification);
  value.profileCompleted = Boolean(value.profileCompleted && value.username);

  if (options.includePrivate) {
    value.isAdmin = systemRole === "admin";
    value.isSystem = systemRole === "system";
    value.accountStatus = accountStatus;
  }

  return value;
};

const getMissingProfileFields = (user) =>
  REQUIRED_PROFILE_FIELDS.filter((field) => {
    const value =
      field === "roles" ? getUserRoles(user) : user[field];

    if (Array.isArray(value)) {
      return value.length === 0;
    }

    return !cleanText(value);
  });

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      "-password +systemRole"
    );

    res.json(
      serializeUser(user, {
        includePrivate: true,
      })
    );
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

    if (req.body.username !== undefined) {
      const username = normalizeUsername(req.body.username);

      if (!USERNAME_PATTERN.test(username)) {
        return res.status(400).json({
          message: "Username must be 3–24 characters and use letters, numbers, dots, or underscores.",
          missingFields: ["username"],
        });
      }

      const usernameInUse = await User.exists({
        username,
        _id: { $ne: user._id },
      });

      if (usernameInUse) {
        return res.status(409).json({ message: "That username is already taken." });
      }

      user.username = username;
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

    if (
      req.body.roles !== undefined ||
      req.body.role !== undefined
    ) {
      const nextRoles = normalizeRoles(
        req.body.roles ?? req.body.role
      );

      if (nextRoles.length === 0) {
        return res.status(400).json({
          message:
            "Please choose at least one public role",
          missingFields: ["roles"],
        });
      }

      user.roles = nextRoles;
      user.role = nextRoles[0];
      ensureRoleVerificationDefaults(user);
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
    ).select("-password +systemRole");

    if (
      !userResponse?.profileCompleted ||
      getUserRoles(userResponse).length === 0
    ) {
      return res.status(500).json({
        message: "The profile could not be confirmed as saved. Please try again.",
      });
    }

    res.json(
      serializeUser(userResponse, {
        includePrivate: true,
      })
    );
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.username) {
      return res.status(409).json({ message: "That username is already taken." });
    }
    res.status(500).json({
      message: error.message,
    });
  }
};

const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({
      accountStatus: { $ne: "suspended" },
    }).select("-password");

    res.json(users.map((user) => serializeUser(user)));

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getUserById = async (req, res) => {
  try {
    const user = await User.findOne({
      _id: req.params.id,
      accountStatus: { $ne: "suspended" },
    }).select("-password");

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const value = serializeUser(user);

    if (req.user && req.user.id !== user._id.toString()) {
      const viewer = await User.findById(req.user.id).select("blockedUsers");
      value.isBlockedByMe = Boolean(viewer?.blockedUsers?.some(
        (blockedId) => blockedId.toString() === user._id.toString()
      ));
      value.hasBlockedMe = Boolean(user.blockedUsers?.some(
        (blockedId) => blockedId.toString() === req.user.id
      ));
    }

    res.json(value);

  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const blockUser = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid member" });
    }
    if (req.params.id === req.user.id) {
      return res.status(400).json({ message: "You cannot block yourself" });
    }

    const target = await User.findOne({
      _id: req.params.id,
      accountStatus: { $ne: "suspended" },
    }).select("_id");
    if (!target) return res.status(404).json({ message: "Member not found" });

    await User.updateOne(
      { _id: req.user.id },
      { $addToSet: { blockedUsers: target._id } }
    );
    req.app.get("io")
      ?.to(`user:${req.user.id}`)
      .to(`user:${target._id}`)
      .emit("user:block-updated", { userA: req.user.id, userB: target._id.toString() });
    res.json({ blocked: true, userId: target._id.toString() });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const unblockUser = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: "Invalid member" });
    }

    await User.updateOne(
      { _id: req.user.id },
      { $pull: { blockedUsers: req.params.id } }
    );
    req.app.get("io")
      ?.to(`user:${req.user.id}`)
      .to(`user:${req.params.id}`)
      .emit("user:block-updated", { userA: req.user.id, userB: req.params.id });
    res.json({ blocked: false, userId: req.params.id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getConnections = async (req, res) => {
  try {

    const user = await User.findById(
      req.user.id
    )
      .populate(
        "connections",
        "name email photoURL role roles verification location"
      );

    res.json(
      user.connections.map((connection) =>
        serializeUser(connection)
      )
    );

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
  blockUser,
  unblockUser,
};
