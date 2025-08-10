import { Router } from "express";
import { ReportsController } from "../controllers/reportsController";
import { AuthMiddleware } from "../middlewares/auth";
import { ErrorMiddleware } from "../middlewares/error";
import { ValidationMiddleware } from "../middlewares/validation";

const router = Router();
const reportsController = new ReportsController();

// Apply authentication middleware to all routes except download
router.use("/templates", AuthMiddleware.authenticate);
router.use("/data", AuthMiddleware.authenticate);
router.use("/export", AuthMiddleware.authenticate);
router.use("/browser-download", AuthMiddleware.authenticate);
router.use("/test-data", AuthMiddleware.authenticate);

router.use("/templates", AuthMiddleware.requireActiveUser());
router.use("/data", AuthMiddleware.requireActiveUser());
router.use("/export", AuthMiddleware.requireActiveUser());
router.use("/browser-download", AuthMiddleware.requireActiveUser());
router.use("/test-data", AuthMiddleware.requireActiveUser());

// Get report templates
router.get(
  "/templates",
  ErrorMiddleware.asyncHandler(reportsController.getReportTemplates)
);

// Get report data
router.get(
  "/data",
  ErrorMiddleware.asyncHandler(reportsController.getReportData)
);

// Generate export (POST)
router.post(
  "/export",
  ValidationMiddleware.validateRequired(["reportType", "format"]),
  ErrorMiddleware.asyncHandler(reportsController.generateExport)
);

// Generate export (GET)
router.get(
  "/export",
  ErrorMiddleware.asyncHandler(reportsController.generateExportViaGet)
);

// Generate browser download token
router.post(
  "/browser-download",
  ValidationMiddleware.validateRequired(["reportType", "format"]),
  ErrorMiddleware.asyncHandler(reportsController.generateBrowserDownloadToken)
);

// Download report (no auth required for download)
router.get(
  "/download/:token",
  ErrorMiddleware.asyncHandler(reportsController.downloadReport)
);

// Test data endpoint
router.get(
  "/test-data",
  ErrorMiddleware.asyncHandler(reportsController.getTestData)
);

export { router as reportsRoutes };
