const mongoose = require("mongoose");

const LectureSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  videoUrl: {
    type: String,
    required: true,
  },
  duration: {
    type: String, // e.g., "12:30" or "45 mins"
    default: "",
  },
});

const CourseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    thumbnail: {
      type: String,
      default: "", // optional image for the course
    },
    instructor: {
      type: String,
      default: "Admin",
    },
    lectures: [LectureSchema],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Course", CourseSchema);
