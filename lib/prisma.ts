import { PrismaClient } from "@/app/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaPg } from "@prisma/adapter-pg";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";

if (!process.env.DATABASE_URL) {
  dotenv.config();
  if (!process.env.DATABASE_URL && process.env.NODE_ENV !== "production") {
    try {
      const candidatePaths = [
        path.resolve(process.cwd(), ".env"),
        path.resolve(process.cwd(), "../.env"),
      ];
      for (const envPath of candidatePaths) {
        if (fs.existsSync(envPath)) {
          dotenv.config({ path: envPath });
          if (process.env.DATABASE_URL) break;
        }
      }
    } catch {
      // Ignore in bundled runtime
    }
  }
}

const globalForPrisma = globalThis as {
  prisma?: PrismaClient;
};

function getAdapter() {
  const connectionString = process.env.DATABASE_URL || "";
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set. Please ensure your .env file is present and contains a valid DATABASE_URL."
    );
  }
  if (connectionString.includes("neon.tech")) {
    return new PrismaNeon({ connectionString });
  }
  return new PrismaPg({ connectionString });
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter: getAdapter() });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}