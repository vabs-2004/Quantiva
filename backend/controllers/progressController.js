const UserProgress = require("../models/UserProgress");
const Course = require("../models/Course");
const Challenge = require("../models/Challenge");
const User = require("../models/User");
const MicroModule = require("../models/MicroModule");
const Algorithm = require("../models/Algorithm");
const { issueCertificateIfEligible } = require("./certificateController");

async function getOrCreateProgress(userId) {
  let progress = await UserProgress.findOne({ user: userId });
  if (!progress) {
    progress = await UserProgress.create({ user: userId });
  }
  return progress;
}

// GET /api/progress/me
async function getMyProgress(req, res) {
  try {
    const progress = await getOrCreateProgress(req.user.id);
    const [totalCourses, totalChallenges, totalMicroModules] = await Promise.all([
      Course.countDocuments(),
      Challenge.countDocuments(),
      MicroModule.countDocuments({ track: "foundations", status: "published" }),
    ]);

    const coursesCompleted = progress.courseProgress.filter((c) => c.completed).length;
    const challengesCompleted = progress.challengeProgress.filter((c) => c.completed).length;

    const microModulesCompleted = (progress.microModuleProgress || []).filter(
      (m) => m.status === "completed"
    ).length;
    const microModulesSkipped = (progress.microModuleProgress || []).filter(
      (m) => m.status === "skipped"
    ).length;

    res.json({
      progress,
      summary: {
        totalCourses,
        coursesCompleted,
        totalChallenges,
        challengesCompleted,
        algorithmsRun: progress.algorithmRuns.length,
        totalMicroModules: totalMicroModules || 12,
        microModulesCompleted,
        microModulesSkipped,
      },
    });
  } catch (error) {
    console.error("Error fetching progress:", error);
    res.status(500).json({ error: "Failed to fetch progress" });
  }
}

// POST /api/progress/course/:courseId/lecture/:lectureIndex
async function markLectureComplete(req, res) {
  try {
    const { courseId, lectureIndex } = req.params;
    const idx = parseInt(lectureIndex, 10);

    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const progress = await getOrCreateProgress(req.user.id);
    let entry = progress.courseProgress.find((c) => c.course.toString() === courseId);

    if (!entry) {
      entry = { course: courseId, completedLectures: [], completed: false };
      progress.courseProgress.push(entry);
      entry = progress.courseProgress[progress.courseProgress.length - 1];
    }

    if (!entry.completedLectures.includes(idx)) {
      entry.completedLectures.push(idx);
    }
    entry.lastAccessedAt = new Date();
    const wasCompleted = entry.completed;
    entry.completed = entry.completedLectures.length >= course.lectures.length;

    await progress.save();

    let certificate = null;
    if (entry.completed && !wasCompleted) {
      certificate = await issueCertificateIfEligible(req.user.id, courseId);
    }

    res.json({ success: true, entry, certificate });
  } catch (error) {
    console.error("Error marking lecture complete:", error);
    res.status(500).json({ error: "Failed to update progress" });
  }
}

// POST /api/progress/challenge/:challengeId  (internal helper, also exported for reuse)
async function recordChallengeCompletion(userId, challengeId, success) {
  if (!userId) return;
  try {
    const progress = await getOrCreateProgress(userId);
    let entry = progress.challengeProgress.find((c) => c.challenge.toString() === challengeId);

    if (!entry) {
      entry = { challenge: challengeId, completed: false, attempts: 0 };
      progress.challengeProgress.push(entry);
      entry = progress.challengeProgress[progress.challengeProgress.length - 1];
    }

    entry.attempts += 1;
    if (success && !entry.completed) {
      entry.completed = true;
      entry.completedAt = new Date();
    }

    await progress.save();
  } catch (error) {
    console.error("Error recording challenge completion:", error);
  }
}

// POST /api/progress/algorithm/:algorithmId (internal helper via route)
async function recordAlgorithmRun(req, res) {
  try {
    const { algorithmId } = req.params;
    const progress = await getOrCreateProgress(req.user.id);
    let entry = progress.algorithmRuns.find((a) => a.algorithmId === algorithmId);

    if (!entry) {
      entry = { algorithmId, count: 0 };
      progress.algorithmRuns.push(entry);
      entry = progress.algorithmRuns[progress.algorithmRuns.length - 1];
    }
    entry.count += 1;
    entry.lastRunAt = new Date();

    await progress.save();
    res.json({ success: true });
  } catch (error) {
    console.error("Error recording algorithm run:", error);
    res.status(500).json({ error: "Failed to record run" });
  }
}

