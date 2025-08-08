import { Router } from "express";
import { AuthController } from "../controllers/authController";
import { ErrorMiddleware } from "../middlewares/error";
import { ValidationMiddleware } from "../middlewares/validation";

const router = Router();
const authController = new AuthController();

// Public routes - no authentication required
router.post(
  "/register",
  ValidationMiddleware.validateRequired(["username", "password"]),
  ErrorMiddleware.asyncHandler(authController.register)
);

router.post(
  "/login",
  ValidationMiddleware.validateRequired(["username", "password"]),
  ErrorMiddleware.asyncHandler(authController.login)
);

// Protected routes - authentication required
router.get(
  "/verify-token",
  ErrorMiddleware.asyncHandler(authController.verifyToken)
);

router.post("/logout", ErrorMiddleware.asyncHandler(authController.logout));

router.get("/profile", ErrorMiddleware.asyncHandler(authController.getProfile));

export { router as authRoutes };
