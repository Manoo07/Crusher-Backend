import { Router } from "express";
import { TruckEntryController } from "../controllers/truckEntryController";
import { AuthMiddleware } from "../middlewares/auth";
import { ErrorMiddleware } from "../middlewares/error";
import { ValidationMiddleware } from "../middlewares/validation";

const router = Router();
const truckEntryController = new TruckEntryController();

// Apply authentication middleware to all routes
router.use(AuthMiddleware.authenticate);
router.use(AuthMiddleware.requireActiveUser());

// Get truck entries with filtering and pagination
router.get(
  "/",
  ValidationMiddleware.validatePagination(),
  ValidationMiddleware.validateDateRange(),
  ErrorMiddleware.asyncHandler(truckEntryController.getTruckEntries)
);

// Get truck entries summary
router.get(
  "/summary",
  ValidationMiddleware.validateDateRange(),
  ErrorMiddleware.asyncHandler(truckEntryController.getTruckEntriesSummary)
);

// Create truck entry
router.post(
  "/",
  ValidationMiddleware.validateRequired([
    "truckNumber",
    "truckName",
    "entryType",
    "units",
    "ratePerUnit",
    "entryDate",
  ]),
  ErrorMiddleware.asyncHandler(truckEntryController.createTruckEntry)
);

// Get truck entry by ID
router.get(
  "/:id",
  ValidationMiddleware.validateUUID("id"),
  ErrorMiddleware.asyncHandler(truckEntryController.getTruckEntryById)
);

// Update truck entry
router.put(
  "/:id",
  ValidationMiddleware.validateUUID("id"),
  ErrorMiddleware.asyncHandler(truckEntryController.updateTruckEntry)
);

// Delete truck entry (soft delete)
router.delete(
  "/:id",
  ValidationMiddleware.validateUUID("id"),
  ErrorMiddleware.asyncHandler(truckEntryController.deleteTruckEntry)
);

export { router as truckEntryRoutes };
