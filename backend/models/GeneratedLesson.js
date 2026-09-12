const mongoose = require("mongoose");

/**
 * GeneratedLesson
 * 
 * Represents a user-generated, personalized, interactive quantum learning lesson.
 * Strictly separated from official MicroModule curriculum:
 * - Learner-owned (owner: User ObjectId)
 * - Session-scoped and persistent for the owner only
 * - NEVER part of official curriculum or Knowledge Map
 * - ZERO dynamic code execution (strictly validated declarative JSON sections)
 * - Strictly bounded field lengths to avoid pathological AI output
 */
const videoSubSchema = new mongoose.Schema(
  {
    videoId: { type: String, maxlength: 100 },
    title: { type: String, maxlength: 300 },
    channelTitle: { type: String, maxlength: 200 },
    embedUrl: { type: String, maxlength: 500 },
    url: { type: String, maxlength: 500 },
    viewCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    description: { type: String, maxlength: 2000 },
  },
  { _id: false }
);

const codeSnippetSubSchema = new mongoose.Schema(
  {
    language: { type: String, default: "python", maxlength: 40 },
    code: { type: String, maxlength: 6000 },
    title: { type: String, maxlength: 200 },
    instructions: { type: String, maxlength: 500 },
  },
  { _id: false }
);

const generatedLessonSchema = new mongoose.Schema(
  {
    lessonId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      maxlength: 120,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    topicId: {
      type: String,
      required: true,
      index: true,
      trim: true,
      maxlength: 120,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    summary: {
      type: String,
      default: "",
      maxlength: 1000,
    },
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      default: "intermediate",
    },
    estimatedMinutes: {
      type: Number,
      default: 7,
      min: 1,
      max: 60,
    },
    sections: [
      {
        id: {
          type: String,
          required: true,
          maxlength: 80,
        },
        type: {
          type: String,
          enum: [
            "explanation",
            "intuition",
            "formula",
            "formalism",
            "visualization",
            "interactive",
            "code",
            "experiment",
            "video",
            "quiz",
            "reflection",
          ],
          required: true,
        },
        title: {
          type: String,
          required: true,
          maxlength: 200,
        },
        content: {
          type: String,
          required: true,
          maxlength: 8000,
        },
        formula: {
          latex: { type: String, maxlength: 2000 },
          explanation: { type: String, maxlength: 2000 },
        },
        codeSnippet: {
          type: codeSnippetSubSchema,
          default: undefined,
        },
        video: {
          type: videoSubSchema,
          default: undefined,
        },
        interactiveComponent: {
          type: {
            type: String,
            enum: [
              "bloch-sphere",
              "circuit",
              "complex-plane",
              "state-vector",
              "probability-heatmap",
              "measurement",
              "sandbox",
            ],
          },
          config: {
            type: mongoose.Schema.Types.Mixed,
          },
        },
        checkQuestion: {
          question: { type: String, maxlength: 1000 },
          options: [{ type: String, maxlength: 400 }],
          correctIndex: { type: Number, min: 0, max: 10 },
          explanation: { type: String, maxlength: 1500 },
        },
      },
    ],
    isAIGenerated: {
      type: Boolean,
      default: true,
      immutable: true,
    },
  },
  { timestamps: true }
);

// Enforce max 12 sections per generated lesson
generatedLessonSchema.path("sections").validate(function (sections) {
  return !sections || sections.length <= 12;
}, "Generated lesson cannot exceed 12 sections.");

module.exports = mongoose.model("GeneratedLesson", generatedLessonSchema);
