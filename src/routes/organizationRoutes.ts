import { Router } from "express";
import { OrganizationController } from "../controllers/organizationController";
import { AuthMiddleware } from "../middlewares/auth";
import { ErrorMiddleware } from "../middlewares/error";
import { ValidationMiddleware } from "../middlewares/validation";

const router = Router();
const organizationController = new OrganizationController();

// Apply authentication middleware to all organization routes
router.use(AuthMiddleware.authenticate);
router.use(AuthMiddleware.requireActiveUser());

// Create organization
router.post(
  "/",
  ValidationMiddleware.validateRequired(["name"]),
  ErrorMiddleware.asyncHandler(organizationController.createOrganization)
);

// Get current user's organization
router.get(
  "/me",
  ErrorMiddleware.asyncHandler(organizationController.getUserOrganization)
);

// Get organization by ID
router.get(
  "/:id",
  ValidationMiddleware.validateUUID("id"),
  ErrorMiddleware.asyncHandler(organizationController.getOrganizationById)
);

// Get all organizations (admin/owner only)
router.get(
  "/",
  ValidationMiddleware.validatePagination(),
  AuthMiddleware.requireOwner(),
  ErrorMiddleware.asyncHandler(organizationController.getAllOrganizations)
);

// Update organization
router.put(
  "/:id",
  ValidationMiddleware.validateUUID("id"),
  ValidationMiddleware.validateRequired(["name"]),
  AuthMiddleware.requireOwner(),
  ErrorMiddleware.asyncHandler(organizationController.updateOrganization)
);

// Delete organization
router.delete(
  "/:id",
  ValidationMiddleware.validateUUID("id"),
  AuthMiddleware.requireOwner(),
  ErrorMiddleware.asyncHandler(organizationController.deleteOrganization)
);

export { router as organizationRoutes };
