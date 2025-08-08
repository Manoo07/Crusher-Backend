import { Router } from "express";
import { DashboardController } from "../controllers/dashboardController";
import { AuthMiddleware } from "../middlewares/auth";
import { ErrorMiddleware } from "../middlewares/error";
import { ValidationMiddleware } from "../middlewares/validation";

const router = Router();
const dashboardController = new DashboardController();

// Apply authentication middleware
router.use(AuthMiddleware.authenticate);
router.use(AuthMiddleware.requireActiveUser());

// Get dashboard summary
router.get(
  "/summary",
  ValidationMiddleware.validateDateRange(),
  ErrorMiddleware.asyncHandler(dashboardController.getDashboardSummary)
);

// Get financial metrics
router.get(
  "/financial",
  ValidationMiddleware.validateDateRange(),
  ErrorMiddleware.asyncHandler(dashboardController.getFinancialMetrics)
);

// Get dashboard statistics (owner only)
router.get(
  "/stats",
  AuthMiddleware.requireOwner(),
  ValidationMiddleware.validateDateRange(),
  ErrorMiddleware.asyncHandler(dashboardController.getDashboardStats)
);

export { router as dashboardRoutes };
