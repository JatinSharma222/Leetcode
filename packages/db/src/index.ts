import path from "path";
import { config } from "dotenv";
import { PrismaClient } from "../generated/prisma/client";

config({ path: path.resolve(import.meta.dirname, "../../../.env") });

if (!process.env.DATABASE_URL) {
  throw new Error("FATAL: DATABASE_URL environment variable is required but not set.");
}

// Use globalThis singleton pattern to avoid exhausting connections during HMR
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export * from "../generated/prisma/client";
