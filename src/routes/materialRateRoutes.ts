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

// Get material rates
router.get(
  "/",
  ErrorMiddleware.asyncHandler(materialRateController.getMaterialRates)
);

// Create or update material rate (owner only)
router.post(
  "/",
  ValidationMiddleware.validateRequired(["materialType", "rate"]),
  AuthMiddleware.requireOwner(),
  ErrorMiddleware.asyncHandler(materialRateController.updateMaterialRate)
);

export { router as materialRateRoutes };
