import app from "./app";
import { logger } from "./utils/logger";

const PORT = process.env.PORT || 3000;

// Start server (only when running locally, not in serverless)
if (require.main === module) {
  const server = app.listen(PORT, () => {
    logger.info(`🚀 Server is running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
    logger.info(`API Base URL: http://localhost:${PORT}/api`);
    logger.info(`Health Check: http://localhost:${PORT}/api/health`);
    logger.info(
      `Database: ${process.env.DATABASE_URL ? "Connected" : "Not configured"}`
    );

    if (process.env.NODE_ENV === "development") {
      logger.info(`Development mode - Enhanced logging enabled`);
      if (process.env.SKIP_AUTH === "true") {
        logger.warn(`Authentication bypassed for development`);
      }
    }
  });

  // Handle server errors
  server.on("error", (error: any) => {
    if (error.code === "EADDRINUSE") {
      logger.error(`❌ Port ${PORT} is already in use`);
    } else {
      logger.error("❌ Server error", { error: error.message });
    }
    process.exit(1);
  });

  // Graceful shutdown handlers
  process.on("SIGTERM", async () => {
    logger.info("SIGTERM received, shutting down gracefully");
    server.close(() => {
      logger.info("HTTP server closed");
      process.exit(0);
    });
  });

  process.on("SIGINT", async () => {
    logger.info(" SIGINT received, shutting down gracefully");
    server.close(() => {
      logger.info("HTTP server closed");
      process.exit(0);
    });
  });
}

export default app;
