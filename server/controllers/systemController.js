const mongoose = require("mongoose");
const Request = require("../models/Request");
const Report = require("../models/Report");
const Startup = require("../models/Startup");
const User = require("../models/User");
const VerificationApplication = require("../models/VerificationApplication");
const {
  isConfiguredAdminEmail,
  isConfiguredSystemEmail,
} = require("../utils/roles");

const getSystemOverview = async (req, res) => {
  try {
    const [
      userCount,
      suspendedUserCount,
      founderCount,
      investorCount,
      mentorCount,
      collaboratorCount,
      startupCount,
      hiddenStartupCount,
      pendingRequestCount,
      pendingReportCount,
      pendingVerificationCount,
      operatorAccounts,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ accountStatus: "suspended" }),
      User.countDocuments({
        $or: [{ roles: "Founder" }, { role: "Founder" }],
      }),
      User.countDocuments({
        $or: [{ roles: "Investor" }, { role: "Investor" }],
      }),
      User.countDocuments({
        $or: [{ roles: "Mentor" }, { role: "Mentor" }],
      }),
      User.countDocuments({
        $or: [
          { roles: "Collaborator" },
          { roles: "Collaborator/Seeker" },
          { roles: "Seeker" },
          { role: "Collaborator/Seeker" },
          { role: "Seeker" },
        ],
      }),
      Startup.countDocuments(),
      Startup.countDocuments({ moderationStatus: "hidden" }),
      Request.countDocuments({ status: "pending" }),
      Report.countDocuments({ status: "pending" }),
      VerificationApplication.countDocuments({ status: "pending" }),
      User.find({ systemRole: { $in: ["admin", "system"] } })
        .select("name email accountStatus +systemRole")
        .sort({ systemRole: 1, name: 1 }),
    ]);

    res.json({
      environment: process.env.NODE_ENV || "development",
      uptimeSeconds: Math.floor(process.uptime()),
      database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      counts: {
        users: userCount,
        suspendedUsers: suspendedUserCount,
        founders: founderCount,
        investors: investorCount,
        mentors: mentorCount,
        collaborators: collaboratorCount,
        startups: startupCount,
        hiddenStartups: hiddenStartupCount,
        pendingRequests: pendingRequestCount,
        pendingReports: pendingReportCount,
        pendingVerifications: pendingVerificationCount,
      },
      operatorAccounts: operatorAccounts.map((user) => ({
        id: user._id,
        name: user.name,
        email: user.email,
        systemRole: user.systemRole,
        accountStatus: user.accountStatus || "active",
        isConfigured: user.systemRole === "system"
          ? isConfiguredSystemEmail(user.email)
          : isConfiguredAdminEmail(user.email),
      })),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSystemAccounts = async (req, res) => {
  try {
    const accounts = await User.find()
      .select("name email accountStatus createdAt +systemRole")
      .sort({ createdAt: -1 })
      .limit(200);

    res.json(accounts.map((user) => ({
      id: user._id,
      name: user.name,
      email: user.email,
      systemRole: user.systemRole || "user",
      accountStatus: user.accountStatus || "active",
      isConfigured: user.systemRole === "system"
        ? isConfiguredSystemEmail(user.email)
        : isConfiguredAdminEmail(user.email),
    })));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateOperatorAccess = async (req, res) => {
  try {
    const systemRole = String(req.body.systemRole || "").trim().toLowerCase();

    if (!["user", "admin"].includes(systemRole)) {
      return res.status(400).json({
        message: "System operators may grant or revoke administrator access only",
      });
    }

    const user = await User.findById(req.params.id).select("+systemRole");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        message: "You cannot change your own system access",
      });
    }

    if (user.systemRole === "system" || isConfiguredSystemEmail(user.email)) {
      return res.status(403).json({
        message: "System operator accounts are managed through server configuration",
      });
    }

    if (isConfiguredAdminEmail(user.email) && systemRole !== "admin") {
      return res.status(400).json({
        message: "Remove this email from ADMIN_EMAILS before revoking configured administrator access",
      });
    }

    if (systemRole === "admin" && user.accountStatus === "suspended") {
      return res.status(400).json({
        message: "Reactivate this account before granting administrator access",
      });
    }

    user.systemRole = systemRole;
    await user.save();

    res.json({
      id: user._id,
      name: user.name,
      email: user.email,
      systemRole: user.systemRole,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSystemOverview,
  getSystemAccounts,
  updateOperatorAccess,
};
