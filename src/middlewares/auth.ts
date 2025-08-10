import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { UserService } from "../services/userService";
import { AuthenticatedRequest } from "../types";
import { ResponseUtil } from "../utils/response";

export class AuthMiddleware {
  private static userService = new UserService();

  // Authentication middleware with proper JWT verification
  static async authenticate(
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return ResponseUtil.unauthorized(res, "Authentication token required");
      }

      const token = authHeader.substring(7);

      try {
        // Verify JWT token
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || "your-secret-key-here"
        ) as any;

        // Get fresh user data from database
        const user = await AuthMiddleware.userService.getUserById(
          decoded.userId
        );

        if (!user) {
          return ResponseUtil.unauthorized(res, "Invalid authentication token");
        }

        if (!user.isActive) {
          return ResponseUtil.forbidden(res, "Account is deactivated");
        }

        // Attach user to request object
        req.user = user;
        req.organizationId = decoded.organizationId || user.organizationId;

        return next();
      } catch (jwtError) {
        return ResponseUtil.unauthorized(res, "Invalid authentication token");
      }
    } catch (error) {
      console.error("Authentication error:", error);
      return ResponseUtil.unauthorized(res, "Authentication failed");
    }
  }

  static requireRole(allowedRoles: string[]) {
    return (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): void => {
      if (!req.user) {
        ResponseUtil.unauthorized(res, "Authentication required");
        return;
      }

      if (!allowedRoles.includes(req.user.role)) {
        ResponseUtil.forbidden(res, "Insufficient permissions");
        return;
      }

      next();
    };
  }

  static requireOwner() {
    return AuthMiddleware.requireRole(["owner"]);
  }

  static requireActiveUser() {
    return (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): void => {
      if (!req.user) {
        ResponseUtil.unauthorized(res, "Authentication required");
        return;
      }

      if (!req.user.isActive) {
        ResponseUtil.forbidden(res, "Account is deactivated");
        return;
      }

      next();
    };
  }

  static requireOrganization() {
    return (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): void => {
      if (!req.user) {
        ResponseUtil.unauthorized(res, "Authentication required");
        return;
      }

      if (!req.organizationId) {
        ResponseUtil.forbidden(res, "Organization access required");
        return;
      }

      next();
    };
  }
}
