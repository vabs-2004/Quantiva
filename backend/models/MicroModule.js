const mongoose = require("mongoose");

/**
 * Authoritative Content Model for Micro-modules.
 * Designed for 7A and forward-compatible with 7E (Content Registry) and 7H (Personal Modules).
 */
const microModuleSchema = new mongoose.Schema(
  {
    moduleId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    sequenceOrder: {
      type: Number,
      required: true,
      index: true,
    },
    track: {
      type: String,
      required: true,
      default: "foundations",
      index: true,
    },
    description: {
      type: String,
      default: "",
    },
    type: {
      type: String,
      enum: ["core", "curated", "personalized"],
      default: "core",
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    status: {
      type: String,
      enum: ["published", "draft", "archived"],
      default: "published",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MicroModule", microModuleSchema);
