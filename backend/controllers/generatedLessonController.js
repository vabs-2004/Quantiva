/**
 * generatedLessonController.js
 * 
 * Quantiva Phase 7H: Controller for User-Generated Interactive Lessons
 * 
 * Endpoints:
 * - POST   /api/generated-lessons/generate
 * - GET    /api/generated-lessons
 * - GET    /api/generated-lessons/bookmarks
 * - GET    /api/generated-lessons/:lessonId
 * - DELETE /api/generated-lessons/:lessonId
 * - POST   /api/generated-lessons/:lessonId/bookmark
 * - DELETE /api/generated-lessons/:lessonId/bookmark
 * 
 * STRICT SECURITY:
 * All database queries are scoped strictly to { owner: req.user.id }.
 * User A can never inspect, bookmark, or delete User B's lessons.
 */

const GeneratedLesson = require("../models/GeneratedLesson");
const UserProgress = require("../models/UserProgress");
const lessonGeneratorService = require("../services/lessonGeneratorService");

/**
 * Helper to retrieve or initialize UserProgress document
 */
async function getOrCreateProgress(userId) {
  let progress = await UserProgress.findOne({ user: userId });
  if (!progress) {
    progress = await UserProgress.create({ user: userId });
  }
  return progress;
}

/**
 * POST /api/generated-lessons/generate
 * Generates and saves a personal lesson or returns curated recommendation.
 */
async function generateLesson(req, res) {
  try {
    const { topic, topicDescription, learnerLevel, forceAlternative, conversation, learnerIntent } = req.body;

    if (!topic || typeof topic !== "string" || !topic.trim()) {
      return res.status(400).json({ error: "Topic is required to generate a personal lesson." });
    }

    const result = await lessonGeneratorService.generateAndSaveLesson({
      topic: topic.trim(),
      topicDescription: topicDescription || "",
      userId: req.user.id,
      learnerLevel: learnerLevel || req.user.learningProfile?.startingLevel || "intermediate",
      forceAlternative: Boolean(forceAlternative),
      conversation: Array.isArray(conversation) ? conversation : [],
      learnerIntent: typeof learnerIntent === "string" ? learnerIntent.trim().slice(0, 500) : "",
    });

    if (result.curatedResource) {
      return res.json({
        success: true,
        hasCurated: true,
        curatedResource: result.curatedResource,
        lesson: null,
      });
    }

    return res.status(201).json({
      success: true,
      hasCurated: false,
      curatedResource: null,
      lesson: result.lesson,
    });
  } catch (error) {
    console.error("Error generating personal lesson:", error);
    return res.status(500).json({ error: error.message || "Failed to generate personal lesson." });
  }
}

/**
 * GET /api/generated-lessons
 * Returns all generated lessons owned by current user.
 */
async function getMyGeneratedLessons(req, res) {
  try {
    const lessons = await GeneratedLesson.find({ owner: req.user.id })
      .sort({ createdAt: -1 })
      .select("-__v");

    const progress = await getOrCreateProgress(req.user.id);
    const bookmarkedSet = new Set(
      (progress.bookmarkedGeneratedLessons || []).map((b) => b.lessonId)
    );

    const lessonsWithBookmark = lessons.map((doc) => ({
      ...doc.toObject(),
      isBookmarked: bookmarkedSet.has(doc.lessonId),
    }));

    return res.json({
      success: true,
      lessons: lessonsWithBookmark,
    });
  } catch (error) {
    console.error("Error fetching user's generated lessons:", error);
    return res.status(500).json({ error: "Failed to fetch generated lessons." });
  }
}

/**
 * GET /api/generated-lessons/bookmarks
 * Returns all bookmarked generated lessons for the authenticated user,
 * strictly ordered by bookmarkedAt descending.
 */
async function getMyBookmarkedGeneratedLessons(req, res) {
  try {
    const progress = await getOrCreateProgress(req.user.id);
    const bookmarks = progress.bookmarkedGeneratedLessons || [];

    if (!bookmarks.length) {
      return res.json({ success: true, bookmarks: [] });
    }

    // Sort strictly by bookmarkedAt descending
    const sorted = bookmarks.slice().sort(
      (a, b) => new Date(b.bookmarkedAt).getTime() - new Date(a.bookmarkedAt).getTime()
    );

    const lessonIds = sorted.map((b) => b.lessonId);

    // Retrieve only lessons owned by this user
    const lessons = await GeneratedLesson.find({
      lessonId: { $in: lessonIds },
      owner: req.user.id,
    }).select("-__v");

    const lessonMap = new Map(lessons.map((l) => [l.lessonId, l]));

    const orderedBookmarks = sorted
      .map((b) => {
        const item = lessonMap.get(b.lessonId);
        if (!item) return null; // In case lesson was deleted
        return {
          ...item.toObject(),
          bookmarkedAt: b.bookmarkedAt,
          isBookmarked: true,
        };
      })
      .filter(Boolean);

    return res.json({
      success: true,
      bookmarks: orderedBookmarks,
    });
  } catch (error) {
    console.error("Error fetching bookmarked generated lessons:", error);
    return res.status(500).json({ error: "Failed to fetch bookmarks." });
  }
}

