const mongoose = require("mongoose");
const Report = require("../models/Report");
const Startup = require("../models/Startup");
const User = require("../models/User");
const VerificationApplication = require("../models/VerificationApplication");
const { createNotification } = require("./notificationController");
const { VERIFIABLE_ROLES, getVerificationMap } = require("../utils/roles");

const REPORT_REASONS = [
  "spam",
  "misleading",
  "harassment",
  "impersonation",
  "other",
];

const cleanText = (value, maxLength = 1200) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

const cleanAttachments = (items, firebaseUid) => {
  if (items === undefined) return [];
  if (!Array.isArray(items) || items.length > 5) return null;

  const attachments = [];
  for (const item of items) {
    const url = cleanText(item?.url, 1000);
    const name = cleanText(item?.name, 200);
    const contentType = cleanText(item?.contentType, 120).toLowerCase();
    const size = Number(item?.size);
    const isAllowedType = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "image/bmp",
      "application/pdf",
      "text/plain",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ].includes(contentType);
    let parsedUrl;

    try {
      parsedUrl = new URL(url);
    } catch {
      return null;
    }

    let decodedPath = "";
    try {
      decodedPath = decodeURIComponent(parsedUrl.pathname);
    } catch {
      return null;
    }

    if (
      parsedUrl.protocol !== "https:" ||
      !["firebasestorage.googleapis.com", "storage.googleapis.com"].includes(parsedUrl.hostname) ||
      !firebaseUid ||
      !decodedPath.includes(`/o/reports/${firebaseUid}/`) ||
      !name ||
      !contentType ||
      !isAllowedType ||
      !Number.isFinite(size) ||
      size <= 0 ||
      size > 8 * 1024 * 1024
    ) {
      return null;
    }

    attachments.push({ url, name, contentType, size });
  }

  return attachments;
};

