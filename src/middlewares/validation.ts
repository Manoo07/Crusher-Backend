import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "../types";
import { logger } from "../utils/logger";
import { ResponseUtil } from "../utils/response";

export class ValidationMiddleware {
  static validateRequired = (fields: string[]) => {
    return (
      req: Request | AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): void => {
      const missingFields: string[] = [];

      for (const field of fields) {
        if (!req.body[field]) {
          missingFields.push(field);
        }
      }

      if (missingFields.length > 0) {
        logger.warn("Validation failed: Missing required fields", {
          missingFields,
          path: req.path,
          method: req.method,
        });
        ResponseUtil.badRequest(
          res,
          `Missing required fields: ${missingFields.join(", ")}`
        );
        return;
      }

      next();
    };
  };

  static validateEmail = (
    req: Request | AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    const { email } = req.body;

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      logger.warn("Validation failed: Invalid email format", {
        email,
        path: req.path,
        method: req.method,
      });
      ResponseUtil.badRequest(res, "Invalid email format");
      return;
    }

    next();
  };

  static validatePassword = (
    req: Request | AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    const { password } = req.body;

    if (password && password.length < 6) {
      logger.warn("Validation failed: Password too short", {
        passwordLength: password.length,
        path: req.path,
        method: req.method,
      });
      ResponseUtil.badRequest(
        res,
        "Password must be at least 6 characters long"
      );
      return;
    }

    next();
  };

  static validateNumeric = (fields: string[]) => {
    return (
      req: Request | AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): void => {
      const invalidFields: string[] = [];

      for (const field of fields) {
        if (req.body[field] !== undefined && isNaN(Number(req.body[field]))) {
          invalidFields.push(field);
        }
      }

      if (invalidFields.length > 0) {
        logger.warn("Validation failed: Invalid numeric values", {
          invalidFields,
          path: req.path,
          method: req.method,
        });
        ResponseUtil.badRequest(
          res,
          `Invalid numeric values for fields: ${invalidFields.join(", ")}`
        );
        return;
      }

      next();
    };
  };

  static validateDate = (fields: string[]) => {
    return (
      req: Request | AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): void => {
      const invalidFields: string[] = [];

      for (const field of fields) {
        if (
          req.body[field] !== undefined &&
          isNaN(Date.parse(req.body[field]))
        ) {
          invalidFields.push(field);
        }
      }

      if (invalidFields.length > 0) {
        logger.warn("Validation failed: Invalid date values", {
          invalidFields,
          path: req.path,
          method: req.method,
        });
        ResponseUtil.badRequest(
          res,
          `Invalid date values for fields: ${invalidFields.join(", ")}`
        );
        return;
      }

      next();
    };
  };

  static validateDateRange = () => {
    return (
      req: Request | AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): void => {
      const { startDate, endDate } = req.query;

      if (startDate && isNaN(Date.parse(startDate as string))) {
        logger.warn("Validation failed: Invalid start date format", {
          startDate,
          path: req.path,
          method: req.method,
        });
        ResponseUtil.badRequest(res, "Invalid start date format");
        return;
      }

      if (endDate && isNaN(Date.parse(endDate as string))) {
        logger.warn("Validation failed: Invalid end date format", {
          endDate,
          path: req.path,
          method: req.method,
        });
        ResponseUtil.badRequest(res, "Invalid end date format");
        return;
      }

      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);

        if (end < start) {
          logger.warn("Validation failed: End date before start date", {
            startDate,
            endDate,
            path: req.path,
            method: req.method,
          });
          ResponseUtil.badRequest(res, "End date cannot be before start date");
          return;
        }
      }

      next();
    };
  };

  static validateUUID = (paramName: string) => {
    return (
      req: Request | AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): void => {
      const uuid = req.params[paramName];
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      if (!uuid || !uuidRegex.test(uuid)) {
        logger.warn("Validation failed: Invalid UUID format", {
          uuid,
          paramName,
          path: req.path,
          method: req.method,
        });
        ResponseUtil.badRequest(res, `Invalid ${paramName} format`);
        return;
      }

      next();
    };
  };

  static validatePagination = () => {
    return (
      req: Request | AuthenticatedRequest,
      res: Response,
      next: NextFunction
    ): void => {
      const { page, limit } = req.query;

      if (page && (isNaN(Number(page)) || Number(page) < 1)) {
        logger.warn("Validation failed: Invalid page number", {
          page,
          path: req.path,
          method: req.method,
        });
        ResponseUtil.badRequest(res, "Page must be a positive number");
        return;
      }

      if (
        limit &&
        (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)
      ) {
        logger.warn("Validation failed: Invalid limit number", {
          limit,
          path: req.path,
          method: req.method,
        });
        ResponseUtil.badRequest(
          res,
          "Limit must be a positive number between 1 and 100"
        );
        return;
      }

      next();
    };
  };
}
