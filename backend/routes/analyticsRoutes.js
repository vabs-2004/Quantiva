const express = require("express");
const router = express.Router();
const { authenticate, adminOnly } = require("../middleware/auth");
const { getUserAnalytics, trackPageVisit, getPageViews } = require("../controllers/analyticsController");
const { cacheData } = require("../middleware/cache");

router.get("/users", authenticate, adminOnly, cacheData("analytics:users", 300), getUserAnalytics);
router.post("/track-page", authenticate, trackPageVisit);
router.get("/page-views", authenticate, adminOnly, cacheData("analytics:pages", 60), getPageViews);

module.exports = router;
