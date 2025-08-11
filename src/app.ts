import cors from "cors";
import dotenv from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import path from "path";
import { ErrorMiddleware } from "./middlewares/error";
import { apiRoutes } from "./routes";
import DatabaseConnection from "./utils/database";

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware - CORS configuration
const corsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (error: Error | null, allow?: boolean) => void
  ) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);

    // In development, allow all origins
    if (process.env.NODE_ENV === "development") {
      return callback(null, true);
    }

    // In production, check against allowed origins
    const allowedOrigins = process.env.CORS_ORIGIN?.split(",") || ["*"];
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"), false);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  allowedHeaders: [
    "Origin",
    "X-Requested-With",
    "Content-Type",
    "Accept",
    "Authorization",
    "Cache-Control",
    "Pragma",
    "Expires",
    "X-API-Key",
    "Access-Control-Allow-Headers",
    "Access-Control-Request-Method",
    "Access-Control-Request-Headers",
  ],
  exposedHeaders: ["X-Total-Count", "X-Page-Count"],
  optionsSuccessStatus: 200,
  preflightContinue: false,
};

app.use(cors(corsOptions));
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

// Serve Swagger YAML file
app.get("/swagger.yaml", (req: Request, res: Response) => {
  res.setHeader("Content-Type", "application/x-yaml");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.sendFile(path.join(__dirname, "../swagger.yaml"));
});

// Swagger UI redirect endpoint
app.get("/docs", (req: Request, res: Response) => {
  res.redirect(
    "https://petstore.swagger.io/?url=" +
      encodeURIComponent(
        req.protocol + "://" + req.get("host") + "/swagger.yaml"
      )
  );
});

// API documentation endpoint
app.get("/api-docs", (req: Request, res: Response) => {
  const baseUrl = req.protocol + "://" + req.get("host");
  res.json({
    success: true,
    message: "API Documentation",
    swagger_yaml: `${baseUrl}/swagger.yaml`,
    swagger_ui: `${baseUrl}/docs`,
    postman_collection: `${baseUrl}/api/health`,
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });
});

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
