import { Router } from "express";
import { DashboardController } from "../controllers/dashboardController";
import { AuthMiddleware } from "../middlewares/auth";
import { ErrorMiddleware } from "../middlewares/error";
// import { TimezoneMiddleware } from "../middlewares/timezone";
import { ValidationMiddleware } from "../middlewares/validation";

const router = Router();
const dashboardController = new DashboardController();

// Apply authentication middleware
router.use(AuthMiddleware.authenticate);
router.use(AuthMiddleware.requireActiveUser());

// Apply timezone validation and headers - commented out for now
// router.use(TimezoneMiddleware.validateTimezone());
// router.use(TimezoneMiddleware.addTimezoneHeaders());

// Get available timezones
router.get(
  "/timezones",
  ErrorMiddleware.asyncHandler(dashboardController.getAvailableTimezones)
);

// Get available date filters
router.get(
  "/filters",
  ErrorMiddleware.asyncHandler(dashboardController.getAvailableDateFilters)
);

// Get comprehensive dashboard summary with date filtering
router.get(
  "/",
  ValidationMiddleware.validateDateRange(),
  ErrorMiddleware.asyncHandler(
    dashboardController.getComprehensiveDashboardSummary
  )
);

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
