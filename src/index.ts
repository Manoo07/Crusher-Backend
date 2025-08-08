import app from "./app";

const PORT = process.env.PORT || 3000;

// Start server (only when running locally, not in serverless)
if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`📊 API Base URL: http://localhost:${PORT}/api`);
    console.log(`📊 Health Check: http://localhost:${PORT}/api/health`);
    console.log(
      `🔧 Database: ${
        process.env.DATABASE_URL ? "Connected" : "Not configured"
      }`
    );

    if (process.env.NODE_ENV === "development") {
      console.log(`🐛 Development mode - Enhanced logging enabled`);
      if (process.env.SKIP_AUTH === "true") {
        console.log(`⚠️  Authentication bypassed for development`);
      }
    }
  });

  // Handle server errors
  server.on("error", (error: any) => {
    if (error.code === "EADDRINUSE") {
      console.error(`❌ Port ${PORT} is already in use`);
    } else {
      console.error("❌ Server error:", error);
    }
    process.exit(1);
  });

  // Graceful shutdown handlers
  process.on("SIGTERM", async () => {
    console.log("🔄 SIGTERM received, shutting down gracefully");
    server.close(() => {
      console.log("✅ HTTP server closed");
      process.exit(0);
    });
  });

  process.on("SIGINT", async () => {
    console.log("🔄 SIGINT received, shutting down gracefully");
    server.close(() => {
      console.log("✅ HTTP server closed");
      process.exit(0);
    });
  });
}

export default app;