// GET /api/progress/cohort (instructor/admin only)
async function getCohortProgress(req, res) {
  try {
    const users = await User.find({ role: "user" }).select("username name email createdAt");
    const allProgress = await UserProgress.find().populate("courseProgress.course", "title").populate(
      "challengeProgress.challenge",
      "title"
    );

    const [totalCourses, totalChallenges] = await Promise.all([
      Course.countDocuments(),
      Challenge.countDocuments(),
    ]);

    const progressByUser = new Map(allProgress.map((p) => [p.user.toString(), p]));

    const cohort = users.map((u) => {
      const p = progressByUser.get(u._id.toString());
      const coursesCompleted = p ? p.courseProgress.filter((c) => c.completed).length : 0;
      const challengesCompleted = p ? p.challengeProgress.filter((c) => c.completed).length : 0;
      const totalAttempts = p
        ? p.challengeProgress.reduce((sum, c) => sum + (c.attempts || 0), 0)
        : 0;
      const algorithmsRun = p ? p.algorithmRuns.reduce((sum, a) => sum + a.count, 0) : 0;

      return {
        userId: u._id,
        username: u.username,
        name: u.name,
        email: u.email,
        joinedAt: u.createdAt,
        coursesCompleted,
        totalCourses,
        challengesCompleted,
        totalChallenges,
        totalAttempts,
        algorithmsRun,
        completionRate: totalChallenges > 0 ? Math.round((challengesCompleted / totalChallenges) * 100) : 0,
      };
    });

    cohort.sort((a, b) => b.completionRate - a.completionRate);

    res.json({
      cohort,
      aggregate: {
        totalStudents: users.length,
        avgCompletionRate: cohort.length
          ? Math.round(cohort.reduce((s, c) => s + c.completionRate, 0) / cohort.length)
          : 0,
        totalChallenges,
        totalCourses,
      },
    });
  } catch (error) {
    console.error("Error fetching cohort progress:", error);
    res.status(500).json({ error: "Failed to fetch cohort progress" });
  }
}

// PUT /api/progress/micro-module/:moduleId
async function updateMicroModuleStatus(req, res) {
  try {
    const { moduleId } = req.params;
    const { status } = req.body;

    const validStatuses = ["not_started", "in_progress", "completed", "skipped"];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        error: `Invalid status '${status}'. Must be one of: ${validStatuses.join(", ")}`,
      });
    }

    // Verify module exists in authoritative registry
    const moduleExists = await MicroModule.findOne({ moduleId, status: "published" });
    if (!moduleExists) {
      return res.status(404).json({ error: `Micro-module '${moduleId}' not found` });
    }

    const progress = await getOrCreateProgress(req.user.id);
    if (!progress.microModuleProgress) {
      progress.microModuleProgress = [];
    }

    let entry = progress.microModuleProgress.find((m) => m.moduleId === moduleId);

    if (!entry) {
      entry = { moduleId, status: "not_started" };
      progress.microModuleProgress.push(entry);
      entry = progress.microModuleProgress[progress.microModuleProgress.length - 1];
    }

    const currentStatus = entry.status;

    // Review behavior: Reopening completed or skipped module maintains existing status
    if (status === "in_progress" && (currentStatus === "completed" || currentStatus === "skipped")) {
      entry.lastAccessedAt = new Date();
      await progress.save();
      return res.json({
        success: true,
        entry,
        message: "Module reopened in review mode; status preserved.",
      });
    }

    // Apply valid 7A transitions
    entry.status = status;
    entry.lastAccessedAt = new Date();

    if (status === "completed" && !entry.completedAt) {
      entry.completedAt = new Date();
    } else if (status === "skipped" && !entry.skippedAt) {
      entry.skippedAt = new Date();
    }

    await progress.save();

    const microModulesCompleted = progress.microModuleProgress.filter(
      (m) => m.status === "completed"
    ).length;
    const microModulesSkipped = progress.microModuleProgress.filter(
      (m) => m.status === "skipped"
    ).length;

    res.json({
      success: true,
      entry,
      summary: {
        microModulesCompleted,
        microModulesSkipped,
        totalMicroModules: 12,
      },
    });
  } catch (error) {
    console.error("Error updating micro-module progress:", error);
    res.status(500).json({ error: "Failed to update micro-module progress" });
  }
}

