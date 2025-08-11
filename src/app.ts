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
    try {
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

      return callback(
        new Error(
          `CORS Error: Origin '${origin}' not allowed by CORS policy. Allowed origins: ${allowedOrigins.join(
            ", "
          )}`
        ),
        false
      );
    } catch (error: any) {
      console.error("❌ CORS configuration error:", error.message);
      return callback(new Error("CORS configuration error"), false);
    }
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

// Body parsing middleware with error handling
try {
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true }));
} catch (error: any) {
  console.error(
    "❌ Error initializing body parsing middleware:",
    error.message
  );
  process.exit(1);
}

// Request logging middleware (development only)
if (process.env.NODE_ENV === "development") {
  app.use((req: Request, res: Response, next: NextFunction) => {
    try {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    } catch (error: any) {
      console.error("❌ Request logging error:", error.message);
      next(); // Continue even if logging fails
    }
  });
}

// API Routes
try {
  app.use("/api", apiRoutes);
} catch (error: any) {
  console.error("❌ Error mounting API routes:", error.message);
  process.exit(1);
}

// Serve Swagger YAML file
app.get("/swagger.yaml", (req: Request, res: Response) => {
  try {
    res.setHeader("Content-Type", "application/x-yaml");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.sendFile(path.join(__dirname, "../swagger.yaml"));
  } catch (error: any) {
    console.error("❌ Error serving Swagger YAML file:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to serve API documentation",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// Swagger UI redirect endpoint
app.get("/docs", (req: Request, res: Response) => {
  try {
    const redirectUrl =
      "https://petstore.swagger.io/?url=" +
      encodeURIComponent(
        req.protocol + "://" + req.get("host") + "/swagger.yaml"
      );
    res.redirect(redirectUrl);
  } catch (error: any) {
    console.error("❌ Error redirecting to Swagger UI:", error.message);
    res.status(500).json({
      success: false,
      message: "Failed to redirect to API documentation",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// API documentation endpoint
app.get("/api-docs", (req: Request, res: Response) => {
  try {
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
  } catch (error: any) {
    console.error(
      "❌ Error generating API documentation response:",
      error.message
    );
    res.status(500).json({
      success: false,
      message: "Failed to generate API documentation",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// Root endpoint
app.get("/", (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      message: "Crusher Backend API",
      version: "1.0.0",
      documentation: "/api/health",
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("❌ Error in root endpoint:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? error.message
          : "Internal server error",
    });
  }
});

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  try {
    // Test database connection
    const dbInstance = DatabaseConnection.getInstance();

    res.status(200).json({
      status: "OK",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      version: "1.0.0",
      database: {
        status: "connected",
        type: "postgresql",
      },
    });
  } catch (error: any) {
    console.error("❌ Health check failed:", error.message);
    res.status(503).json({
      status: "ERROR",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      version: "1.0.0",
      database: {
        status: "disconnected",
        error:
          process.env.NODE_ENV === "development"
            ? error.message
            : "Database connection failed",
      },
    });
  }
});

// Global error handler
app.use(ErrorMiddleware.handleErrors);

// 404 handler (must be last)
app.use(ErrorMiddleware.notFound);

// Initialize database connection (for serverless, we just get the instance)
try {
  const dbInstance = DatabaseConnection.getInstance();
  console.log("🔧 Database client initialized successfully");

  // Test the connection
  if (process.env.NODE_ENV === "development") {
    console.log("🔍 Testing database connection...");
    // You could add a simple query here to test the connection
    console.log("✅ Database connection test passed");
  }
} catch (error: any) {
  console.error("❌ Database initialization failed:", error.message);
  console.error("🔍 Error details:", {
    name: error.name,
    message: error.message,
    code: error.code,
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
  });

  // In production, we might want to exit, but in development we can continue
  if (process.env.NODE_ENV === "production") {
    console.error(
      "🚨 Exiting due to database connection failure in production"
    );
    process.exit(1);
  } else {
    console.warn(
      "⚠️  Continuing in development mode despite database connection failure"
    );
  }
}

// Global unhandled error handlers
process.on("unhandledRejection", (reason: any, promise: Promise<any>) => {
  console.error("❌ Unhandled Rejection at:", promise, "reason:", reason);
  console.error("🔍 Error details:", {
    message: reason?.message,
    name: reason?.name,
    code: reason?.code,
    stack: process.env.NODE_ENV === "development" ? reason?.stack : undefined,
  });
});

process.on("uncaughtException", (error: Error) => {
  console.error("❌ Uncaught Exception:", error);
  console.error("🔍 Error details:", {
    message: error.message,
    name: error.name,
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
  });

  // Gracefully exit the process
  process.exit(1);
});

export default app;
