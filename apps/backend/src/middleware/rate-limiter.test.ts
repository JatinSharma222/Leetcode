import { describe, it, expect, beforeEach, afterAll } from "bun:test";
import {
  createRateLimiter,
  InMemoryRateLimitStore,
} from "./rate-limiter";
import { getRedisClient } from "../lib/redis";
import type { Request, Response } from "express";

function createMockReqRes(options: {
  userId?: string;
  ip?: string;
} = {}) {
  const req = {
    headers: {},
    ip: options.ip || "127.0.0.1",
    socket: { remoteAddress: options.ip || "127.0.0.1" },
    user: options.userId ? { userId: options.userId, username: `user_${options.userId}` } : undefined,
  } as unknown as Request;

  const headers: Record<string, string> = {};
  let statusCode = 200;
  let responseBody: any = null;

  const res = {
    statusCode: 200,
    setHeader(name: string, value: string) {
      headers[name.toLowerCase()] = value;
      return res;
    },
    getHeader(name: string) {
      return headers[name.toLowerCase()];
    },
    status(code: number) {
      statusCode = code;
      res.statusCode = code;
      return res;
    },
    json(body: any) {
      responseBody = body;
      return res;
    },
  } as unknown as Response;

  return {
    req,
    res,
    getHeaders: () => headers,
    getStatusCode: () => statusCode,
    getResponseBody: () => responseBody,
  };
}

describe("InMemoryRateLimitStore", () => {
  let store: InMemoryRateLimitStore;

  beforeEach(() => {
    store = new InMemoryRateLimitStore();
  });

  afterAll(() => {
    store.destroy();
  });

  it("should allow requests up to the max limit", () => {
    const key = "test:in-mem:1";
    const res1 = store.checkAndIncrement(key, 2000, 3);
    expect(res1.allowed).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = store.checkAndIncrement(key, 2000, 3);
    expect(res2.allowed).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = store.checkAndIncrement(key, 2000, 3);
    expect(res3.allowed).toBe(true);
    expect(res3.remaining).toBe(0);
  });

  it("should block requests when exceeding max limit and provide retryAfterSeconds", () => {
    const key = "test:in-mem:2";
    store.checkAndIncrement(key, 2000, 2);
    store.checkAndIncrement(key, 2000, 2);

    const blocked = store.checkAndIncrement(key, 2000, 2);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterSeconds).toBeGreaterThanOrEqual(1);
  });

  it("should track limits independently across different keys", () => {
    store.checkAndIncrement("user:alice", 2000, 1);
    const blockedAlice = store.checkAndIncrement("user:alice", 2000, 1);
    expect(blockedAlice.allowed).toBe(false);

    // Bob should not be affected
    const allowedBob = store.checkAndIncrement("user:bob", 2000, 1);
    expect(allowedBob.allowed).toBe(true);
  });
});

describe("createRateLimiter middleware (in-memory mode)", () => {
  it("should allow requests within limit and populate rate limit headers", async () => {
    const limiter = createRateLimiter({
      max: 2,
      windowMs: 5000,
      useRedis: false,
      keyPrefix: "test:mem-mw:",
    });

    const mock1 = createMockReqRes({ userId: "mem-user-1" });
    let next1Called = false;
    await limiter(mock1.req, mock1.res, () => {
      next1Called = true;
    });

    expect(next1Called).toBe(true);
    expect(mock1.getHeaders()["x-ratelimit-limit"]).toBe("2");
    expect(mock1.getHeaders()["x-ratelimit-remaining"]).toBe("1");
    expect(mock1.getStatusCode()).toBe(200);

    const mock2 = createMockReqRes({ userId: "mem-user-1" });
    let next2Called = false;
    await limiter(mock2.req, mock2.res, () => {
      next2Called = true;
    });

    expect(next2Called).toBe(true);
    expect(mock2.getHeaders()["x-ratelimit-remaining"]).toBe("0");

    // 3rd attempt should be blocked
    const mock3 = createMockReqRes({ userId: "mem-user-1" });
    let next3Called = false;
    await limiter(mock3.req, mock3.res, () => {
      next3Called = true;
    });

    expect(next3Called).toBe(false);
    expect(mock3.getStatusCode()).toBe(429);
    expect(mock3.getHeaders()["retry-after"]).toBeDefined();
    expect(mock3.getResponseBody()?.message).toContain("Too many submission attempts");
    expect(mock3.getResponseBody()?.retryAfter).toBeGreaterThanOrEqual(1);
  });
});

