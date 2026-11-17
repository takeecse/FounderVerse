const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    receiver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    startup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Startup",
      required: false,
    },

    requestType: {
      type: String,
      enum: ["collaboration", "startup_invite"],
      default: "collaboration",
      index: true,
    },

    startupRole: {
      type: String,
      trim: true,
      maxlength: 60,
      default: "Member",
    },

    message: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: [
        "pending",
        "accepted",
        "rejected",
      ],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

module.exports =
  mongoose.model(
    "Request",
    requestSchema
  );