const submitReport = async (req, res) => {
  try {
    const targetType = cleanText(req.body.targetType, 16).toLowerCase();
    const reason = cleanText(req.body.reason, 32).toLowerCase();
    const targetId = req.body.targetId;
    const attachments = cleanAttachments(req.body.attachments, req.user.profile.firebaseUid);

    if (!attachments) {
      return res.status(400).json({
        message: "Attachments must be uploaded files from FounderVerse storage (up to 5 files, 8 MB each)",
      });
    }

    if (!["user", "startup"].includes(targetType)) {
      return res.status(400).json({ message: "Choose a valid report target" });
    }

    if (!mongoose.Types.ObjectId.isValid(targetId)) {
      return res.status(400).json({ message: "Invalid report target" });
    }

    if (!REPORT_REASONS.includes(reason)) {
      return res.status(400).json({ message: "Choose a reason for the report" });
    }

    if (targetType === "user" && targetId === req.user.id) {
      return res.status(400).json({ message: "You cannot report your own profile" });
    }

    const target = targetType === "user"
      ? await User.findById(targetId).select("name accountStatus")
      : await Startup.findOne({
          _id: targetId,
          $or: [
            { moderationStatus: "published" },
            { moderationStatus: "banned" },
            { moderationStatus: { $exists: false } },
          ],
        }).select("title founder");

    if (!target || (targetType === "user" && target.accountStatus === "suspended")) {
      return res.status(404).json({ message: "This report target is no longer available" });
    }

    if (targetType === "startup" && target.founder.toString() === req.user.id) {
      return res.status(400).json({ message: "You cannot report your own startup" });
    }

    const existingReport = await Report.findOne({
      reporter: req.user.id,
      targetType,
      targetId,
      status: "pending",
    });

    if (existingReport) {
      return res.status(409).json({ message: "You already have a report awaiting review for this item" });
    }

    const report = await Report.create({
      reporter: req.user.id,
      targetType,
      targetId,
      targetName: targetType === "user" ? target.name : target.title,
      reason,
      details: cleanText(req.body.details),
      attachments,
    });

    try {
      await createNotification(req, {
        user: req.user.id,
        title: "Report received",
        message: `Your report about ${report.targetName} has been sent to the moderation team. We’ll notify you when it is reviewed.`,
      });
    } catch (notificationError) {
      console.error("Could not send report confirmation notification:", notificationError.message);
    }

    req.app.get("io")?.to("admins").emit("admin:inbox-updated");

    res.status(201).json({
      message: "Report submitted for admin review",
      reportId: report._id,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getReports = async (req, res) => {
  try {
    const query = {};
    const status = cleanText(req.query.status, 16).toLowerCase();
    const targetType = cleanText(req.query.targetType, 16).toLowerCase();

    if (["pending", "resolved", "dismissed"].includes(status)) {
      query.status = status;
    }

    if (["user", "startup"].includes(targetType)) {
      query.targetType = targetType;
    }

    const reports = await Report.find(query)
      .sort({ status: 1, createdAt: -1 })
      .limit(200)
      .populate("reporter", "name email")
      .populate("reviewedBy", "name email");

    const userIds = reports.filter((report) => report.targetType === "user").map((report) => report.targetId);
    const startupIds = reports.filter((report) => report.targetType === "startup").map((report) => report.targetId);
    const [users, startups] = await Promise.all([
      User.find({ _id: { $in: userIds } }).select("_id verification"),
      Startup.find({ _id: { $in: startupIds } }).select("_id verificationStatus"),
    ]);
    const userById = new Map(users.map((user) => [user._id.toString(), user]));
    const startupById = new Map(startups.map((startup) => [startup._id.toString(), startup]));

    res.json(reports.map((report) => {
      const value = report.toObject();
      const target = report.targetType === "user"
        ? userById.get(report.targetId.toString())
        : startupById.get(report.targetId.toString());

      value.targetVerification = report.targetType === "user"
        ? VERIFIABLE_ROLES.filter((role) => getVerificationMap(target?.verification)[role] === "verified")
        : { isVerified: target?.verificationStatus === "verified" };
      return value;
    }));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const reviewReport = async (req, res) => {
  try {
    const status = cleanText(req.body.status, 16).toLowerCase();

    const action = cleanText(req.body.action, 32).toLowerCase();

    if (!["resolved", "dismissed"].includes(status)) {
      return res.status(400).json({ message: "Report review must resolve or dismiss the report" });
    }

    if (action && !["ban_startup", "remove_verification"].includes(action)) {
      return res.status(400).json({ message: "Choose a valid moderation action" });
    }

    if (action && status !== "resolved") {
      return res.status(400).json({ message: "A moderation action must resolve the report" });
    }

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (report.status !== "pending") {
      return res.status(409).json({ message: "This report has already been reviewed" });
    }

    if (action === "ban_startup") {
      if (report.targetType !== "startup") {
        return res.status(400).json({ message: "Only a startup report can trigger a startup ban" });
      }
      if (!cleanText(req.body.resolutionNote)) {
        return res.status(400).json({ message: "Add a reason for the startup ban" });
      }

      const startup = await Startup.findById(report.targetId);
      if (!startup) {
        return res.status(404).json({ message: "The reported startup no longer exists" });
      }
      if (startup.moderationStatus === "banned") {
        return res.status(409).json({ message: "This startup is already temporarily banned" });
      }

      const reason = cleanText(req.body.resolutionNote) || `Reported for ${report.reason}`;
      const now = new Date();
      const appealDeadline = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      const verificationWasRemoved = startup.verificationStatus === "verified";
      const verificationWasPending = startup.verificationStatus === "pending";
      startup.moderationStatus = "banned";
      startup.banReason = reason;
      startup.banMessage = `FounderVerse has temporarily banned this startup after a moderation review. You may appeal before ${appealDeadline.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", timeZone: "UTC" })}. If no appeal is approved by then, the startup will be permanently removed.`;
      startup.bannedAt = now;
      startup.appealDeadline = appealDeadline;
      startup.appeal = { message: "", status: "none", submittedAt: null, reviewedAt: null, reviewedBy: null, resolutionNote: "", seenBy: [] };
      if (verificationWasRemoved) {
        startup.verificationStatus = "revoked";
        startup.verifiedAt = null;
        startup.verificationNote = reason;
        await VerificationApplication.updateMany(
          { startup: startup._id, status: "verified" },
          { $set: { status: "revoked", reviewedBy: req.user.id, reviewedAt: now, reviewerNote: reason } }
        );
      }
      if (verificationWasPending) {
        startup.verificationStatus = "rejected";
        startup.verificationNote = reason;
        await VerificationApplication.updateMany(
          { startup: startup._id, status: "pending" },
          { $set: { status: "rejected", reviewedBy: req.user.id, reviewedAt: now, reviewerNote: reason } }
        );
      }
      await startup.save();

      try {
        await createNotification(req, {
          user: startup.founder,
          title: "Startup temporarily banned",
          message: `${startup.title} was temporarily banned after a moderation review. ${startup.banMessage}${verificationWasRemoved ? " Its verified badge was also removed." : verificationWasPending ? " Its pending verification request was closed." : ""}`,
        });
      } catch (notificationError) {
        console.error("Could not notify startup founder about report action:", notificationError.message);
      }
    }

    if (action === "remove_verification") {
      const reason = cleanText(req.body.resolutionNote);
      if (!reason) {
        return res.status(400).json({ message: "Add a reason for removing verification" });
      }

      if (report.targetType === "startup") {
        const startup = await Startup.findById(report.targetId);
        if (!startup) return res.status(404).json({ message: "The reported startup no longer exists" });
        if (startup.verificationStatus !== "verified") {
          return res.status(409).json({ message: "This startup does not currently have a verified badge" });
        }

        startup.verificationStatus = "revoked";
        startup.verifiedAt = null;
        startup.verificationNote = reason;
        await startup.save();
        await VerificationApplication.updateMany(
          { startup: startup._id, status: "verified" },
          { $set: { status: "revoked", reviewedBy: req.user.id, reviewedAt: new Date(), reviewerNote: reason } }
        );
        try {
          await createNotification(req, {
            user: startup.founder,
            title: "Startup verification removed",
            message: `Verification for ${startup.title} was removed after a moderation review. ${reason}`,
          });
        } catch (notificationError) {
          console.error("Could not notify founder about verification removal:", notificationError.message);
        }
      } else {
        const user = await User.findById(report.targetId);
        if (!user) return res.status(404).json({ message: "The reported member no longer exists" });
        const verification = getVerificationMap(user.verification);
        const verifiedRoles = VERIFIABLE_ROLES.filter((role) => verification[role] === "verified");
        if (!verifiedRoles.length) {
          return res.status(409).json({ message: "This member does not currently have a verified badge" });
        }

        if (!user.verification) user.verification = new Map();
        verifiedRoles.forEach((role) => user.verification.set(role, "revoked"));
        await user.save();
        await VerificationApplication.updateMany(
          {
            user: user._id,
            role: { $in: verifiedRoles },
            status: "verified",
            $or: [{ subjectType: "user" }, { subjectType: { $exists: false } }],
          },
          { $set: { status: "revoked", reviewedBy: req.user.id, reviewedAt: new Date(), reviewerNote: reason } }
        );
        try {
          await createNotification(req, {
            user: user._id,
            title: "Profile verification removed",
            message: `Your verified badge was removed after a moderation review. ${reason}`,
          });
        } catch (notificationError) {
          console.error("Could not notify member about verification removal:", notificationError.message);
        }
      }
    }

    report.status = action ? "resolved" : status;
    report.reviewedBy = req.user.id;
    report.reviewedAt = new Date();
    report.resolutionNote = cleanText(req.body.resolutionNote);
    report.resolutionAction = action;
    await report.save();

    try {
      await createNotification(req, {
        user: report.reporter,
        title: "Report reviewed",
        message: report.status === "resolved"
          ? `The moderation team reviewed your report about ${report.targetName} and took action.${report.resolutionNote ? ` ${report.resolutionNote}` : ""}`
          : `The moderation team reviewed your report about ${report.targetName} and closed it.${report.resolutionNote ? ` ${report.resolutionNote}` : ""}`,
      });
    } catch (notificationError) {
      console.error("Could not notify report submitter about review:", notificationError.message);
    }

    req.app.get("io")?.to("admins").emit("admin:inbox-updated");

    await report.populate("reporter", "name email");
    await report.populate("reviewedBy", "name email");
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getReports,
  reviewReport,
  submitReport,
};
