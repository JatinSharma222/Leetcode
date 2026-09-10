import type { Request, Response, NextFunction } from "express";
import { getRedisClient, redisClient } from "../lib/redis";

export interface RateLimiterOptions {
  windowMs?: number;
  max?: number;
  keyPrefix?: string;
  keyGenerator?: (req: Request) => string;
  message?: string;
  useRedis?: boolean;
}

export class InMemoryRateLimitStore {
  private hits: Map<string, number[]> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Periodically prune stale keys to prevent memory leaks
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, timestamps] of this.hits.entries()) {
        const valid = timestamps.filter((t) => now - t < 300000); // 5 min max
        if (valid.length === 0) {
          this.hits.delete(key);
        } else {
          this.hits.set(key, valid);
        }
      }
    }, 60000);

    // Unref interval so it won't block process exit or tests
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  public checkAndIncrement(
    key: string,
    windowMs: number,
    max: number,
  ): {
    allowed: boolean;
    currentCount: number;
    remaining: number;
    retryAfterSeconds: number;
    resetTimeMs: number;
  } {
    const now = Date.now();
    const windowStart = now - windowMs;
    const timestamps = (this.hits.get(key) || []).filter((t) => t > windowStart);

    if (timestamps.length >= max) {
      const oldestScore = timestamps[0] ?? windowStart;
      const resetTimeMs = oldestScore + windowMs;
      const retryAfterSeconds = Math.max(1, Math.ceil((resetTimeMs - now) / 1000));
      return {
        allowed: false,
        currentCount: timestamps.length,
        remaining: 0,
        retryAfterSeconds,
        resetTimeMs,
      };
    }

    timestamps.push(now);
    this.hits.set(key, timestamps);

    return {
      allowed: true,
      currentCount: timestamps.length,
      remaining: Math.max(0, max - timestamps.length),
      retryAfterSeconds: 0,
      resetTimeMs: now + windowMs,
    };
  }

  public reset(): void {
    this.hits.clear();
  }

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

const defaultInMemoryStore = new InMemoryRateLimitStore();

export function createRateLimiter(options: RateLimiterOptions = {}) {
  const windowMs = options.windowMs ?? 60 * 1000;
  const max = options.max ?? 5;
  const keyPrefix = options.keyPrefix ?? "ratelimit:";
  const useRedis = options.useRedis ?? true;

  const keyGenerator =
    options.keyGenerator ??
    ((req: Request) => {
      if (req.user?.userId) {
        return `user:${req.user.userId}`;
      }
      const forwarded = req.headers["x-forwarded-for"];
      const ip =
        typeof forwarded === "string"
          ? forwarded.split(",")[0]?.trim()
          : req.ip || req.socket?.remoteAddress || "unknown";
      return `ip:${ip}`;
    });

  return async (req: Request, res: Response, next: NextFunction) => {
    const identifier = keyGenerator(req);
    const fullKey = `${keyPrefix}${identifier}`;
    const now = Date.now();

    // 1. Attempt Redis sliding window if enabled and open
    if (useRedis) {
      try {
        const client = await getRedisClient();

        if (client.isOpen) {
          const windowStart = now - windowMs;

          // Remove expired hits outside current window
          await client.zRemRangeByScore(fullKey, 0, windowStart);

          // Get count within current sliding window
          const currentCount = await client.zCard(fullKey);

          if (currentCount >= max) {
            // Retrieve oldest timestamp in window to calculate exact retryAfter
            const oldestEntries = await client.zRangeWithScores(fullKey, 0, 0);
            const oldestScore =
              oldestEntries.length > 0 && typeof oldestEntries[0]?.score === "number"
                ? oldestEntries[0].score
                : windowStart;

            const resetTimeMs = oldestScore + windowMs;
            const retryAfterSeconds = Math.max(1, Math.ceil((resetTimeMs - now) / 1000));

            res.setHeader("Retry-After", retryAfterSeconds.toString());
            res.setHeader("X-RateLimit-Limit", max.toString());
            res.setHeader("X-RateLimit-Remaining", "0");
            res.setHeader("X-RateLimit-Reset", Math.ceil(resetTimeMs / 1000).toString());

            return res.status(429).json({
              message:
                options.message ??
                `Too many submission attempts. Please wait ${retryAfterSeconds} second${
                  retryAfterSeconds === 1 ? "" : "s"
                } before submitting again.`,
              retryAfter: retryAfterSeconds,
            });
          }

          // Under limit: record this hit
          const member = `${now}:${Math.random().toString(36).slice(2, 9)}`;
          await client.zAdd(fullKey, [{ score: now, value: member }]);
          await client.pExpire(fullKey, windowMs);

          const remaining = max - currentCount - 1;
          res.setHeader("X-RateLimit-Limit", max.toString());
          res.setHeader("X-RateLimit-Remaining", Math.max(0, remaining).toString());
          res.setHeader("X-RateLimit-Reset", Math.ceil((now + windowMs) / 1000).toString());

          return next();
        }
      } catch (redisErr) {
        console.warn(
          "[RateLimiter] Redis error encountered, falling back to in-memory store:",
          redisErr instanceof Error ? redisErr.message : redisErr,
        );
      }
    }

    // 2. In-memory fallback if Redis is unavailable or threw an error
    const result = defaultInMemoryStore.checkAndIncrement(fullKey, windowMs, max);

    res.setHeader("X-RateLimit-Limit", max.toString());
    res.setHeader("X-RateLimit-Remaining", result.remaining.toString());
    res.setHeader("X-RateLimit-Reset", Math.ceil(result.resetTimeMs / 1000).toString());

    if (!result.allowed) {
      res.setHeader("Retry-After", result.retryAfterSeconds.toString());
      return res.status(429).json({
        message:
          options.message ??
          `Too many submission attempts. Please wait ${result.retryAfterSeconds} second${
            result.retryAfterSeconds === 1 ? "" : "s"
          } before submitting again.`,
        retryAfter: result.retryAfterSeconds,
      });
    }

    next();
  };
}

// Configurable submission rate limiter
const submissionMax = Number(process.env.SUBMISSION_RATE_LIMIT_MAX) || 5;
const submissionWindowSeconds =
  Number(process.env.SUBMISSION_RATE_LIMIT_WINDOW_SECONDS) || 60;

export const submissionRateLimiter = createRateLimiter({
  max: submissionMax,
  windowMs: submissionWindowSeconds * 1000,
  keyPrefix: "ratelimit:submission:",
  keyGenerator: (req: Request) => {
    if (req.user?.userId) {
      return `user:${req.user.userId}`;
    }
    const forwarded = req.headers["x-forwarded-for"];
    const ip =
      typeof forwarded === "string"
        ? forwarded.split(",")[0]?.trim()
        : req.ip || req.socket?.remoteAddress || "unknown";
    return `ip:${ip}`;
  },
});
