const mongoose = require("mongoose");

const parameterSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    type: { type: String, required: true }, // "number", "text", "select"
    default: { type: mongoose.Schema.Types.Mixed },
    min: Number,
    max: Number,
    step: Number,
    placeholder: String,
    options: [String], // For "select" type
  },
  { _id: false }
);

const algorithmSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    shortDescription: { type: String, required: true },
    description: { type: String, required: true },
    formula: String,
    timeComplexity: String,
    spaceComplexity: String,
    reference: String,
    category: { type: String, required: true },
    parameters: [parameterSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Algorithm", algorithmSchema);
