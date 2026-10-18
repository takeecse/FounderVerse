const Startup = require("../models/Startup");
const User = require("../models/User");
const Report = require("../models/Report");
const VerificationApplication = require("../models/VerificationApplication");
const {
  createNotification,
} = require("./notificationController");
const {
  USER_ROLES,
  VERIFIABLE_ROLES,
  getPrimaryRole,
  getUserRoles,
  normalizeRoles,
} = require("../utils/roles");

const cleanText = (value) =>
  typeof value === "string" ? value.trim() : "";

const getOverview = async (req, res) => {
  try {
    const [
      userCount,
      suspendedUserCount,
      startupCount,
      hiddenStartupCount,
      pendingReportCount,
      pendingVerificationCount,
      verifiedApplicationCount,
      rejectedApplicationCount,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ accountStatus: "suspended" }),
      Startup.countDocuments(),
      Startup.countDocuments({ moderationStatus: "hidden" }),
      Report.countDocuments({ status: "pending" }),
      VerificationApplication.countDocuments({
        status: "pending",
      }),
      VerificationApplication.countDocuments({
        status: "verified",
      }),
      VerificationApplication.countDocuments({
        status: "rejected",
      }),
    ]);

    const roleCounts = {};

    await Promise.all(
      USER_ROLES.map(async (role) => {
        roleCounts[role] = await User.countDocuments(
          role === "Collaborator"
            ? {
                $or: [
                  { roles: role },
                  { roles: "Collaborator/Seeker" },
                  { roles: "Seeker" },
                  { role: "Collaborator/Seeker" },
                  { role: "Seeker" },
                ],
              }
            : { $or: [{ roles: role }, { role }] }
        );
      })
    );

    const verificationCounts = {};

    await Promise.all(
      VERIFIABLE_ROLES.map(async (role) => {
        verificationCounts[role] = {
          pending:
            await VerificationApplication.countDocuments({
              role,
              status: "pending",
            }),
          verified:
            await VerificationApplication.countDocuments({
              role,
              status: "verified",
            }),
          rejected:
            await VerificationApplication.countDocuments({
              role,
              status: "rejected",
            }),
        };
      })
    );

    res.json({
      userCount,
      suspendedUserCount,
      startupCount,
      hiddenStartupCount,
      pendingReportCount,
      pendingVerificationCount,
      verifiedApplicationCount,
      rejectedApplicationCount,
      roleCounts,
      verificationCounts,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getVerificationApplications = async (req, res) => {
  try {
    const query = {};

    if (req.query.role) {
      query.role = req.query.role;
    }

    if (req.query.status) {
      query.status = req.query.status;
    }

    const applications =
      await VerificationApplication.find(query)
        .sort({ createdAt: -1 })
        .populate(
          "user",
          "name email photoURL role roles verification location linkedin portfolio"
        )
        .populate("reviewedBy", "name email");

    res.json(applications);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const reviewVerificationApplication = async (req, res) => {
  try {
    const status = cleanText(req.body.status).toLowerCase();

    if (!["verified", "rejected"].includes(status)) {
      return res.status(400).json({
        message:
          "Verification decision must be verified or rejected",
      });
    }

    const application =
      await VerificationApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        message: "Verification request not found",
      });
    }

    application.status = status;
    application.reviewedBy = req.user.id;
    application.reviewedAt = new Date();
    application.reviewerNote = cleanText(
      req.body.reviewerNote
    );

    await application.save();

    const user = await User.findById(application.user);

    if (user) {
      if (!user.verification) {
        user.verification = new Map();
      }

      user.verification.set(application.role, status);
      await user.save();

      await createNotification(req, {
        user: user._id,
        title:
          status === "verified"
            ? `${application.role} Verification Approved`
            : `${application.role} Verification Rejected`,
        message:
          status === "verified"
            ? `Your ${application.role} verification has been approved.`
            : `Your ${application.role} verification was rejected.${
                application.reviewerNote
                  ? ` ${application.reviewerNote}`
                  : ""
              }`,
      });
    }

    const populated =
      await VerificationApplication.findById(
        application._id
      )
        .populate(
          "user",
          "name email photoURL role roles verification location linkedin portfolio"
        )
        .populate("reviewedBy", "name email");

    res.json(populated);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      .select("-password +systemRole")
      .sort({ createdAt: -1 });

    res.json(
      users.map((user) => {
        const value = user.toObject();
        delete value.password;
        value.roles = getUserRoles(value);
        value.role = getPrimaryRole(value);
        value.isAdmin = value.systemRole === "admin";
        value.isSystem = value.systemRole === "system";
        return value;
      })
    );
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("+systemRole");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user._id.toString() === req.user.id) {
      return res.status(400).json({
        message: "Administrators cannot modify their own stakeholder roles or account status here",
      });
    }

    if (["admin", "system"].includes(user.systemRole)) {
      return res.status(403).json({
        message: "Only a system operator can change an elevated account",
      });
    }

    if (req.body.roles !== undefined) {
      const roles = normalizeRoles(req.body.roles);

      if (!roles.length) {
        return res.status(400).json({
          message: "Assign at least one stakeholder role",
        });
      }

      user.roles = roles;
    }

    if (req.body.accountStatus !== undefined) {
      const accountStatus = cleanText(req.body.accountStatus).toLowerCase();

      if (!["active", "suspended"].includes(accountStatus)) {
        return res.status(400).json({
          message: "Account status must be active or suspended",
        });
      }

      user.accountStatus = accountStatus;
    }

    await user.save();

    if (user.accountStatus === "suspended") {
      const io = req.app.get("io");
      io?.in(`user:${user._id}`).disconnectSockets(true);
    }

    const value = user.toObject();
    delete value.password;
    value.roles = getUserRoles(value);
    value.role = getPrimaryRole(value);
    res.json(value);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStartups = async (req, res) => {
  try {
    const startups = await Startup.find()
      .sort({ createdAt: -1 })
      .populate(
        "founder",
        "name email photoURL role roles verification"
      )
      .populate("teamMembers", "name email photoURL");

    res.json(startups);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const moderateStartup = async (req, res) => {
  try {
    const moderationStatus = cleanText(
      req.body.moderationStatus
    ).toLowerCase();

    if (!["published", "hidden"].includes(moderationStatus)) {
      return res.status(400).json({
        message: "Startup moderation status must be published or hidden",
      });
    }

    const startup = await Startup.findById(req.params.id);

    if (!startup) {
      return res.status(404).json({ message: "Startup not found" });
    }

    startup.moderationStatus = moderationStatus;
    await startup.save();
    res.json(startup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getModerationQueue = async (req, res) => {
  try {
    const [recentUsers, recentStartups] =
      await Promise.all([
        User.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .select("name email roles role verification createdAt"),
        Startup.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .populate("founder", "name email"),
      ]);

    res.json({
      recentUsers,
      recentStartups,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getModerationQueue,
  getOverview,
  getStartups,
  getUsers,
  updateUser,
  moderateStartup,
  getVerificationApplications,
  reviewVerificationApplication,
};