/**
 * POST /api/progress/micro-module/:moduleId/bookmark
 * Idempotently bookmarks a micro-module for the authenticated user.
 */
async function bookmarkMicroModule(req, res) {
  try {
    const { moduleId } = req.params;

    // Validate module exists in authoritative catalog
    const moduleItem = await MicroModule.findOne({ moduleId, status: "published" });
    if (!moduleItem) {
      return res.status(404).json({ error: `Micro-module '${moduleId}' not found` });
    }

    const progress = await getOrCreateProgress(req.user.id);
    if (!progress.bookmarkedMicroModules) {
      progress.bookmarkedMicroModules = [];
    }

    const existing = progress.bookmarkedMicroModules.find((b) => b.moduleId === moduleId);
    let bookmarkedAt;
    if (!existing) {
      bookmarkedAt = new Date();
      progress.bookmarkedMicroModules.push({ moduleId, bookmarkedAt });
      await progress.save();
    } else {
      bookmarkedAt = existing.bookmarkedAt;
    }

    res.json({
      success: true,
      bookmarked: true,
      moduleId,
      bookmarkedAt,
      totalBookmarks: progress.bookmarkedMicroModules.length,
    });
  } catch (error) {
    console.error("Error bookmarking micro-module:", error);
    res.status(500).json({ error: "Failed to bookmark micro-module" });
  }
}

/**
 * DELETE /api/progress/micro-module/:moduleId/bookmark
 * Idempotently removes a bookmark for the authenticated user.
 */
async function unbookmarkMicroModule(req, res) {
  try {
    const { moduleId } = req.params;
    const progress = await getOrCreateProgress(req.user.id);

    if (!progress.bookmarkedMicroModules) {
      progress.bookmarkedMicroModules = [];
    }

    const initialLength = progress.bookmarkedMicroModules.length;
    progress.bookmarkedMicroModules = progress.bookmarkedMicroModules.filter(
      (b) => b.moduleId !== moduleId
    );

    if (progress.bookmarkedMicroModules.length !== initialLength) {
      await progress.save();
    }

    res.json({
      success: true,
      bookmarked: false,
      moduleId,
      totalBookmarks: progress.bookmarkedMicroModules.length,
    });
  } catch (error) {
    console.error("Error unbookmarking micro-module:", error);
    res.status(500).json({ error: "Failed to remove bookmark" });
  }
}

/**
 * GET /api/progress/micro-modules/bookmarks
 * Returns all bookmarked micro-modules for the authenticated user,
 * ordered strictly by bookmarkedAt descending (most recently bookmarked first).
 */
async function getMyBookmarks(req, res) {
  try {
    const progress = await getOrCreateProgress(req.user.id);
    const bookmarks = progress.bookmarkedMicroModules || [];

    if (!bookmarks.length) {
      return res.json({ success: true, bookmarks: [] });
    }

    // Sort by bookmarkedAt descending
    const sorted = bookmarks.slice().sort(
      (a, b) => new Date(b.bookmarkedAt).getTime() - new Date(a.bookmarkedAt).getTime()
    );

    const moduleIds = sorted.map((b) => b.moduleId);
    const modules = await MicroModule.find({
      moduleId: { $in: moduleIds },
      status: "published",
    }).select("-__v");

    const moduleMap = new Map(modules.map((m) => [m.moduleId, m]));

    // Strictly preserve user's bookmarkedAt order
    const orderedModules = sorted
      .map((b) => {
        const mod = moduleMap.get(b.moduleId);
        if (!mod) return null;
        return {
          ...mod.toObject(),
          bookmarkedAt: b.bookmarkedAt,
        };
      })
      .filter(Boolean);

    res.json({
      success: true,
      bookmarks: orderedModules,
    });
  } catch (error) {
    console.error("Error fetching bookmarked micro-modules:", error);
    res.status(500).json({ error: "Failed to fetch bookmarks" });
  }
}

