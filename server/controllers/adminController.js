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

const cleanText = (value, maxLength = 1200) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

const getOverview = async (req, res) => {
  try {
    const [
      userCount,
      suspendedUserCount,
      startupCount,
      hiddenStartupCount,
      pendingReportCount,
      pendingVerificationCount,
      pendingStartupAppealCount,
      unreadReportCount,
      unreadVerificationCount,
      unreadStartupAppealCount,
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
      Startup.countDocuments({ "appeal.status": "pending" }),
      Report.countDocuments({ status: "pending", adminSeenBy: { $ne: req.user.id } }),
      VerificationApplication.countDocuments({ status: "pending", adminSeenBy: { $ne: req.user.id } }),
      Startup.countDocuments({
        "appeal.status": "pending",
        "appeal.seenBy": { $ne: req.user.id },
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
      pendingStartupAppealCount,
      unreadReportCount,
      unreadVerificationCount,
      unreadStartupAppealCount,
      adminInboxCount: unreadReportCount + unreadVerificationCount + unreadStartupAppealCount,
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

const markAdminInboxRead = async (req, res) => {
  try {
    await Promise.all([
      Report.updateMany(
        { status: "pending", adminSeenBy: { $ne: req.user.id } },
        { $addToSet: { adminSeenBy: req.user.id } }
      ),
      VerificationApplication.updateMany(
        { status: "pending", adminSeenBy: { $ne: req.user.id } },
        { $addToSet: { adminSeenBy: req.user.id } }
      ),
      Startup.updateMany(
        { "appeal.status": "pending", "appeal.seenBy": { $ne: req.user.id } },
        { $addToSet: { "appeal.seenBy": req.user.id } }
      ),
    ]);
    res.json({ message: "Admin inbox marked as viewed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
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
        .sort({ status: 1, createdAt: -1 })
        .populate(
          "user",
          "name email photoURL role roles verification location linkedin portfolio"
        )
        .populate("startup", "title verificationStatus verifiedAt")
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

    if (!["verified", "rejected", "revoked"].includes(status)) {
      return res.status(400).json({
        message:
          "Choose approve, reject, or remove verification",
      });
    }

    const application =
      await VerificationApplication.findById(req.params.id);

    if (!application) {
      return res.status(404).json({
        message: "Verification request not found",
      });
    }

    if (status === "revoked" && application.status !== "verified") {
      return res.status(409).json({
        message: "Only approved verification can be removed",
      });
    }

    if (status !== "revoked" && application.status !== "pending") {
      return res.status(409).json({
        message: "This verification request has already been reviewed",
      });
    }

    const isStartupApplication =
      application.subjectType === "startup" || Boolean(application.startup);
    let applicantName = "your profile";

    application.status = status;
    application.reviewedBy = req.user.id;
    application.reviewedAt = new Date();
    application.reviewerNote = cleanText(
      req.body.reviewerNote
    );

    if (isStartupApplication) {
      const startup = await Startup.findOne({
        _id: application.startup,
        founder: application.user,
      });

      if (!startup) {
        return res.status(404).json({ message: "Startup verification subject not found" });
      }
      if (status === "verified" && startup.moderationStatus === "banned") {
        return res.status(409).json({ message: "A temporarily banned startup cannot be verified" });
      }

      startup.verificationStatus = status;
      startup.verifiedAt = status === "verified" ? new Date() : null;
      startup.verificationNote = application.reviewerNote;
      await startup.save();
      applicantName = startup.title;
    } else {
      const user = await User.findById(application.user);

      if (!user) {
        return res.status(404).json({ message: "Verification applicant not found" });
      }

      if (!user.verification) {
        user.verification = new Map();
      }

      user.verification.set(application.role, status);
      await user.save();
      applicantName = application.role;
    }

    await application.save();

    if (status === "revoked") {
      await VerificationApplication.updateMany(
        isStartupApplication
          ? { startup: application.startup, status: "verified" }
          : {
              user: application.user,
              role: application.role,
              status: "verified",
              $or: [{ subjectType: "user" }, { subjectType: { $exists: false } }],
            },
        {
          $set: {
            status: "revoked",
            reviewedBy: req.user.id,
            reviewedAt: application.reviewedAt,
            reviewerNote: application.reviewerNote,
          },
        }
      );
    }

    const notificationTitle = status === "verified"
      ? `${isStartupApplication ? "Startup" : applicantName} verification approved`
      : status === "revoked"
        ? `${isStartupApplication ? "Startup" : applicantName} verification removed`
        : `${isStartupApplication ? "Startup" : applicantName} verification rejected`;
    const notificationMessage = status === "verified"
      ? isStartupApplication
        ? `${applicantName} has been verified on FounderVerse.`
        : `Your ${application.role} verification has been approved.`
      : status === "revoked"
        ? isStartupApplication
          ? `Verification for ${applicantName} has been removed by an administrator.${application.reviewerNote ? ` ${application.reviewerNote}` : ""}`
          : `Your ${application.role} verification has been removed by an administrator.${application.reviewerNote ? ` ${application.reviewerNote}` : ""}`
        : `${isStartupApplication ? `Your request to verify ${applicantName}` : `Your ${application.role} verification`} was rejected.${application.reviewerNote ? ` ${application.reviewerNote}` : ""}`;

    try {
      await createNotification(req, {
        user: application.user,
        title: notificationTitle,
        message: notificationMessage,
      });
    } catch (notificationError) {
      console.error("Could not notify verification applicant:", notificationError.message);
    }

    const populated =
      await VerificationApplication.findById(
        application._id
      )
        .populate(
          "user",
          "name email photoURL role roles verification location linkedin portfolio"
        )
        .populate("startup", "title verificationStatus verifiedAt")
        .populate("reviewedBy", "name email");

    req.app.get("io")?.to("admins").emit("admin:inbox-updated");
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
        delete value.blockedUsers;
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
      .populate("teamMembers", "name email photoURL")
      .populate("appeal.reviewedBy", "name email");

    res.json(startups);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const moderateStartup = async (req, res) => {
  try {
    const moderationStatus = cleanText(req.body.moderationStatus).toLowerCase();

    if (!["published", "hidden", "banned"].includes(moderationStatus)) {
      return res.status(400).json({
        message: "Startup moderation status must be published, hidden, or banned",
      });
    }

    const startup = await Startup.findById(req.params.id);

    if (!startup) {
      return res.status(404).json({ message: "Startup not found" });
    }

    if (moderationStatus === "banned") {
      if (startup.moderationStatus === "banned") {
        return res.status(409).json({ message: "This startup is already temporarily banned" });
      }
      const verificationWasRemoved = startup.verificationStatus === "verified";
      const verificationWasPending = startup.verificationStatus === "pending";
      const now = new Date();
      const appealDeadline = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const reason = cleanText(req.body.reason) || "A moderation review found this startup violates FounderVerse rules.";
      startup.moderationStatus = "banned";
      startup.banReason = reason;
      startup.appealDeadline = appealDeadline;
      startup.bannedAt = now;
      startup.banMessage = `FounderVerse has temporarily banned this startup after a moderation review. You may appeal before ${appealDeadline.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })}. If no appeal is approved by then, the startup will be permanently removed.`;
      startup.appeal = { message: "", status: "none", submittedAt: null, reviewedAt: null, reviewedBy: null, resolutionNote: "", seenBy: [] };
      if (startup.verificationStatus === "pending") {
        startup.verificationStatus = "rejected";
        startup.verificationNote = reason;
        await VerificationApplication.updateMany(
          { startup: startup._id, status: "pending" },
          { $set: { status: "rejected", reviewedBy: req.user.id, reviewedAt: now, reviewerNote: reason } }
        );
      }
      if (startup.verificationStatus === "verified") {
        startup.verificationStatus = "revoked";
        startup.verifiedAt = null;
        startup.verificationNote = reason;
        await VerificationApplication.updateMany(
          { startup: startup._id, status: "verified" },
          { $set: { status: "revoked", reviewedBy: req.user.id, reviewedAt: now, reviewerNote: reason } }
        );
      }
    } else {
      startup.moderationStatus = moderationStatus;
      if (moderationStatus === "published") {
        startup.banReason = "";
        startup.banMessage = "";
        startup.bannedAt = null;
        startup.appealDeadline = null;
        startup.appeal = { message: "", status: "none", submittedAt: null, reviewedAt: null, reviewedBy: null, resolutionNote: "", seenBy: [] };
      }
    }

    await startup.save();

    if (moderationStatus === "banned") {
      await createNotification(req, {
        user: startup.founder,
        title: "Startup temporarily banned",
        message: `${startup.title} was temporarily banned after a moderation review. ${startup.banMessage}${verificationWasRemoved ? " Its verified badge was also removed." : verificationWasPending ? " Its pending verification request was closed." : ""}`,
      });
    }

    req.app.get("io")?.to("admins").emit("admin:inbox-updated");
    res.json(startup);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteAdminStartup = async (req, res) => {
  try {
    const startup = await Startup.findById(req.params.id);
    if (!startup) return res.status(404).json({ message: "Startup not found" });

    await Startup.deleteOne({ _id: startup._id });
    await createNotification(req, {
      user: startup.founder,
      title: "Startup permanently removed",
      message: `${startup.title} was permanently removed from FounderVerse by the moderation team.`,
    });
    req.app.get("io")?.to("admins").emit("admin:inbox-updated");

    res.json({ message: "Startup permanently removed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getStartupAppeals = async (req, res) => {
  try {
    const startups = await Startup.find({ "appeal.status": "pending" })
      .sort({ "appeal.submittedAt": 1 })
      .populate("founder", "name email photoURL")
      .populate("appeal.reviewedBy", "name email");
    res.json(startups);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const reviewStartupAppeal = async (req, res) => {
  try {
    const status = cleanText(req.body.status).toLowerCase();
    if (!["accepted", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Appeal decision must be accepted or rejected" });
    }

    const startup = await Startup.findById(req.params.id);
    if (!startup) return res.status(404).json({ message: "Startup not found" });
    if (startup.appeal?.status !== "pending") {
      return res.status(409).json({ message: "This appeal has already been reviewed" });
    }

    startup.appeal.status = status;
    startup.appeal.reviewedAt = new Date();
    startup.appeal.reviewedBy = req.user.id;
    startup.appeal.resolutionNote = cleanText(req.body.resolutionNote);

    if (status === "accepted") {
      startup.moderationStatus = "published";
      startup.banReason = "";
      startup.banMessage = "";
      startup.bannedAt = null;
      startup.appealDeadline = null;
    }

    await startup.save();
    await createNotification(req, {
      user: startup.founder,
      title: status === "accepted" ? "Startup appeal approved" : "Startup appeal reviewed",
      message: status === "accepted"
        ? `${startup.title} has been restored after your appeal was approved.${startup.appeal.resolutionNote ? ` ${startup.appeal.resolutionNote}` : ""}`
        : `Your appeal for ${startup.title} was not approved. The temporary ban remains until ${startup.appealDeadline?.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" }) || "the appeal deadline"}.${startup.appeal.resolutionNote ? ` ${startup.appeal.resolutionNote}` : ""}`,
    });
    req.app.get("io")?.to("admins").emit("admin:inbox-updated");

    const populated = await Startup.findById(startup._id)
      .populate("founder", "name email photoURL")
      .populate("appeal.reviewedBy", "name email");
    res.json(populated);
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
  deleteAdminStartup,
  getStartupAppeals,
  reviewStartupAppeal,
  markAdminInboxRead,
};
