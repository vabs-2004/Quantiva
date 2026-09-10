const express = require("express");
const { searchNews, topHeadlines } = require("../controllers/gnewsController");

const router = express.Router();

// Public endpoints — no auth required for reading news
router.get("/search", searchNews);
router.get("/top-headlines", topHeadlines);

module.exports = router;