/**
 * POST /api/progress/algorithm/:algorithmId/bookmark
 * Idempotently bookmarks an algorithm for the authenticated user.
 */
async function bookmarkAlgorithm(req, res) {
  try {
    const { algorithmId } = req.params;
    const progress = await getOrCreateProgress(req.user.id);

    // Verify algorithm exists
    const algo = await Algorithm.findOne({ id: algorithmId });
    if (!algo) {
      return res.status(404).json({ error: "Algorithm not found" });
    }

    if (!progress.bookmarkedAlgorithms) {
      progress.bookmarkedAlgorithms = [];
    }

    const existing = progress.bookmarkedAlgorithms.find((b) => b.algorithmId === algorithmId);
    let bookmarkedAt;
    if (!existing) {
      bookmarkedAt = new Date();
      progress.bookmarkedAlgorithms.push({ algorithmId, bookmarkedAt });
      await progress.save();
    } else {
      bookmarkedAt = existing.bookmarkedAt;
    }

    res.json({
      success: true,
      bookmarked: true,
      algorithmId,
      bookmarkedAt,
      totalBookmarks: progress.bookmarkedAlgorithms.length,
    });
  } catch (error) {
    console.error("Error bookmarking algorithm:", error);
    res.status(500).json({ error: "Failed to bookmark algorithm" });
  }
}

/**
 * DELETE /api/progress/algorithm/:algorithmId/bookmark
 * Idempotently removes an algorithm bookmark.
 */
async function unbookmarkAlgorithm(req, res) {
  try {
    const { algorithmId } = req.params;
    const progress = await getOrCreateProgress(req.user.id);

    if (!progress.bookmarkedAlgorithms) {
      progress.bookmarkedAlgorithms = [];
    }

    const initialLength = progress.bookmarkedAlgorithms.length;
    progress.bookmarkedAlgorithms = progress.bookmarkedAlgorithms.filter(
      (b) => b.algorithmId !== algorithmId
    );

    if (progress.bookmarkedAlgorithms.length !== initialLength) {
      await progress.save();
    }

    res.json({
      success: true,
      bookmarked: false,
      algorithmId,
      totalBookmarks: progress.bookmarkedAlgorithms.length,
    });
  } catch (error) {
    console.error("Error unbookmarking algorithm:", error);
    res.status(500).json({ error: "Failed to remove algorithm bookmark" });
  }
}

/**
 * GET /api/progress/algorithms/bookmarks
 * Returns all bookmarked algorithms for the authenticated user,
 * ordered strictly by bookmarkedAt descending.
 */
async function getMyBookmarkedAlgorithms(req, res) {
  try {
    const progress = await getOrCreateProgress(req.user.id);
    const bookmarks = progress.bookmarkedAlgorithms || [];

    if (!bookmarks.length) {
      return res.json({ success: true, bookmarks: [] });
    }

    // Sort by bookmarkedAt descending
    const sorted = bookmarks.slice().sort(
      (a, b) => new Date(b.bookmarkedAt).getTime() - new Date(a.bookmarkedAt).getTime()
    );

    const algoIds = sorted.map((b) => b.algorithmId);
    const algos = await Algorithm.find({
      id: { $in: algoIds },
    }).select("-__v");

    const algoMap = new Map(algos.map((a) => [a.id, a]));

    const orderedAlgos = sorted
      .map((b) => {
        const algo = algoMap.get(b.algorithmId);
        if (!algo) return null;
        return {
          ...algo.toObject(),
          bookmarkedAt: b.bookmarkedAt,
        };
      })
      .filter(Boolean);

    res.json({
      success: true,
      bookmarks: orderedAlgos,
    });
  } catch (error) {
    console.error("Error fetching bookmarked algorithms:", error);
    res.status(500).json({ error: "Failed to fetch algorithm bookmarks" });
  }
}

module.exports = {
  getMyProgress,
  markLectureComplete,
  recordChallengeCompletion,
  recordAlgorithmRun,
  getCohortProgress,
  getOrCreateProgress,
  updateMicroModuleStatus,
  bookmarkMicroModule,
  unbookmarkMicroModule,
  getMyBookmarks,
  bookmarkAlgorithm,
  unbookmarkAlgorithm,
  getMyBookmarkedAlgorithms,
};
