const express = require("express");
const router = express.Router();
const {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
} = require("../controllers/courseController");
const { authenticate, adminOnly } = require("../middleware/auth");
const { cacheData, clearCache } = require("../middleware/cache");

// Public routes with caching
router.get("/", cacheData(3600), getAllCourses); // cache for 1 hour
router.get("/:id", cacheData(3600), getCourseById);

// Admin only routes (clear cache on modification)
router.post("/", authenticate, adminOnly, clearCache("/api/courses"), createCourse);
router.put("/:id", authenticate, adminOnly, clearCache("/api/courses"), updateCourse);
router.delete("/:id", authenticate, adminOnly, clearCache("/api/courses"), deleteCourse);

module.exports = router;
