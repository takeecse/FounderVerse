const VerificationApplication = require("../models/VerificationApplication");
const User = require("../models/User");
const {
  getVerificationMap,
  isVerifiableRole,
  normalizeRole,
} = require("../utils/roles");

const cleanText = (value) =>
  typeof value === "string" ? value.trim() : "";

const cleanEvidence = (value = {}) => ({
  organizationName: cleanText(value.organizationName),
  website: cleanText(value.website),
  linkedin: cleanText(value.linkedin),
  background: cleanText(value.background),
  notes: cleanText(value.notes),
});

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
      }).sort({ createdAt: -1 });

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
    const role = normalizeRole(req.body.role);

    if (!isVerifiableRole(role)) {
      return res.status(400).json({
        message:
          "Only Founder, Investor, and Mentor roles can be verified",
      });
    }

    const user = await User.findById(req.user.id);

    if (!user.roles?.includes(role)) {
      return res.status(400).json({
        message:
          "Add this role to your profile before requesting verification",
      });
    }

    const existingPending =
      await VerificationApplication.findOne({
        user: req.user.id,
        role,
        status: "pending",
      });

    if (existingPending) {
      return res.status(400).json({
        message:
          "You already have a pending verification request for this role",
      });
    }

    const evidence = cleanEvidence(req.body.evidence);
    const hasEvidence = Object.values(evidence).some(Boolean);

    if (!hasEvidence) {
      return res.status(400).json({
        message:
          "Please provide evidence for your verification request",
      });
    }

    if (!user.verification) {
      user.verification = new Map();
    }

    user.verification.set(role, "pending");
    await user.save();

    const application =
      await VerificationApplication.create({
        user: req.user.id,
        role,
        evidence,
        status: "pending",
      });

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
