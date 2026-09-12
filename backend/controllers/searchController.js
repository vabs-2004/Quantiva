const contentRegistryService = require("../services/contentRegistryService");

/**
 * GET /api/search
 * Query parameters:
 *  - q: search query string
 *  - category: all | micro_modules | algorithms | courses | docs
 *  - limit: number (default 50)
 *  - offset: number (default 0)
 */
async function searchResources(req, res) {
  try {
    const { q = "", category = "all", limit = 50, offset = 0 } = req.query;
    const user = req.user || null;

    const results = await contentRegistryService.search({
      q: String(q).trim(),
      category: String(category).toLowerCase(),
      user,
      limit: Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100),
      offset: Math.max(parseInt(offset, 10) || 0, 0),
    });

    res.json(results);
  } catch (error) {
    console.error("Error searching resources:", error);
    res.status(500).json({ error: "Failed to search learning resources." });
  }
}

/**
 * GET /api/explore/featured
 * Returns deterministic landing sections for empty state:
 * Foundations sequence, Core Algorithms, and Authoritative Topics.
 */
async function getExploreFeatured(req, res) {
  try {
    const user = req.user || null;
    const landingData = await contentRegistryService.getExploreLanding(user);
    res.json(landingData);
  } catch (error) {
    console.error("Error fetching explore featured content:", error);
    res.status(500).json({ error: "Failed to load explore featured content." });
  }
}

module.exports = {
  searchResources,
  getExploreFeatured,
};
