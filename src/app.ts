import cors from "cors";
import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import { ErrorMiddleware } from "./middlewares/error";
import { apiRoutes } from "./routes";
import DatabaseConnection from "./utils/database";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:3000",
    credentials: true,
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (development only)
if (process.env.NODE_ENV === "development") {
  app.use((req: Request, res: Response, next: NextFunction) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// API Routes
app.use("/api", apiRoutes);

// Root endpoint
app.get("/", (req: Request, res: Response) => {
  res.json({
    success: true,
    message: "Crusher Backend API",
    version: "1.0.0",
    documentation: "/api/health",
    timestamp: new Date().toISOString(),
  });
});

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "OK",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
    version: "1.0.0",
  });
});

// Global error handler
app.use(ErrorMiddleware.handleErrors);

// 404 handler (must be last)
app.use(ErrorMiddleware.notFound);

// Initialize database connection (for serverless, we just get the instance)
try {
  DatabaseConnection.getInstance();
  console.log("🔧 Database client initialized");
} catch (error: any) {
  console.error("❌ Database initialization failed:", error);
}

export default app;
