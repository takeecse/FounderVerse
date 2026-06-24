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