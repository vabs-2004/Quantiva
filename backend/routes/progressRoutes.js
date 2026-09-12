const express = require("express");
const router = express.Router();
const { authenticate, adminOnly } = require("../middleware/auth");
const {
  getMyProgress,
  markLectureComplete,
  recordAlgorithmRun,
  getCohortProgress,
  updateMicroModuleStatus,
  bookmarkMicroModule,
  unbookmarkMicroModule,
  getMyBookmarks,
  bookmarkAlgorithm,
  unbookmarkAlgorithm,
  getMyBookmarkedAlgorithms,
} = require("../controllers/progressController");

router.get("/me", authenticate, getMyProgress);

// ─── Micro-Module Bookmark Routes ─────────────────
// Registered BEFORE /micro-module/:moduleId to prevent path collision
router.get("/micro-modules/bookmarks", authenticate, getMyBookmarks);
router.post("/micro-module/:moduleId/bookmark", authenticate, bookmarkMicroModule);
router.delete("/micro-module/:moduleId/bookmark", authenticate, unbookmarkMicroModule);

// ─── Algorithm Bookmark Routes ─────────────────────
router.get("/algorithms/bookmarks", authenticate, getMyBookmarkedAlgorithms);
router.post("/algorithm/:algorithmId/bookmark", authenticate, bookmarkAlgorithm);
router.delete("/algorithm/:algorithmId/bookmark", authenticate, unbookmarkAlgorithm);

// ─── Micro-Module Progress Routes ─────────────────
router.put("/micro-module/:moduleId", authenticate, updateMicroModuleStatus);

router.post("/course/:courseId/lecture/:lectureIndex", authenticate, markLectureComplete);
router.post("/algorithm/:algorithmId", authenticate, recordAlgorithmRun);

// Instructor / admin cohort view
router.get("/cohort", authenticate, adminOnly, getCohortProgress);

module.exports = router;
