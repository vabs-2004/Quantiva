const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { authenticate } = require("../middleware/auth");
const {
  generateLesson,
  getMyGeneratedLessons,
  getMyBookmarkedGeneratedLessons,
  getGeneratedLessonById,
  deleteGeneratedLesson,
  bookmarkGeneratedLesson,
  unbookmarkGeneratedLesson,
} = require("../controllers/generatedLessonController");

// Generation rate limiter (15 requests per 5 minutes)
const generationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 15,
  message: { error: "Too many lesson generation requests. Please wait a few minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// All generated-lesson endpoints require authentication
router.use(authenticate);

// ─── IMPORTANT ROUTING ORDER ─────────────────────────────
// Static paths MUST be registered BEFORE /:lessonId to prevent route collisions!
router.post("/generate", generationLimiter, generateLesson);
router.get("/", getMyGeneratedLessons);
router.get("/bookmarks", getMyBookmarkedGeneratedLessons);

// Dynamic lessonId endpoints
router.get("/:lessonId", getGeneratedLessonById);
router.delete("/:lessonId", deleteGeneratedLesson);
router.post("/:lessonId/bookmark", bookmarkGeneratedLesson);
router.delete("/:lessonId/bookmark", unbookmarkGeneratedLesson);

module.exports = router;
