import { Router } from "express";
import { ReportController } from "../controllers/businessReportController";
import { AuthMiddleware } from "../middlewares/auth";
import { ErrorMiddleware } from "../middlewares/error";

const router = Router();
const reportController = new ReportController();

// GET /api/business-reports/pdf?startDate=2025-01-01&endDate=2025-01-31 (no auth required)
router.get(
  "/pdf",
  ErrorMiddleware.asyncHandler(reportController.generatePdfReport)
);

// GET /api/business-reports/csv?startDate=2025-01-01&endDate=2025-01-31&type=sales (no auth required)
router.get(
  "/csv",
  ErrorMiddleware.asyncHandler(reportController.generateCsvReport)
);

// Apply authentication middleware to protected routes
router.use(AuthMiddleware.authenticate);
router.use(AuthMiddleware.requireActiveUser());

// GET /api/reports/summary?startDate=2025-01-01&endDate=2025-01-31
router.get(
  "/summary",
  ErrorMiddleware.asyncHandler(reportController.getReportSummary)
);

// GET /api/reports/date-ranges - Get predefined date ranges
router.get(
  "/date-ranges",
  ErrorMiddleware.asyncHandler(reportController.getAvailableDateRanges)
);

export { router as reportRoutes };
