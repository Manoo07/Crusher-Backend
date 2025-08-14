import { PrismaClient } from "@prisma/client";

// Singleton Prisma Client
class DatabaseConnection {
  private static instance: PrismaClient | null = null;

  public static getInstance(): PrismaClient {
    if (!DatabaseConnection.instance) {
      // Configure Prisma logging based on environment
      const logLevels: Array<"info" | "query" | "warn" | "error"> = [];

      // Always include error logging
      logLevels.push("error");

      // Add other log levels based on environment and settings
      if (process.env.NODE_ENV === "development") {
        logLevels.push("info", "warn");

        // Only add query logging if explicitly enabled
        if (process.env.PRISMA_QUERY_LOG === "true") {
          logLevels.push("query");
        }
      }

      DatabaseConnection.instance = new PrismaClient({
        log: logLevels,
      });
    }
    return DatabaseConnection.instance;
  }

  public static async disconnect(): Promise<void> {
    if (DatabaseConnection.instance) {
      await DatabaseConnection.instance.$disconnect();
      DatabaseConnection.instance = null;
    }
  }
}

export const prisma = DatabaseConnection.getInstance();
export default DatabaseConnection;
