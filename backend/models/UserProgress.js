const mongoose = require("mongoose");

/**
 * Tracks per-user learning progress across courses, challenges, and algorithm runs.
 * One document per user.
 */
const userProgressSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    courseProgress: [
      {
        course: { type: mongoose.Schema.Types.ObjectId, ref: "Course" },
        completedLectures: { type: [Number], default: [] },
        completed: { type: Boolean, default: false },
        lastAccessedAt: { type: Date, default: Date.now },
      },
    ],
    challengeProgress: [
      {
        challenge: { type: mongoose.Schema.Types.ObjectId, ref: "Challenge" },
        completed: { type: Boolean, default: false },
        attempts: { type: Number, default: 0 },
        completedAt: { type: Date },
      },
    ],
    algorithmRuns: [
      {
        algorithmId: { type: String },
        count: { type: Number, default: 0 },
        lastRunAt: { type: Date, default: Date.now },
      },
    ],
    microModuleProgress: [
      {
        moduleId: { type: String, required: true },
        status: {
          type: String,
          enum: ["not_started", "in_progress", "completed", "skipped"],
          default: "not_started",
        },
        completedAt: { type: Date },
        skippedAt: { type: Date },
        lastAccessedAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("UserProgress", userProgressSchema);
