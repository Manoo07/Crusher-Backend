import { PrismaClient } from "@prisma/client";

// Singleton Prisma Client with enhanced connection management
class DatabaseConnection {
  private static instance: PrismaClient | null = null;
  private static isConnecting: boolean = false;

  public static getInstance(): PrismaClient {
    if (!DatabaseConnection.instance && !DatabaseConnection.isConnecting) {
      DatabaseConnection.isConnecting = true;

      try {
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
          datasources: {
            db: {
              url: process.env.DATABASE_URL,
            },
          },
        });

        // Handle process termination gracefully
        const gracefulShutdown = async (signal: string) => {
          console.log(`Received ${signal}, shutting down gracefully...`);
          await DatabaseConnection.disconnect();
          process.exit(0);
        };

        process.once("SIGINT", () => gracefulShutdown("SIGINT"));
        process.once("SIGTERM", () => gracefulShutdown("SIGTERM"));
        process.once("beforeExit", () => {
          DatabaseConnection.disconnect().catch(console.error);
        });

        // Handle uncaught errors - commented out due to TypeScript limitations
        // DatabaseConnection.instance.$on("error", (e) => {
        //   console.error("Prisma Client error:", e);
        // });

        // Connect explicitly with retry logic
        DatabaseConnection.connectWithRetry();
      } catch (error) {
        console.error("Failed to initialize Prisma Client:", error);
        DatabaseConnection.isConnecting = false;
        throw error;
      }

      DatabaseConnection.isConnecting = false;
    }

    return DatabaseConnection.instance!;
  }

  private static async connectWithRetry(maxRetries: number = 3): Promise<void> {
    if (!DatabaseConnection.instance) return;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        await DatabaseConnection.instance.$connect();
        console.log("✅ Database connected successfully");
        return;
      } catch (error) {
        console.error(
          `❌ Database connection attempt ${attempt} failed:`,
          error
        );

        if (attempt === maxRetries) {
          console.error("❌ All database connection attempts failed");
          throw error;
        }

        // Wait before retrying (exponential backoff)
        const waitTime = Math.pow(2, attempt) * 1000;
        console.log(`⏳ Retrying connection in ${waitTime / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, waitTime));
      }
    }
  }

  public static async disconnect(): Promise<void> {
    if (DatabaseConnection.instance) {
      try {
        console.log("🔌 Disconnecting from database...");
        await DatabaseConnection.instance.$disconnect();
        console.log("✅ Database disconnected successfully");
      } catch (error) {
        console.error("❌ Error disconnecting from database:", error);
      } finally {
        DatabaseConnection.instance = null;
        DatabaseConnection.isConnecting = false;
      }
    }
  }

  // Health check method
  public static async healthCheck(): Promise<boolean> {
    if (!DatabaseConnection.instance) {
      return false;
    }

    try {
      await DatabaseConnection.instance.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      console.error("Database health check failed:", error);
      return false;
    }
  }

  // Connection reset method for recovering from connection issues
  public static async resetConnection(): Promise<void> {
    console.log("🔄 Resetting database connection...");
    await DatabaseConnection.disconnect();
    DatabaseConnection.getInstance();
  }
}

// Enhanced Prisma instance with additional error handling
export const prisma = DatabaseConnection.getInstance();

// Add a wrapper for database operations with automatic retry
export class DatabaseWrapper {
  private static maxRetries = 3;
  private static retryDelay = 1000;

  static async executeWithRetry<T>(
    operation: () => Promise<T>,
    context: string = "Database operation"
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.error(
          `${context} failed (attempt ${attempt}/${this.maxRetries}):`,
          error
        );

        // Check if it's a connection-related error
        if (this.isConnectionError(error as Error)) {
          console.log("🔄 Connection error detected, resetting connection...");
          await DatabaseConnection.resetConnection();
        }

        if (attempt < this.maxRetries) {
          const waitTime = this.retryDelay * attempt;
          console.log(
            `⏳ Retrying ${context} in ${waitTime / 1000} seconds...`
          );
          await new Promise((resolve) => setTimeout(resolve, waitTime));
        }
      }
    }

    throw lastError!;
  }

  private static isConnectionError(error: Error): boolean {
    const connectionErrorKeywords = [
      "connection pool",
      "connection timeout",
      "timed out",
      "connection closed",
      "connection reset",
      "connection refused",
      "connection lost",
    ];

    return connectionErrorKeywords.some((keyword) =>
      error.message.toLowerCase().includes(keyword)
    );
  }
}

export default DatabaseConnection;
