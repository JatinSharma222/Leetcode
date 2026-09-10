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
