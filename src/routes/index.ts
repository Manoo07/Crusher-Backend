import { Router } from "express";
import { MaterialRateController } from "../controllers/materialRateController";
import { AuthMiddleware } from "../middlewares/auth";
import { ErrorMiddleware } from "../middlewares/error";
import { authRoutes } from "./authRoutes";
import { configRoutes } from "./configRoutes";
import { dashboardRoutes } from "./dashboardRoutes";
import { expenseRoutes } from "./expenseRoutes";
import { materialRateRoutes } from "./materialRateRoutes";
import { organizationRoutes } from "./organizationRoutes";
import { reportsRoutes } from "./reportsRoutes";
import { truckEntryRoutes } from "./truckEntryRoutes";
import { userRoutes } from "./userRoutes";

const router = Router();
const materialRateController = new MaterialRateController();

// Health check (no authentication required)
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Material types endpoint (requires authentication)
router.get(
  "/material-types",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireActiveUser(),
  ErrorMiddleware.asyncHandler(materialRateController.getMaterialTypes)
);

// Mount route modules
router.use("/auth", authRoutes);
router.use("/config", configRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/expenses", expenseRoutes);
router.use("/material-rates", materialRateRoutes);
router.use("/organizations", organizationRoutes);
router.use("/reports", reportsRoutes);
router.use("/truck-entries", truckEntryRoutes);
router.use("/users", userRoutes);

export { router as apiRoutes };
