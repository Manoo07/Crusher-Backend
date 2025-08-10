import { Router } from "express";
import { authRoutes } from "./authRoutes";
import { organizationRoutes } from "./organizationRoutes";
import { userRoutes } from "./userRoutes";

const router = Router();

// Health check (no authentication required)
router.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Mount route modules
router.use("/auth", authRoutes);
router.use("/organizations", organizationRoutes);
router.use("/users", userRoutes);

// Placeholder routes for future implementation
router.use("/material-rates", (req, res) => {
  res.status(501).json({
    success: false,
    message: "Material rates API not yet implemented",
  });
});

router.use("/truck-entries", (req, res) => {
  res.status(501).json({
    success: false,
    message: "Truck entries API not yet implemented",
  });
});

router.use("/expenses", (req, res) => {
  res.status(501).json({
    success: false,
    message: "Other expenses API not yet implemented",
  });
});

export { router as apiRoutes };
