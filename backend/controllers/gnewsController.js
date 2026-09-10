/**
 * GNews API Controller
 *
 * Proxies requests to the GNews API so the API key stays server-side.
 * Supports search queries, topic browsing, and top headlines — all
 * focused on quantum computing / quantum technology content.
 *
 * GNews free tier: 100 requests/day, 10 articles per request.
 * Docs: https://gnews.io/docs/v4
 */

const GNEWS_API_KEY = process.env.GNEWS_API_KEY;
const GNEWS_BASE = "https://gnews.io/api/v4";

// In-memory cache to stay within the 100 req/day free-tier limit
const cache = new Map();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

function getCached(key) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, ts: Date.now() });
}

/**
 * GET /api/gnews/search?q=quantum&lang=en&max=10&page=1
 *
 * Search GNews for articles matching a query.
 * Defaults to "quantum computing" if no query is provided.
 */
async function searchNews(req, res) {
  try {
    if (!GNEWS_API_KEY) {
      return res.status(500).json({ error: "GNews API key is not configured." });
    }

    const query = req.query.q || "quantum computing";
    const lang = req.query.lang || "en";
    const max = Math.min(parseInt(req.query.max) || 10, 10); // GNews free tier max is 10
    const page = parseInt(req.query.page) || 1;

    const cacheKey = `search:${query}:${lang}:${max}:${page}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const url = new URL(`${GNEWS_BASE}/search`);
    url.searchParams.set("q", query);
    url.searchParams.set("lang", lang);
    url.searchParams.set("max", max);
    url.searchParams.set("apikey", GNEWS_API_KEY);

    // GNews uses page parameter starting from 1
    if (page > 1) {
      url.searchParams.set("page", page);
    }

    const response = await fetch(url.toString());
    
    if (!response.ok) {
      const errText = await response.text();
      console.error("GNews API error:", response.status, errText);
      return res.status(response.status).json({ error: "Failed to fetch news from GNews.", details: errText });
    }

    const data = await response.json();

    // Normalize GNews response to match our app's news format
    const normalizedArticles = (data.articles || []).map((article, idx) => ({
      _id: `gnews_${Date.now()}_${idx}`,
      title: article.title,
      excerpt: article.description || "",
      source: article.source?.name || "Unknown",
      date: article.publishedAt || new Date().toISOString(),
      tag: categorizeArticle(article.title, article.description),
      image: article.image || null,
      externalUrl: article.url,
      content: article.content || article.description || "",
      isFeatured: idx === 0,
      isExternal: true, // Flag to differentiate from DB news
    }));

    const result = {
      totalArticles: data.totalArticles || normalizedArticles.length,
      articles: normalizedArticles,
    };

    setCache(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error("GNews search error:", error);
    res.status(500).json({ error: "Failed to fetch news from GNews." });
  }
}

/**
 * GET /api/gnews/top-headlines?topic=technology&lang=en&max=10
 *
 * Fetch top headlines, optionally filtered by topic.
 */
async function topHeadlines(req, res) {
  try {
    if (!GNEWS_API_KEY) {
      return res.status(500).json({ error: "GNews API key is not configured." });
    }

    const topic = req.query.topic || "technology";
    const lang = req.query.lang || "en";
    const max = Math.min(parseInt(req.query.max) || 10, 10);

    const cacheKey = `headlines:${topic}:${lang}:${max}`;
    const cached = getCached(cacheKey);
    if (cached) return res.json(cached);

    const url = new URL(`${GNEWS_BASE}/top-headlines`);
    url.searchParams.set("topic", topic);
    url.searchParams.set("lang", lang);
    url.searchParams.set("max", max);
    url.searchParams.set("apikey", GNEWS_API_KEY);

    const response = await fetch(url.toString());

    if (!response.ok) {
      const errText = await response.text();
      console.error("GNews headlines error:", response.status, errText);
      return res.status(response.status).json({ error: "Failed to fetch headlines from GNews." });
    }

    const data = await response.json();

    const normalizedArticles = (data.articles || []).map((article, idx) => ({
      _id: `gnews_hl_${Date.now()}_${idx}`,
      title: article.title,
      excerpt: article.description || "",
      source: article.source?.name || "Unknown",
      date: article.publishedAt || new Date().toISOString(),
      tag: categorizeArticle(article.title, article.description),
      image: article.image || null,
      externalUrl: article.url,
      content: article.content || article.description || "",
      isFeatured: idx === 0,
      isExternal: true,
    }));

    const result = {
      totalArticles: data.totalArticles || normalizedArticles.length,
      articles: normalizedArticles,
    };

    setCache(cacheKey, result);
    res.json(result);
  } catch (error) {
    console.error("GNews headlines error:", error);
    res.status(500).json({ error: "Failed to fetch headlines from GNews." });
  }
}

/**
 * Auto-categorize articles based on title/description keywords.
 */
function categorizeArticle(title = "", description = "") {
  const text = `${title} ${description}`.toLowerCase();

  if (/hardware|chip|processor|qubit|photon|superconducti/i.test(text)) return "Hardware";
  if (/research|study|paper|discover|breakthrough/i.test(text)) return "Research";
  if (/policy|regulation|govern|law|standard/i.test(text)) return "Policy";
  if (/industry|company|business|startup|invest|market/i.test(text)) return "Industry";
  if (/algorithm|error.correct|compil|software|code/i.test(text)) return "Algorithm";
  if (/defence|defense|military|security|cyber/i.test(text)) return "Defence";
  if (/space|satellite|nasa|isro|orbit/i.test(text)) return "Space";
  if (/health|medic|drug|pharma|dna|genom/i.test(text)) return "Healthcare";

  return "Research"; // Default
}

module.exports = { searchNews, topHeadlines };
