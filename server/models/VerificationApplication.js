const mongoose = require("mongoose");
const {
  VERIFIABLE_ROLES,
  VERIFICATION_STATUSES,
} = require("../utils/roles");

const verificationApplicationSchema =
  new mongoose.Schema(
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },

      subjectType: {
        type: String,
        enum: ["user", "startup"],
        default: "user",
        required: true,
      },

      startup: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Startup",
        default: null,
      },

      role: {
        type: String,
        enum: VERIFIABLE_ROLES,
        required: function requireRoleForUserApplications() {
          return this.subjectType !== "startup";
        },
      },

      status: {
        type: String,
        enum: VERIFICATION_STATUSES,
        default: "pending",
      },

      adminSeenBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      }],

      evidence: {
        organizationName: {
          type: String,
          default: "",
        },
        website: {
          type: String,
          default: "",
        },
        linkedin: {
          type: String,
          default: "",
        },
        background: {
          type: String,
          default: "",
        },
        notes: {
          type: String,
          default: "",
        },
        attachments: [{
          url: { type: String, required: true, maxlength: 1000 },
          name: { type: String, required: true, maxlength: 200 },
          contentType: { type: String, required: true, maxlength: 120 },
          size: { type: Number, required: true, min: 1, max: 8 * 1024 * 1024 },
        }],
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

      reviewerNote: {
        type: String,
        default: "",
      },
    },
    {
      timestamps: true,
    }
  );

verificationApplicationSchema.index({
  user: 1,
  subjectType: 1,
  role: 1,
  status: 1,
});
verificationApplicationSchema.index({
  startup: 1,
  subjectType: 1,
  status: 1,
});

module.exports = mongoose.model(
  "VerificationApplication",
  verificationApplicationSchema
);
