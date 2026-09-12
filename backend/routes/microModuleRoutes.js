const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/auth");
const {
  getAllMicroModules,
  getMicroModuleById,
} = require("../controllers/microModuleController");
const { getMyBookmarks } = require("../controllers/progressController");

// Authenticated bookmarks route - MUST be registered BEFORE /:id to prevent "bookmarks" being matched as an ID
router.get("/bookmarks", authenticate, getMyBookmarks);

// Public endpoints to retrieve curriculum micro-modules
router.get("/", getAllMicroModules);
router.get("/:id", getMicroModuleById);

module.exports = router;
