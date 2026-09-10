const mongoose = require("mongoose");
const crypto = require("crypto");

const certificateSchema = new mongoose.Schema(
  {
    certificateId: {
      type: String,
      required: true,
      unique: true,
      default: () => `QSL-${crypto.randomBytes(5).toString("hex").toUpperCase()}`,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    course: { type: mongoose.Schema.Types.ObjectId, ref: "Course", required: true },
    userName: { type: String, required: true },
    courseTitle: { type: String, required: true },
    instructor: { type: String, default: "" },
    issuedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

certificateSchema.index({ user: 1, course: 1 }, { unique: true });

module.exports = mongoose.model("Certificate", certificateSchema);
