import { Router } from "express";
import { OrganizationController } from "../controllers/organizationController";
import { AuthMiddleware } from "../middlewares/auth";
import { ErrorMiddleware } from "../middlewares/error";
import { ValidationMiddleware } from "../middlewares/validation";

const router = Router();
const organizationController = new OrganizationController();

// Public routes (no authentication required)

// Get all organizations (no authentication required)
router.get(
  "/",
  ValidationMiddleware.validatePagination(),
  ErrorMiddleware.asyncHandler(organizationController.getAllOrganizations)
);

// Protected routes with specific paths (must come before wildcard /:id)

// Get current user's organization (requires authentication)
router.get(
  "/me",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireActiveUser(),
  ErrorMiddleware.asyncHandler(organizationController.getUserOrganization)
);

// Public route - Get organization by ID (no authentication required)
router.get(
  "/:id",
  ValidationMiddleware.validateUUID("id"),
  ErrorMiddleware.asyncHandler(organizationController.getOrganizationById)
);

// Other protected routes

// Create organization
router.post(
  "/",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireActiveUser(),
  ValidationMiddleware.validateRequired(["name"]),
  ErrorMiddleware.asyncHandler(organizationController.createOrganization)
);

// Update organization
router.put(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireActiveUser(),
  ValidationMiddleware.validateUUID("id"),
  ValidationMiddleware.validateRequired(["name"]),
  AuthMiddleware.requireOwner(),
  ErrorMiddleware.asyncHandler(organizationController.updateOrganization)
);

// Delete organization
router.delete(
  "/:id",
  AuthMiddleware.authenticate,
  AuthMiddleware.requireActiveUser(),
  ValidationMiddleware.validateUUID("id"),
  AuthMiddleware.requireOwner(),
  ErrorMiddleware.asyncHandler(organizationController.deleteOrganization)
);

export { router as organizationRoutes };
