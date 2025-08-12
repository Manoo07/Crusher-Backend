import { NextFunction, Request, Response } from "express";
import { AuthenticatedRequest } from "../types";
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
        ResponseUtil.badRequest(res, "Invalid start date format");
        return;
      }

      if (endDate && isNaN(Date.parse(endDate as string))) {
        ResponseUtil.badRequest(res, "Invalid end date format");
        return;
      }

      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);

        if (end < start) {
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
        ResponseUtil.badRequest(res, "Page must be a positive number");
        return;
      }

      if (
        limit &&
        (isNaN(Number(limit)) || Number(limit) < 1 || Number(limit) > 100)
      ) {
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
