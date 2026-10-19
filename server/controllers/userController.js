const User = require("../models/User");
const {
  getPrimaryRole,
  getUserRoles,
  getVerificationMap,
  normalizeRoles,
} = require("../utils/roles");

const REQUIRED_PROFILE_FIELDS = [
  "name",
  "roles",
  "location",
];

const cleanText = (value) =>
  typeof value === "string" ? value.trim() : "";

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
      ["Founder", "Investor", "Mentor"].includes(role) &&
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

  const systemRole = value.systemRole;
  const accountStatus = value.accountStatus || "active";
  delete value.systemRole;
  delete value.accountStatus;

  value.roles = getUserRoles(value);
  value.role = getPrimaryRole(value);
  value.verification = getVerificationMap(value.verification);

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

    console.log("PROFILE UPDATE BODY:", req.body);
console.log("ROLES RECEIVED:", req.body.roles, req.body.role);

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

    res.json(serializeUser(user));

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
};
