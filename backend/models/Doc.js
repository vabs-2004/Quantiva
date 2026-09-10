const mongoose = require("mongoose");

const DocSchema = new mongoose.Schema(
  {
    section: {
      type: String,
      required: true,
      trim: true,
    },
    subsection: {
      type: String,
      default: "",
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    sectionOrder: {
      type: Number,
      default: 0,
    },
    subsectionOrder: {
      type: Number,
      default: 0,
    },
    order: {
      type: Number,
      default: 0,
    },
    content: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Doc", DocSchema);
