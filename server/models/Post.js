const mongoose = require("mongoose");

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, maxlength: 1000 },
    name: { type: String, required: true, maxlength: 200 },
    contentType: { type: String, required: true, maxlength: 120 },
    size: { type: Number, required: true, min: 1, max: 8 * 1024 * 1024 },
  },
  { _id: false }
);

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    startup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Startup",
      default: null,
      index: true,
    },
    caption: {
      type: String,
      default: "",
      maxlength: 2800,
    },
    images: {
      type: [imageSchema],
      default: [],
      validate: [(items) => items.length <= 4, "A post can include up to 4 images"],
    },
  },
  { timestamps: true }
);

postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ startup: 1, createdAt: -1 });

module.exports = mongoose.model("Post", postSchema);
