import path from "path";
import { config } from "dotenv";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

config({ path: path.resolve(import.meta.dirname, "../../../.env") });

if (!process.env.DATABASE_URL) {
  throw new Error("FATAL: DATABASE_URL environment variable is required but not set.");
}

// PrismaPg in Prisma 7.x accepts connectionString directly — no raw pg.Pool needed
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });

// Use globalThis singleton pattern to avoid exhausting connections during HMR
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export * from "../generated/prisma/client";
