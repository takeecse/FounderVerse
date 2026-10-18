const jwt = require("jsonwebtoken");
const User = require("../models/User");
const {
  isConfiguredAdminEmail,
  isConfiguredSystemEmail,
} = require("../utils/roles");

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET
      );

      const user = await User.findById(
        decoded.id
      ).select("-password +systemRole");

      if (!user) {
        return res.status(401).json({
          message: "User account no longer exists",
        });
      }

      if (user.accountStatus === "suspended") {
        return res.status(403).json({
          message: "This account has been suspended. Contact support for help.",
        });
      }

      if (isConfiguredSystemEmail(user.email)) {
        if (user.systemRole !== "system") {
          user.systemRole = "system";
          await user.save();
        }
      } else if (user.systemRole === "system") {
        user.systemRole = isConfiguredAdminEmail(user.email)
          ? "admin"
          : "user";
        await user.save();
      } else if (
        user.systemRole === "user" &&
        isConfiguredAdminEmail(user.email)
      ) {
        user.systemRole = "admin";
        await user.save();
      }

      req.user = {
        id: user._id.toString(),
        profile: user,
        authMethod: decoded.authMethod || "legacy",
      };

      next();
    } else {
      return res.status(401).json({
        message: "Not authorized",
      });
    }
  } catch (error) {
    res.status(401).json({
      message: "Token failed",
    });
  }
};

const requireAdmin = (req, res, next) => {
  if (
    !["admin", "system"].includes(req.user?.profile?.systemRole) ||
    req.user?.authMethod !== "firebase"
  ) {
    return res.status(403).json({
      message: "Forbidden",
    });
  }

  next();
};

const requireSystem = (req, res, next) => {
  if (
    req.user?.profile?.systemRole !== "system" ||
    req.user?.authMethod !== "firebase"
  ) {
    return res.status(403).json({
      message: "System operator access required",
    });
  }

  next();
};

module.exports = {
  protect,
  requireAdmin,
  requireSystem,
};
