import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "../types";
import { logger } from "../utils/logger";
import { ResponseUtil } from "../utils/response";

export class ErrorMiddleware {
  static asyncHandler = (fn: Function) => {
    return (
      req: Request | AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  };

  static handleErrors = (
    error: any,
    req: Request,
    res: Response,
    next: NextFunction
  ): void => {
    logger.error("Global error handler invoked", {
      error: error.message,
      errorName: error.name,
      errorStack: error.stack,
      path: req.path,
      method: req.method,
    });

    // Handle different types of errors
    if (error.name === "ValidationError") {
      ResponseUtil.badRequest(res, error.message);
      return;
    }

    if (error.name === "UnauthorizedError") {
      ResponseUtil.unauthorized(res, error.message);
      return;
    }

    if (error.name === "ForbiddenError") {
      ResponseUtil.forbidden(res, error.message);
      return;
    }

    if (error.name === "NotFoundError") {
      ResponseUtil.notFound(res, error.message);
      return;
    }

    // Default error response
    ResponseUtil.error(res, "Internal server error");
  };

  static notFound = (req: Request, res: Response): void => {
    ResponseUtil.notFound(res, `Route ${req.originalUrl} not found`);
  };
}
