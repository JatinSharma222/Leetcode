import { createClient } from "redis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

export const redisClient = createClient({ url: redisUrl });

redisClient.on("error", (err) => {
  console.error("Redis Client Error:", err);
});

// Eagerly connect without throwing unhandled rejection at startup
redisClient.connect().catch((err) => {
  console.error("Failed to connect to Redis initially:", err);
});

export async function getRedisClient() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
  return redisClient;
}

/**
 * Creates a dedicated Redis client instance for blocking commands (e.g. BRPOP)
 * so that shared connection operations (rate limiting, queue pushes) are never blocked.
 */
export async function createDedicatedRedisClient() {
  const client = redisClient.duplicate();
  client.on("error", (err) => {
    console.error("Dedicated Redis Client Error:", err);
  });
  await client.connect();
  return client;
}
