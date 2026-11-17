const VerificationApplication = require("../models/VerificationApplication");
const User = require("../models/User");
const Startup = require("../models/Startup");
const { createNotification } = require("./notificationController");
const {
  getVerificationMap,
  getUserRoles,
  isVerifiableRole,
  normalizeRole,
} = require("../utils/roles");

const cleanText = (value, maxLength = 1200) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

const cleanEvidence = (value = {}) => {
  const evidence = value && typeof value === "object" ? value : {};

  return {
    organizationName: cleanText(evidence.organizationName, 200),
    website: cleanText(evidence.website, 500),
    linkedin: cleanText(evidence.linkedin, 500),
    background: cleanText(evidence.background, 1200),
    notes: cleanText(evidence.notes, 1200),
  };
};

const ALLOWED_ATTACHMENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/bmp",
  "application/pdf",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const cleanAttachments = (items, firebaseUid) => {
  if (items === undefined) return [];
  if (!Array.isArray(items) || items.length > 5) return null;

  const attachments = [];
  for (const item of items) {
    const url = cleanText(item?.url, 1000);
    const name = cleanText(item?.name, 200);
    const contentType = cleanText(item?.contentType, 120).toLowerCase();
    const size = Number(item?.size);
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
      !decodedPath.includes(`/o/verification/${firebaseUid}/`) ||
      !name ||
      !ALLOWED_ATTACHMENT_TYPES.has(contentType) ||
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

const serializeApplication = (application) => {
  const value =
    typeof application.toObject === "function"
      ? application.toObject()
      : { ...application };

  if (value.user?.password) {
    delete value.user.password;
  }

  if (value.user?.systemRole) {
    delete value.user.systemRole;
  }

  return value;
};

const getMyVerificationApplications = async (req, res) => {
  try {
    const applications =
      await VerificationApplication.find({
        user: req.user.id,
      })
        .sort({ createdAt: -1 })
        .populate("startup", "title verificationStatus");

    res.json({
      verification: getVerificationMap(
        req.user.profile.verification
      ),
      applications: applications.map(serializeApplication),
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

const submitVerificationApplication = async (req, res) => {
  try {
    const subjectType = cleanText(req.body.subjectType || "user", 16).toLowerCase();

    if (!["user", "startup"].includes(subjectType)) {
      return res.status(400).json({ message: "Choose a valid verification subject" });
    }

    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ message: "Account not found" });
    }

    const evidence = cleanEvidence(req.body.evidence);
    const attachments = cleanAttachments(
      req.body.attachments,
      user.firebaseUid
    );

    if (!attachments) {
      return res.status(400).json({
        message: "Attach up to 5 images or documents uploaded to FounderVerse storage (8 MB each)",
      });
    }

    const hasEvidence =
      Object.values(evidence).some(Boolean) || attachments.length > 0;

    if (!hasEvidence) {
      return res.status(400).json({
        message: "Provide details or attach evidence for your verification request",
      });
    }

    let role;
    let startup = null;

    if (subjectType === "user") {
      role = normalizeRole(req.body.role);

      if (!isVerifiableRole(role)) {
        return res.status(400).json({
          message: "Choose a role available on your profile to verify",
        });
      }

      if (!getUserRoles(user).includes(role)) {
        return res.status(400).json({
          message: "Add this role to your profile before requesting verification",
        });
      }

      if (user.verification?.get(role) === "verified") {
        return res.status(409).json({ message: "This role is already verified" });
      }

      const existingPending = await VerificationApplication.findOne({
        user: req.user.id,
        role,
        status: "pending",
      });

      if (existingPending) {
        return res.status(400).json({
          message: "You already have a pending verification request for this role",
        });
      }

      if (!user.verification) {
        user.verification = new Map();
      }

      user.verification.set(role, "pending");
      await user.save();
    } else {
      const startupId = req.body.startupId;
      if (!startupId || !/^[a-f\d]{24}$/i.test(String(startupId))) {
        return res.status(400).json({ message: "Choose a valid startup" });
      }

      startup = await Startup.findOne({
        _id: startupId,
        founder: req.user.id,
      });

      if (!startup) {
        return res.status(404).json({ message: "Startup not found or you are not its founder" });
      }

      if (startup.verificationStatus === "verified") {
        return res.status(409).json({ message: "This startup is already verified" });
      }

      if (startup.moderationStatus === "banned") {
        return res.status(409).json({ message: "A temporarily banned startup cannot apply for verification" });
      }

      const existingPending = await VerificationApplication.findOne({
        startup: startup._id,
        subjectType: "startup",
        status: "pending",
      });

      if (existingPending) {
        return res.status(400).json({ message: "This startup already has a pending verification request" });
      }

      startup.verificationStatus = "pending";
      await startup.save();
    }

    const application =
      await VerificationApplication.create({
        user: req.user.id,
        subjectType,
        startup: startup?._id || null,
        role,
        evidence: { ...evidence, attachments },
        status: "pending",
      });

    try {
      await createNotification(req, {
        user: req.user.id,
        title: "Verification request received",
        message: subjectType === "startup"
          ? `Your verification request for ${startup.title} is now in the admin review queue.`
          : `Your ${role} verification request is now in the admin review queue.`,
      });
    } catch (notificationError) {
      console.error("Could not confirm verification submission:", notificationError.message);
    }

    req.app.get("io")?.to("admins").emit("admin:inbox-updated");

    res.status(201).json(serializeApplication(application));
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

module.exports = {
  getMyVerificationApplications,
  submitVerificationApplication,
};
