const mongoose = require("mongoose");

const challengeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  desc: {
    type: String,
    required: true,
  },
  numQubits: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  targetState: {
    type: [Number], // Array of floats (probabilities)
    required: true,
  },
  targetStr: {
    type: String, // e.g. "50% |00> + 50% |11>"
    required: true,
  },
  allowedGates: {
    type: [String],
    required: true,
    default: ["X", "H"],
  },
  order: {
    type: Number,
    default: 0,
  }
}, { timestamps: true });

module.exports = mongoose.model("Challenge", challengeSchema);