/**
 * GET /api/generated-lessons/:lessonId
 * Retrieves a single generated lesson owned by the authenticated user.
 * Deterministic: Reloading renders the exact saved specification without calling Groq.
 */
async function getGeneratedLessonById(req, res) {
  try {
    const { lessonId } = req.params;

    // Scoped strictly to { lessonId, owner: req.user.id }
    const lesson = await GeneratedLesson.findOne({
      lessonId,
      owner: req.user.id,
    }).select("-__v");

    if (!lesson) {
      return res.status(404).json({ error: "Generated lesson not found." });
    }

    const progress = await getOrCreateProgress(req.user.id);
    const isBookmarked = (progress.bookmarkedGeneratedLessons || []).some(
      (b) => b.lessonId === lessonId
    );

    return res.json({
      success: true,
      lesson: {
        ...lesson.toObject(),
        isBookmarked,
      },
    });
  } catch (error) {
    console.error("Error fetching generated lesson by ID:", error);
    return res.status(500).json({ error: "Failed to fetch generated lesson." });
  }
}

/**
 * DELETE /api/generated-lessons/:lessonId
 * Deletes a generated lesson and cleans up any bookmark reference.
 * Scoped strictly to owner: req.user.id.
 */
async function deleteGeneratedLesson(req, res) {
  try {
    const { lessonId } = req.params;

    const deleted = await GeneratedLesson.findOneAndDelete({
      lessonId,
      owner: req.user.id,
    });

    if (!deleted) {
      return res.status(404).json({ error: "Generated lesson not found." });
    }

    // Clean up bookmark reference idempotently
    const progress = await getOrCreateProgress(req.user.id);
    if (progress.bookmarkedGeneratedLessons && progress.bookmarkedGeneratedLessons.length > 0) {
      progress.bookmarkedGeneratedLessons = progress.bookmarkedGeneratedLessons.filter(
        (b) => b.lessonId !== lessonId
      );
      await progress.save();
    }

    return res.json({
      success: true,
      message: "Generated lesson deleted successfully.",
      lessonId,
    });
  } catch (error) {
    console.error("Error deleting generated lesson:", error);
    return res.status(500).json({ error: "Failed to delete generated lesson." });
  }
}

/**
 * POST /api/generated-lessons/:lessonId/bookmark
 * Idempotently bookmarks a generated lesson for the authenticated user.
 */
async function bookmarkGeneratedLesson(req, res) {
  try {
    const { lessonId } = req.params;

    // Verify ownership
    const lesson = await GeneratedLesson.findOne({
      lessonId,
      owner: req.user.id,
    });

    if (!lesson) {
      return res.status(404).json({ error: "Generated lesson not found." });
    }

    const progress = await getOrCreateProgress(req.user.id);
    if (!progress.bookmarkedGeneratedLessons) {
      progress.bookmarkedGeneratedLessons = [];
    }

    const existing = progress.bookmarkedGeneratedLessons.find((b) => b.lessonId === lessonId);
    let bookmarkedAt;
    if (!existing) {
      bookmarkedAt = new Date();
      progress.bookmarkedGeneratedLessons.push({ lessonId, bookmarkedAt });
      await progress.save();
    } else {
      bookmarkedAt = existing.bookmarkedAt;
    }

    return res.json({
      success: true,
      bookmarked: true,
      lessonId,
      bookmarkedAt,
      totalBookmarks: progress.bookmarkedGeneratedLessons.length,
    });
  } catch (error) {
    console.error("Error bookmarking generated lesson:", error);
    return res.status(500).json({ error: "Failed to bookmark generated lesson." });
  }
}

/**
 * DELETE /api/generated-lessons/:lessonId/bookmark
 * Idempotently removes a generated lesson bookmark.
 */
async function unbookmarkGeneratedLesson(req, res) {
  try {
    const { lessonId } = req.params;
    const progress = await getOrCreateProgress(req.user.id);

    if (!progress.bookmarkedGeneratedLessons) {
      progress.bookmarkedGeneratedLessons = [];
    }

    const initialLen = progress.bookmarkedGeneratedLessons.length;
    progress.bookmarkedGeneratedLessons = progress.bookmarkedGeneratedLessons.filter(
      (b) => b.lessonId !== lessonId
    );

    if (progress.bookmarkedGeneratedLessons.length !== initialLen) {
      await progress.save();
    }

    return res.json({
      success: true,
      bookmarked: false,
      lessonId,
      totalBookmarks: progress.bookmarkedGeneratedLessons.length,
    });
  } catch (error) {
    console.error("Error unbookmarking generated lesson:", error);
    return res.status(500).json({ error: "Failed to remove bookmark." });
  }
}

module.exports = {
  generateLesson,
  getMyGeneratedLessons,
  getMyBookmarkedGeneratedLessons,
  getGeneratedLessonById,
  deleteGeneratedLesson,
  bookmarkGeneratedLesson,
  unbookmarkGeneratedLesson,
};
