const express = require("express");
const router = express.Router();
const { searchResources, getExploreFeatured } = require("../controllers/searchController");
const { optionalAuthenticate } = require("../middleware/auth");

// Search & Explore endpoints (using optional authentication for future private module scoping)
router.get("/search", optionalAuthenticate, searchResources);
router.get("/explore/featured", optionalAuthenticate, getExploreFeatured);

module.exports = router;
