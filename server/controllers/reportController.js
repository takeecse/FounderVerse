const mongoose = require("mongoose");
const Report = require("../models/Report");
const Startup = require("../models/Startup");
const User = require("../models/User");

const REPORT_REASONS = [
  "spam",
  "misleading",
  "harassment",
  "impersonation",
  "other",
];

const cleanText = (value, maxLength = 1200) =>
  typeof value === "string" ? value.trim().slice(0, maxLength) : "";

const submitReport = async (req, res) => {
  try {
    const targetType = cleanText(req.body.targetType, 16).toLowerCase();
    const reason = cleanText(req.body.reason, 32).toLowerCase();
    const targetId = req.body.targetId;

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
            { moderationStatus: { $exists: false } },
          ],
        }).select("title");

    if (!target || (targetType === "user" && target.accountStatus === "suspended")) {
      return res.status(404).json({ message: "This report target is no longer available" });
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
    });

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

    res.json(reports);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const reviewReport = async (req, res) => {
  try {
    const status = cleanText(req.body.status, 16).toLowerCase();

    if (!["resolved", "dismissed"].includes(status)) {
      return res.status(400).json({ message: "Report review must resolve or dismiss the report" });
    }

    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (report.status !== "pending") {
      return res.status(409).json({ message: "This report has already been reviewed" });
    }

    report.status = status;
    report.reviewedBy = req.user.id;
    report.reviewedAt = new Date();
    report.resolutionNote = cleanText(req.body.resolutionNote);
    await report.save();

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
