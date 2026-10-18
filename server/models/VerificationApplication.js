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

      role: {
        type: String,
        enum: VERIFIABLE_ROLES,
        required: true,
      },

      status: {
        type: String,
        enum: VERIFICATION_STATUSES,
        default: "pending",
      },

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
  role: 1,
  status: 1,
});

module.exports = mongoose.model(
  "VerificationApplication",
  verificationApplicationSchema
);
