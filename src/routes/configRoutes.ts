import { Router } from "express";
import { ConfigController } from "../controllers/configController";
import { AuthMiddleware } from "../middlewares/auth";
import { ErrorMiddleware } from "../middlewares/error";
import { ValidationMiddleware } from "../middlewares/validation";

const router = Router();
const configController = new ConfigController();

// Apply authentication middleware to all routes
router.use(AuthMiddleware.authenticate);
router.use(AuthMiddleware.requireActiveUser());

// Get app configuration
router.get("/app", ErrorMiddleware.asyncHandler(configController.getAppConfig));

// Get current rates
router.get(
  "/rates",
  ErrorMiddleware.asyncHandler(configController.getCurrentRates)
);

// Calculate total
router.post(
  "/calculate",
  ValidationMiddleware.validateRequired(["units", "ratePerUnit"]),
  ErrorMiddleware.asyncHandler(configController.calculateTotal)
);

// Validate truck entry
router.post(
  "/validate",
  ValidationMiddleware.validateRequired([
    "truckNumber",
    "entryType",
    "units",
    "ratePerUnit",
  ]),
  ErrorMiddleware.asyncHandler(configController.validateTruckEntry)
);

export { router as configRoutes };
