import { NextFunction, Response } from "express";
import jwt from "jsonwebtoken";
import { UserService } from "../services/userService";
import { AuthenticatedRequest } from "../types";
import { logger } from "../utils/logger";
import { ResponseUtil } from "../utils/response";

export class AuthMiddleware {
  static authenticate = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    const startTime = Date.now();
    logger.info("🔐 Authentication middleware started", {
      path: req.path,
      method: req.method,
      userAgent: req.headers["user-agent"],
      ip: req.ip || req.connection.remoteAddress,
    });

    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        logger.warn(
          "❌ Authentication failed: Missing or invalid authorization header",
          {
            path: req.path,
            method: req.method,
            authHeader: authHeader ? "Present but invalid format" : "Missing",
            ip: req.ip || req.connection.remoteAddress,
          }
        );
        ResponseUtil.unauthorized(res, "Access token required");
        return;
      }

      const token = authHeader.substring(7);

      if (!token) {
        logger.warn("❌ Authentication failed: Empty token", {
          path: req.path,
          method: req.method,
          ip: req.ip || req.connection.remoteAddress,
        });
        ResponseUtil.unauthorized(res, "Access token required");
        return;
      }

      logger.debug("🔍 Verifying JWT token", {
        tokenLength: token.length,
        tokenPrefix: token.substring(0, 10) + "...",
      });

      // Verify JWT token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || "your-secret-key-here"
      ) as any;

      if (!decoded || !decoded.userId) {
        logger.warn("❌ Authentication failed: Invalid token payload", {
          path: req.path,
          method: req.method,
          hasDecoded: !!decoded,
          hasUserId: decoded?.userId ? true : false,
          ip: req.ip || req.connection.remoteAddress,
        });
        ResponseUtil.unauthorized(res, "Invalid token");
        return;
      }

      logger.debug("✅ JWT token verified successfully", {
        userId: decoded.userId,
        organizationId: decoded.organizationId,
        tokenExp: decoded.exp
          ? new Date(decoded.exp * 1000).toISOString()
          : "No expiration",
      });

      // Get user from database
      const userService = new UserService();
      const user = await userService.getUserById(decoded.userId);

      if (!user) {
        logger.warn("❌ Authentication failed: User not found in database", {
          path: req.path,
          method: req.method,
          userId: decoded.userId,
          ip: req.ip || req.connection.remoteAddress,
        });
        ResponseUtil.unauthorized(res, "User not found");
        return;
      }

      if (!user.isActive) {
        logger.warn("❌ Authentication failed: User account deactivated", {
          path: req.path,
          method: req.method,
          userId: user.id,
          username: user.username,
          role: user.role,
          ip: req.ip || req.connection.remoteAddress,
        });
        ResponseUtil.forbidden(res, "Account is deactivated");
        return;
      }

      // Attach user and organization to request
      req.user = user;
      req.organizationId = decoded.organizationId || user.organizationId;

      const processingTime = Date.now() - startTime;
      logger.info("✅ Authentication successful", {
        userId: user.id,
        username: user.username,
        role: user.role,
        organizationId: req.organizationId,
        path: req.path,
        method: req.method,
        processingTime: `${processingTime}ms`,
        ip: req.ip || req.connection.remoteAddress,
      });

      next();
    } catch (error: any) {
      const processingTime = Date.now() - startTime;
      logger.error("🚨 Authentication error occurred", {
        error: error.message,
        errorName: error.name,
        errorStack: error.stack,
        path: req.path,
        method: req.method,
        processingTime: `${processingTime}ms`,
        ip: req.ip || req.connection.remoteAddress,
      });

      if (error.name === "JsonWebTokenError") {
        logger.warn("❌ JWT Error: Invalid token format", {
          path: req.path,
          method: req.method,
          error: error.message,
        });
        ResponseUtil.unauthorized(res, "Invalid token");
        return;
      }

      if (error.name === "TokenExpiredError") {
        logger.warn("❌ JWT Error: Token expired", {
          path: req.path,
          method: req.method,
          expiredAt: error.expiredAt?.toISOString(),
        });
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
      logger.debug("🔍 Checking active user requirement", {
        path: req.path,
        method: req.method,
        hasUser: !!req.user,
        userId: req.user?.id,
        username: req.user?.username,
      });

      if (!req.user) {
        logger.warn("❌ Active user check failed: No authenticated user", {
          path: req.path,
          method: req.method,
          ip: req.ip || req.connection.remoteAddress,
        });
        ResponseUtil.unauthorized(res, "Authentication required");
        return;
      }

      if (!req.user.isActive) {
        logger.warn("❌ Active user check failed: User account deactivated", {
          path: req.path,
          method: req.method,
          userId: req.user.id,
          username: req.user.username,
          role: req.user.role,
          ip: req.ip || req.connection.remoteAddress,
        });
        ResponseUtil.forbidden(res, "Account is deactivated");
        return;
      }

      logger.debug("✅ Active user check passed", {
        userId: req.user.id,
        username: req.user.username,
        role: req.user.role,
        path: req.path,
        method: req.method,
      });

      next();
    };
  };

  static requireOwner = () => {
    return (
      req: AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): void => {
      logger.debug("🔍 Checking owner requirement", {
        path: req.path,
        method: req.method,
        hasUser: !!req.user,
        userId: req.user?.id,
        username: req.user?.username,
        role: req.user?.role,
      });

      if (!req.user) {
        logger.warn("❌ Owner check failed: No authenticated user", {
          path: req.path,
          method: req.method,
          ip: req.ip || req.connection.remoteAddress,
        });
        ResponseUtil.unauthorized(res, "Authentication required");
        return;
      }

      if (req.user.role !== "owner") {
        logger.warn("❌ Owner check failed: Insufficient privileges", {
          path: req.path,
          method: req.method,
          userId: req.user.id,
          username: req.user.username,
          currentRole: req.user.role,
          requiredRole: "owner",
          organizationId: req.organizationId,
          ip: req.ip || req.connection.remoteAddress,
        });
        ResponseUtil.forbidden(res, "Owner access required");
        return;
      }

      logger.debug("✅ Owner check passed", {
        userId: req.user.id,
        username: req.user.username,
        role: req.user.role,
        organizationId: req.organizationId,
        path: req.path,
        method: req.method,
      });

      next();
    };
  };
}
