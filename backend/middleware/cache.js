const { createClient } = require("redis");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../../.env") }); // Adjusted to point to root .env from middleware

let redisClient = null;

const initRedis = async () => {
  try {
    if (!process.env.REDIS_URL) {
      console.warn("⚠️ REDIS_URL is not set. Caching is disabled.");
      return;
    }
    
    redisClient = createClient({
      url: process.env.REDIS_URL,
      socket: { reconnectStrategy: false }
    });

    redisClient.on("error", (error) => console.error(`❌ Redis Error: ${error}`));
    redisClient.on("connect", () => console.log("✅ Redis connected"));

    await redisClient.connect();
  } catch (error) {
    console.error("❌ Redis connection failed:", error.message);
    if (redisClient) {
      redisClient.disconnect().catch(() => {});
      redisClient = null;
    }
  }
};

const getRedisClient = () => redisClient;

// Express middleware for caching
const cacheData = (keyPrefix, ttlSeconds = 3600) => {
  return async (req, res, next) => {
    if (!redisClient) {
      return next(); // Skip caching if Redis is not connected
    }

    try {
      // Build unique cache key based on route and query params
      const queryParams = new URLSearchParams(req.query).toString();
      const cacheKey = `${keyPrefix}:${req.path}:${queryParams}`;

      const cachedData = await redisClient.get(cacheKey);

      if (cachedData) {
        // Send cached data
        res.setHeader("X-Cache", "HIT");
        return res.status(200).json(JSON.parse(cachedData));
      }

      // If not in cache, we patch res.json to intercept the response and cache it
      res.setHeader("X-Cache", "MISS");
      const originalJson = res.json.bind(res);

      res.json = (body) => {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redisClient.setEx(cacheKey, ttlSeconds, JSON.stringify(body))
            .catch(err => console.error("Redis setEx error:", err));
        }
        return originalJson(body);
      };

      next();
    } catch (error) {
      console.error("Cache middleware error:", error);
      next(); // Proceed to controller if cache fails
    }
  };
};

const invalidateCache = async (keyPrefix) => {
  if (!redisClient) return;

  try {
    // Delete all keys matching the prefix
    const keys = await redisClient.keys(`${keyPrefix}*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
      console.log(`🧹 Cache invalidated for prefix: ${keyPrefix}`);
    }
  } catch (error) {
    console.error("Cache invalidation error:", error);
  }
};

const clearCache = (keyPrefix) => {
  return async (req, res, next) => {
    await invalidateCache(keyPrefix);
    next();
  };
};

module.exports = {
  initRedis,
  getRedisClient,
  cacheData,
  invalidateCache,
  clearCache
};
