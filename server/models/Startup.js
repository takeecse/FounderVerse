const mongoose = require("mongoose");

const startupSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    tagline: {
      type: String,
      required: true,
    },

    description: {
      type: String,
      required: true,
    },

    industry: {
      type: String,
      default: "",
    },

    techStack: {
      type: [String],
      default: [],
    },

    lookingFor: {
      type: [String],
      default: [],
    },

    logo: {
      type: String,
      default: "",
    },

    website: {
      type: String,
      default: "",
    },

    location: {
      type: String,
      default: "",
    },

    stage: {
      type: String,
      default: "Idea",
    },

    fundingStatus: {
      type: String,
      default: "Bootstrapped",
    },

    fundingNeeded: {
      type: String,
      default: "",
    },

    teamSize: {
      type: Number,
      default: 1,
    },

    isHiring: {
      type: Boolean,
      default: true,
    },

    status: {
      type: String,
      default: "Open",
    },

    moderationStatus: {
      type: String,
      enum: ["published", "hidden", "banned"],
      default: "published",
    },

    verificationStatus: {
      type: String,
      enum: ["unverified", "pending", "verified", "rejected", "revoked"],
      default: "unverified",
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    verificationNote: {
      type: String,
      default: "",
      maxlength: 1200,
    },

    banReason: {
      type: String,
      default: "",
      maxlength: 1200,
    },

    banMessage: {
      type: String,
      default: "",
      maxlength: 1200,
    },

    bannedAt: {
      type: Date,
      default: null,
    },

    appealDeadline: {
      type: Date,
      default: null,
    },

    appeal: {
      message: { type: String, default: "", maxlength: 1200 },
      status: {
        type: String,
        enum: ["none", "pending", "accepted", "rejected"],
        default: "none",
      },
      submittedAt: { type: Date, default: null },
      reviewedAt: { type: Date, default: null },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
      resolutionNote: { type: String, default: "", maxlength: 1200 },
      seenBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    },

    founder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    teamMembers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],

    teamMemberRoles: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        role: {
          type: String,
          trim: true,
          maxlength: 60,
          default: "Member",
        },
        isAdmin: {
          type: Boolean,
          default: false,
        },
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          default: null,
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.model(
    "Startup",
    startupSchema
  );
