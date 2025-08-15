import { NextFunction, Request, Response } from "express";
import DatabaseConnection, { DatabaseWrapper } from "../utils/database";
import { logger } from "../utils/logger";
import { ResponseUtil } from "../utils/response";

export class DatabaseMiddleware {
  /**
   * Middleware to ensure database connection is healthy before processing requests
   */
  static ensureConnection() {
    return async (
      req: Request,
      res: Response,
      next: NextFunction
    ): Promise<void> => {
      try {
        const isHealthy = await DatabaseConnection.healthCheck();

        if (!isHealthy) {
          logger.error("Database health check failed, attempting to reconnect");
          await DatabaseConnection.resetConnection();

          // Check again after reset
          const isHealthyAfterReset = await DatabaseConnection.healthCheck();
          if (!isHealthyAfterReset) {
            logger.error("Database connection could not be restored");
            ResponseUtil.error(
              res,
              "Database connection unavailable. Please try again later.",
              503 // Service Unavailable
            );
            return;
          }
        }

        next();
      } catch (error) {
        logger.error("Database middleware error:", error);
        ResponseUtil.error(
          res,
          "Database connection error. Please try again later.",
          503
        );
        return;
      }
    };
  }

  /**
   * Middleware to wrap database operations with automatic retry
   */
  static withRetry() {
    return (req: Request, res: Response, next: NextFunction): void => {
      // Attach the DatabaseWrapper to the request for easy access
      (req as any).dbWrapper = DatabaseWrapper;
      next();
    };
  }

  /**
   * Error handler for database-specific errors
   */
  static handleDatabaseErrors() {
    return (
      error: any,
      req: Request,
      res: Response,
      next: NextFunction
    ): void => {
      // Check if it's a database-related error
      if (this.isDatabaseError(error)) {
        logger.error("Database error occurred:", {
          error: error.message,
          stack: error.stack,
          url: req.url,
          method: req.method,
        });

        // Attempt to recover the connection
        DatabaseConnection.resetConnection().catch((resetError) => {
          logger.error("Failed to reset database connection:", resetError);
        });

        ResponseUtil.error(
          res,
          "A database error occurred. Please try again.",
          500
        );
        return;
      }

      // Pass non-database errors to the next error handler
      next(error);
    };
  }

  private static isDatabaseError(error: any): boolean {
    if (!error) return false;

    const errorMessage = error.message?.toLowerCase() || "";
    const databaseErrorKeywords = [
      "connection pool",
      "connection timeout",
      "timed out fetching",
      "connection closed",
      "connection reset",
      "connection refused",
      "prisma",
      "postgresql",
      "mysql",
      "database",
    ];

    return databaseErrorKeywords.some((keyword) =>
      errorMessage.includes(keyword)
    );
  }
}
