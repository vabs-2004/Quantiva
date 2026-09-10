const mongoose = require("mongoose");

const educationalContentSchema = new mongoose.Schema(
  {
    algorithmId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    description: { type: String, default: "" },
    problemDescription: { type: String, default: "" },
    algorithm: { type: String, default: "" },
    geometricProof: { type: String, default: "" },
    algebraicProof: { type: String, default: "" },
    code: { type: String, default: "" },
    applications: [String],
    limitations: [String],
  },
  { timestamps: true }
);

module.exports = mongoose.model("EducationalContent", educationalContentSchema);
