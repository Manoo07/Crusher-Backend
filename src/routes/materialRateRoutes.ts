import { Router } from "express";
import { MaterialRateController } from "../controllers/materialRateController";
import { AuthMiddleware } from "../middlewares/auth";
import { ErrorMiddleware } from "../middlewares/error";
import { ValidationMiddleware } from "../middlewares/validation";

const router = Router();
const materialRateController = new MaterialRateController();

// Apply authentication middleware
router.use(AuthMiddleware.authenticate);
router.use(AuthMiddleware.requireActiveUser());

// Get material rates (supports ?entryType=Sales or ?entryType=RawStone filter)
router.get(
  "/",
  ErrorMiddleware.asyncHandler(materialRateController.getMaterialRates)
);

// Get individual material rate
router.get(
  "/:id",
  ErrorMiddleware.asyncHandler(materialRateController.getMaterialRateById)
);

// Get standard material types
// router.get(
//   "/types",
//   ErrorMiddleware.asyncHandler(materialRateController.getMaterialTypes)
// );

// Get material types with rates for Sales truck entries (backward compatibility)
router.get(
  "/types",
  ErrorMiddleware.asyncHandler(materialRateController.getMaterialTypesWithRates)
);

// NEW: Get materials for specific entry type using bridge table
router.get(
  "/by-entry-type/:entryType",
  ErrorMiddleware.asyncHandler(materialRateController.getMaterialsByEntryType)
);

// NEW: Get available materials that can be linked to an entry type
router.get(
  "/available-for-entry-type/:entryType",
  ErrorMiddleware.asyncHandler(
    materialRateController.getAvailableMaterialsForEntryType
  )
);

// Create or update material rate (owner only)
router.post(
  "/",
  ValidationMiddleware.validateRequired(["materialType", "rate"]),
  AuthMiddleware.requireOwner(),
  ErrorMiddleware.asyncHandler(materialRateController.updateMaterialRate)
);

// Update individual material rate (owner only)
router.put(
  "/:id",
  AuthMiddleware.requireOwner(),
  ErrorMiddleware.asyncHandler(materialRateController.updateMaterialRateById)
);

// Delete individual material rate (owner only)
router.delete(
  "/:id",
  AuthMiddleware.requireOwner(),
  ErrorMiddleware.asyncHandler(materialRateController.deleteMaterialRateById)
);

export { router as materialRateRoutes };
