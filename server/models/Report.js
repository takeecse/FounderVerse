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
  },
  { timestamps: true }
);

reportSchema.index({ reporter: 1, status: 1, createdAt: -1 });
reportSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model("Report", reportSchema);
