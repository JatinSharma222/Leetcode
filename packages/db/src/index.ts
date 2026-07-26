import path from "path";
import { config } from "dotenv";
import { PrismaClient } from "../generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";


config({ path: path.resolve(import.meta.dirname, "../../../.env") });

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

export const prisma = new PrismaClient({
  adapter,
});

export * from "../generated/prisma/client";
