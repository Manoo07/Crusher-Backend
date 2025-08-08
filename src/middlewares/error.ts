import { NextFunction, Request, Response } from "express";
import { ResponseUtil } from "../utils/response";

export class ErrorMiddleware {
  static handleErrors(
    err: any,
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    console.error("Error:", err);

    // Prisma specific errors
    if (err.code === "P2002") {
      return ResponseUtil.conflict(
        res,
        "A record with this data already exists"
      );
    }

    if (err.code === "P2025") {
      return ResponseUtil.notFound(res, "Record not found");
    }

    if (err.code === "P2003") {
      return ResponseUtil.badRequest(res, "Foreign key constraint failed");
    }

    // Validation errors
    if (err.name === "ValidationError") {
      return ResponseUtil.badRequest(res, err.message);
    }

    // JWT errors
    if (err.name === "JsonWebTokenError") {
      return ResponseUtil.unauthorized(res, "Invalid token");
    }

    if (err.name === "TokenExpiredError") {
      return ResponseUtil.unauthorized(res, "Token expired");
    }

    // Default error
    if (err.status && err.message) {
      return ResponseUtil.error(res, err.message, err.status);
    }

    return ResponseUtil.error(
      res,
      process.env.NODE_ENV === "development"
        ? err.message
        : "Internal server error",
      500,
      process.env.NODE_ENV === "development" ? err.stack : undefined
    );
  }

  static notFound(req: Request, res: Response, next: NextFunction) {
    ResponseUtil.notFound(res, `Route ${req.originalUrl} not found`);
  }

  static asyncHandler(fn: Function) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}
