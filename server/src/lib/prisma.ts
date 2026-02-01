/**
 * Prisma Client singleton
 * Ensures only one instance of Prisma Client is created
 */

import { PrismaClient } from "@prisma/client";
import { env } from "../config/env";

// PrismaClient is attached to the `global` object in development to prevent
// exhausting database connections due to hot reloading
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    errorFormat: "pretty",
  });

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

// Graceful shutdown
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});

// Helper function to check database connection
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("✅ Database connection established");
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  }
}

// Helper function to run migrations
export async function runMigrations(): Promise<void> {
  try {
    console.log("🔄 Running database migrations...");
    // In production, migrations should be run separately
    // This is just for development convenience
    if (env.NODE_ENV === "development") {
      const { execSync } = await import("child_process");
      execSync("npx prisma migrate deploy", { stdio: "inherit" });
    }
    console.log("✅ Database migrations completed");
  } catch (error) {
    console.error("❌ Database migrations failed:", error);
    throw error;
  }
}
