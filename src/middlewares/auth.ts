import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { UserService } from "../services/userService";
import { AuthenticatedRequest } from "../types";
import { ResponseUtil } from "../utils/response";

export class AuthMiddleware {
  static authenticate = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        ResponseUtil.unauthorized(res, "Access token required");
        return;
      }

      const token = authHeader.substring(7);

      if (!token) {
        ResponseUtil.unauthorized(res, "Access token required");
        return;
      }

      // Verify JWT token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your-secret-key-here"
      ) as any;

      if (!decoded || !decoded.userId) {
        ResponseUtil.unauthorized(res, "Invalid token");
        return;
      }

      // Get user from database
      const userService = new UserService();
      const user = await userService.getUserById(decoded.userId);

      if (!user) {
        ResponseUtil.unauthorized(res, "User not found");
        return;
      }

      if (!user.isActive) {
        ResponseUtil.forbidden(res, "Account is deactivated");
        return;
      }

      // Attach user and organization to request
      req.user = user;
      req.organizationId = decoded.organizationId || user.organizationId;

      next();
    } catch (error: any) {
      console.error("Authentication error:", error);

      if (error.name === "JsonWebTokenError") {
        ResponseUtil.unauthorized(res, "Invalid token");
        return;
      }

      if (error.name === "TokenExpiredError") {
        ResponseUtil.unauthorized(res, "Token expired");
        return;
      }

      ResponseUtil.unauthorized(res, "Authentication failed");
    }
  };

  static requireActiveUser = () => {
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
  };

  static requireOwner = () => {
    return (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): void => {
      if (!req.user) {
        ResponseUtil.unauthorized(res, "Authentication required");
        return;
      }

      if (req.user.role !== "owner") {
        ResponseUtil.forbidden(res, "Owner access required");
        return;
      }

      next();
    };
  };
}
