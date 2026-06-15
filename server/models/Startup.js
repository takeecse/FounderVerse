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

    founder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    teamMembers: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Startup",
  startupSchema
);