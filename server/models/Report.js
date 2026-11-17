const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    targetType: {
      type: String,
      enum: ["user", "startup"],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    targetName: {
      type: String,
      required: true,
    },
    reason: {
      type: String,
      enum: ["spam", "misleading", "harassment", "impersonation", "other"],
      required: true,
    },
    details: {
      type: String,
      default: "",
      maxlength: 1200,
    },
    attachments: {
      type: [
        {
          url: { type: String, required: true },
          name: { type: String, required: true, maxlength: 200 },
          contentType: { type: String, required: true, maxlength: 120 },
          size: { type: Number, required: true, min: 0, max: 8388608 },
        },
      ],
      default: [],
      validate: [(items) => items.length <= 5, "A report can include up to 5 attachments"],
    },
    adminSeenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    status: {
      type: String,
      enum: ["pending", "resolved", "dismissed"],
      default: "pending",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    resolutionNote: {
      type: String,
      default: "",
      maxlength: 1200,
    },
    resolutionAction: {
      type: String,
      enum: ["", "ban_startup", "remove_verification"],
      default: "",
    },
  },
  { timestamps: true }
);

reportSchema.index({ reporter: 1, status: 1, createdAt: -1 });
reportSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Report", reportSchema);
