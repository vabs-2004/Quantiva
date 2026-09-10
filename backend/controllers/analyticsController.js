const User = require("../models/User");
const PageVisit = require("../models/PageVisit");

function getMatchQueryForFilter(filter) {
  let matchQuery = {};
  if (filter && filter !== 'all') {
    const date = new Date();
    if (filter === 'week') date.setDate(date.getDate() - 7);
    else if (filter === 'month') date.setMonth(date.getMonth() - 1);
    else if (filter === '5months') date.setMonth(date.getMonth() - 5);
    else if (filter === 'year') date.setFullYear(date.getFullYear() - 1);
    else if (filter === '10years') date.setFullYear(date.getFullYear() - 10);
    
    matchQuery.createdAt = { $gte: date };
  }
  return matchQuery;
}

/**
 * GET /api/analytics/users
 * Returns aggregated user statistics for OS, Gender, and Age Groups.
 */
async function getUserAnalytics(req, res) {
  try {
    const { filter } = req.query;
    const dateQuery = getMatchQueryForFilter(filter);

    const osData = await User.aggregate([
      { $match: { role: { $ne: "admin" }, ...dateQuery } },
      { $group: { _id: "$os", count: { $sum: 1 } } }
    ]);

    const genderData = await User.aggregate([
      { $match: { role: { $ne: "admin" }, ...dateQuery } },
      { $group: { _id: "$gender", count: { $sum: 1 } } }
    ]);

    const ageData = await User.aggregate([
      { $match: { role: { $ne: "admin" }, dob: { $exists: true, $ne: null }, ...dateQuery } },
      {
        $project: {
          age: {
            $divide: [
              { $subtract: [new Date(), "$dob"] },
              31536000000 // milliseconds in a year (365 days)
            ]
          }
        }
      },
      {
        $bucket: {
          groupBy: "$age",
          boundaries: [0, 18, 25, 35, 45, 55, 65, 100],
          default: "Other",
          output: { count: { $sum: 1 } }
        }
      }
    ]);

    // Format outputs for Recharts
    const formatData = (data, nameKey = "name") => data.map(d => ({ [nameKey]: d._id || "Unknown", value: d.count }));

    const formattedAgeData = ageData.map(d => {
      let label = "";
      if (d._id === 0) label = "< 18";
      else if (d._id === 18) label = "18-24";
      else if (d._id === 25) label = "25-34";
      else if (d._id === 35) label = "35-44";
      else if (d._id === 45) label = "45-54";
      else if (d._id === 55) label = "55-64";
      else if (d._id === 65) label = "65+";
      else label = "Other";
      return { name: label, value: d.count };
    });

    res.json({
      os: formatData(osData),
      gender: formatData(genderData),
      age: formattedAgeData
    });
  } catch (error) {
    console.error("Error fetching user analytics:", error);
    res.status(500).json({ error: "Failed to fetch user analytics." });
  }
}

/**
 * POST /api/analytics/track-page
 * Increments the visit count for a specific path today.
 */
async function trackPageVisit(req, res) {
  try {
    let { path } = req.body;
    if (!path) return res.status(400).json({ error: "Path is required" });
    if (path.length > 1 && path.endsWith('/')) {
      path = path.slice(0, -1);
    }

    // Normalize date to today (start of day)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Upsert the count
    await PageVisit.findOneAndUpdate(
      { path, date: today },
      { $inc: { count: 1 } },
      { upsert: true, new: true }
    );

    res.json({ success: true });
  } catch (error) {
    console.error("Error tracking page visit:", error);
    res.status(500).json({ error: "Failed to track page visit" });
  }
}

/**
 * GET /api/analytics/page-views
 * Returns page views aggregated by path. Accepts an optional time filter query param.
 */
async function getPageViews(req, res) {
  try {
    const { filter } = req.query; // 'week', 'month', '5months', 'year', '10years', 'all'
    
    let matchQuery = {};
    if (filter && filter !== 'all') {
      const date = new Date();
      if (filter === 'week') date.setDate(date.getDate() - 7);
      else if (filter === 'month') date.setMonth(date.getMonth() - 1);
      else if (filter === '5months') date.setMonth(date.getMonth() - 5);
      else if (filter === 'year') date.setFullYear(date.getFullYear() - 1);
      else if (filter === '10years') date.setFullYear(date.getFullYear() - 10);
      
      // For page views, the field is 'date' not 'createdAt'
      matchQuery.date = { $gte: date };
    }

    const data = await PageVisit.aggregate([
      { $match: matchQuery },
      { $group: { _id: "$path", totalVisits: { $sum: "$count" } } },
      { $sort: { totalVisits: -1 } },
      { $limit: 10 } // Top 10 most visited pages
    ]);

    const formatted = data.map(d => ({
      name: d._id,
      visits: d.totalVisits
    }));

    res.json(formatted);
  } catch (error) {
    console.error("Error fetching page views:", error);
    res.status(500).json({ error: "Failed to fetch page views" });
  }
}

module.exports = { getUserAnalytics, trackPageVisit, getPageViews };
