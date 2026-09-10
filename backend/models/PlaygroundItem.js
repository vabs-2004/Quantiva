const mongoose = require("mongoose");

const playgroundItemSchema = new mongoose.Schema(
  {
    icon: {
      type: String,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    desc: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      default: "Available",
    },
    path: {
      type: String,
      default: "",
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("PlaygroundItem", playgroundItemSchema);
