import { Router } from "express";
import { EntryTypeMaterialController } from "../controllers/entryTypeMaterialController";
import { AuthMiddleware } from "../middlewares/auth";
import { ErrorMiddleware } from "../middlewares/error";
import { ValidationMiddleware } from "../middlewares/validation";

const router = Router();
const entryTypeMaterialController = new EntryTypeMaterialController();

// Apply authentication middleware to all routes
router.use(AuthMiddleware.authenticate);
router.use(AuthMiddleware.requireActiveUser());

// Get all entry-type-material mappings for organization
router.get(
  "/",
  ErrorMiddleware.asyncHandler(
    entryTypeMaterialController.getEntryTypeMaterials
  )
);

// Get materials grouped by entry type
router.get(
  "/grouped",
  ErrorMiddleware.asyncHandler(
    entryTypeMaterialController.getEntryTypeMaterialsGrouped
  )
);

// Get materials for specific entry type
router.get(
  "/by-entry-type/:entryType",
  ErrorMiddleware.asyncHandler(
    entryTypeMaterialController.getEntryTypeMaterialsByType
  )
);

// Create new entry-type-material mapping
router.post(
  "/",
  ValidationMiddleware.validateRequired(["entryType", "materialRateId"]),
  ErrorMiddleware.asyncHandler(
    entryTypeMaterialController.createEntryTypeMaterial
  )
);

// Create multiple mappings at once
router.post(
  "/bulk",
  ValidationMiddleware.validateRequired(["mappings"]),
  ErrorMiddleware.asyncHandler(
    entryTypeMaterialController.createBulkEntryTypeMaterials
  )
);

// Get specific entry-type-material mapping
router.get(
  "/:id",
  ValidationMiddleware.validateUUID("id"),
  ErrorMiddleware.asyncHandler(
    entryTypeMaterialController.getEntryTypeMaterialById
  )
);

// Update entry-type-material mapping
router.put(
  "/:id",
  ValidationMiddleware.validateUUID("id"),
  ErrorMiddleware.asyncHandler(
    entryTypeMaterialController.updateEntryTypeMaterial
  )
);

// Delete entry-type-material mapping
router.delete(
  "/:id",
  ValidationMiddleware.validateUUID("id"),
  ErrorMiddleware.asyncHandler(
    entryTypeMaterialController.deleteEntryTypeMaterial
  )
);

export { router as entryTypeMaterialRoutes };