describe("createRateLimiter middleware (Redis mode)", () => {
  const testPrefix = `test:redis-mw:${Date.now()}:`;

  afterAll(async () => {
    try {
      const client = await getRedisClient();
      if (client.isOpen) {
        const keys = await client.keys(`${testPrefix}*`);
        if (keys.length > 0) {
          await client.del(keys);
        }
      }
    } catch {
      // ignore cleanup errors
    }
  });

  it("should rate limit requests accurately with Redis sliding window", async () => {
    const limiter = createRateLimiter({
      max: 2,
      windowMs: 3000,
      useRedis: true,
      keyPrefix: testPrefix,
    });

    const mock1 = createMockReqRes({ userId: "redis-user-1" });
    let next1Called = false;
    await limiter(mock1.req, mock1.res, () => {
      next1Called = true;
    });

    expect(next1Called).toBe(true);
    expect(mock1.getStatusCode()).toBe(200);
    expect(mock1.getHeaders()["x-ratelimit-limit"]).toBe("2");
    expect(mock1.getHeaders()["x-ratelimit-remaining"]).toBe("1");

    const mock2 = createMockReqRes({ userId: "redis-user-1" });
    let next2Called = false;
    await limiter(mock2.req, mock2.res, () => {
      next2Called = true;
    });

    expect(next2Called).toBe(true);
    expect(mock2.getHeaders()["x-ratelimit-remaining"]).toBe("0");

    // 3rd request should receive 429
    const mock3 = createMockReqRes({ userId: "redis-user-1" });
    let next3Called = false;
    await limiter(mock3.req, mock3.res, () => {
      next3Called = true;
    });

    expect(next3Called).toBe(false);
    expect(mock3.getStatusCode()).toBe(429);
    expect(mock3.getHeaders()["retry-after"]).toBeDefined();
    expect(mock3.getResponseBody()?.retryAfter).toBeGreaterThanOrEqual(1);
    expect(mock3.getResponseBody()?.message).toContain("Too many submission attempts");

    // Another user is unaffected
    const mockOther = createMockReqRes({ userId: "redis-user-2" });
    let otherNextCalled = false;
    await limiter(mockOther.req, mockOther.res, () => {
      otherNextCalled = true;
    });

    expect(otherNextCalled).toBe(true);
    expect(mockOther.getStatusCode()).toBe(200);
  });

  it("should integrate seamlessly with an Express app endpoint", async () => {
    const express = (await import("express")).default;
    const testApp = express();
    testApp.use(express.json());

    const routeLimiter = createRateLimiter({
      max: 2,
      windowMs: 5000,
      useRedis: false,
      keyPrefix: "test:express-route:",
      keyGenerator: (req) => req.headers["x-test-user"]?.toString() || "test-user",
    });

    testApp.post("/test-submit", routeLimiter, (_req, res) => {
      res.status(201).json({ success: true });
    });

    const server = testApp.listen(0);
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;
    const baseUrl = `http://127.0.0.1:${port}`;

    try {
      // 1st request -> 201
      const res1 = await fetch(`${baseUrl}/test-submit`, {
        method: "POST",
        headers: { "x-test-user": "user-abc" },
      });
      expect(res1.status).toBe(201);
      expect(res1.headers.get("x-ratelimit-remaining")).toBe("1");

      // 2nd request -> 201
      const res2 = await fetch(`${baseUrl}/test-submit`, {
        method: "POST",
        headers: { "x-test-user": "user-abc" },
      });
      expect(res2.status).toBe(201);
      expect(res2.headers.get("x-ratelimit-remaining")).toBe("0");

      // 3rd request -> 429
      const res3 = await fetch(`${baseUrl}/test-submit`, {
        method: "POST",
        headers: { "x-test-user": "user-abc" },
      });
      expect(res3.status).toBe(429);
      expect(res3.headers.get("retry-after")).toBeDefined();
      const body3 = await res3.json();
      expect(body3.message).toContain("Too many submission attempts");
      expect(body3.retryAfter).toBeGreaterThanOrEqual(1);
    } finally {
      server.close();
    }
  });
});

