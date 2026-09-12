const express = require("express");
const router = express.Router();
const {
  getAllTopics,
  getTopicById,
  getTopicByResource,
} = require("../controllers/topicController");
const { optionalAuthenticate } = require("../middleware/auth");

// Topic Navigator endpoints with optional user authentication for progress overlays
router.get("/", optionalAuthenticate, getAllTopics);
router.get("/by-resource/:resourceType/:resourceId", optionalAuthenticate, getTopicByResource);
router.get("/:topicId", optionalAuthenticate, getTopicById);

module.exports = router;
