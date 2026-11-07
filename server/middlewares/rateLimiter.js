import { Ratelimit } from "@upstash/ratelimit";
import redis from "../lib/redis.js";

// 1. Auth Rate Limiter (Max 10 requests per 15 minutes)
const authRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "15 m"),
  prefix: "rl:auth",
});

// 2. Scraper Rate Limiter (Max 3 requests per 1 minute)
const scraperRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, "1 m"),
  prefix: "rl:scraper",
});

// 3. API Rate Limiter (Max 100 requests per 15 minutes)
const apiRatelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(100, "15 m"),
  prefix: "rl:api",
});

// Helper to convert Upstash Ratelimit into standard Express middleware
const createMiddleware = (ratelimit, errorMessage) => {
  return async (req, res, next) => {
    const identifier = req.ip || "127.0.0.1";
    const { success, limit, remaining, reset } = await ratelimit.limit(identifier);

    // Standard rate limit headers
    res.setHeader("X-RateLimit-Limit", limit);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", reset);

    if (!success) {
      return res.status(429).json({ error: errorMessage });
    }
    next();
  };
};

export const authLimiter = createMiddleware(
  authRatelimit,
  "Too many attempts from this IP. Please try again after 15 minutes."
);

export const scraperLimiter = createMiddleware(
  scraperRatelimit,
  "Scraper endpoint rate limit exceeded. Please wait a minute."
);

export const apiLimiter = createMiddleware(
  apiRatelimit,
  "Too many API requests. Please slow down."
);