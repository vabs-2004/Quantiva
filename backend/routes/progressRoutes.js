const express = require("express");
const router = express.Router();
const { authenticate, adminOnly } = require("../middleware/auth");
const {
  getMyProgress,
  markLectureComplete,
  recordAlgorithmRun,
  getCohortProgress,
} = require("../controllers/progressController");

router.get("/me", authenticate, getMyProgress);
router.post("/course/:courseId/lecture/:lectureIndex", authenticate, markLectureComplete);
router.post("/algorithm/:algorithmId", authenticate, recordAlgorithmRun);

// Instructor / admin cohort view
router.get("/cohort", authenticate, adminOnly, getCohortProgress);

module.exports = router;
