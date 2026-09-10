const UserProgress = require("../models/UserProgress");
const Course = require("../models/Course");
const Challenge = require("../models/Challenge");
const User = require("../models/User");
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
    const [totalCourses, totalChallenges] = await Promise.all([
      Course.countDocuments(),
      Challenge.countDocuments(),
    ]);

    const coursesCompleted = progress.courseProgress.filter((c) => c.completed).length;
    const challengesCompleted = progress.challengeProgress.filter((c) => c.completed).length;

    res.json({
      progress,
      summary: {
        totalCourses,
        coursesCompleted,
        totalChallenges,
        challengesCompleted,
        algorithmsRun: progress.algorithmRuns.length,
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

module.exports = {
  getMyProgress,
  markLectureComplete,
  recordChallengeCompletion,
  recordAlgorithmRun,
  getCohortProgress,
  getOrCreateProgress,
};
