import { Router } from "express";
import { UserController } from "../controllers/userController";
import { AuthMiddleware } from "../middlewares/auth";
import { ErrorMiddleware } from "../middlewares/error";
import { ValidationMiddleware } from "../middlewares/validation";

const router = Router();
const userController = new UserController();

// Apply authentication middleware to all user routes
router.use(AuthMiddleware.authenticate);
router.use(AuthMiddleware.requireActiveUser());

// Get current user
router.get("/me", ErrorMiddleware.asyncHandler(userController.getCurrentUser));

// Create user (owner only)
router.post(
  "/",
  ValidationMiddleware.validateRequired(["username", "password"]),
  AuthMiddleware.requireOwner(),
  ErrorMiddleware.asyncHandler(userController.createUser)
);

// Get all users (with pagination and filtering)
router.get(
  "/",
  ValidationMiddleware.validatePagination(),
  AuthMiddleware.requireOwner(),
  ErrorMiddleware.asyncHandler(userController.getAllUsers)
);

// Get users by organization
router.get(
  "/organization/:organizationId",
  ValidationMiddleware.validateUUID("organizationId"),
  AuthMiddleware.requireOwner(),
  ErrorMiddleware.asyncHandler(userController.getOrganizationUsers)
);

// Get user by ID
router.get(
  "/:id",
  ValidationMiddleware.validateUUID("id"),
  ErrorMiddleware.asyncHandler(userController.getUserById)
);

// Update user
router.put(
  "/:id",
  ValidationMiddleware.validateUUID("id"),
  ErrorMiddleware.asyncHandler(userController.updateUser)
);

// Update user password
router.put(
  "/:id/password",
  ValidationMiddleware.validateUUID("id"),
  ValidationMiddleware.validateRequired(["currentPassword", "newPassword"]),
  ErrorMiddleware.asyncHandler(userController.updatePassword)
);

// Activate user (owner only)
router.put(
  "/:id/activate",
  ValidationMiddleware.validateUUID("id"),
  AuthMiddleware.requireOwner(),
  ErrorMiddleware.asyncHandler(userController.activateUser)
);

// Deactivate user (owner only)
router.put(
  "/:id/deactivate",
  ValidationMiddleware.validateUUID("id"),
  AuthMiddleware.requireOwner(),
  ErrorMiddleware.asyncHandler(userController.deactivateUser)
);

export { router as userRoutes };
