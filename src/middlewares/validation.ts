import { NextFunction, Request, Response } from "express";
import { ResponseUtil } from "../utils/response";

export class ValidationMiddleware {
  static validateRequest(schema: any) {
    return (req: Request, res: Response, next: NextFunction) => {
      // Placeholder for request validation
      // In a real application, you would use a validation library like Joi or Zod
      // For now, we'll just proceed to the next middleware
      next();
    };
  }

  static validatePagination() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const { page, limit, sortOrder } = req.query;

      // Validate page
      if (page !== undefined) {
        const pageNum = parseInt(page as string);
        if (isNaN(pageNum) || pageNum < 1) {
          ResponseUtil.badRequest(res, "Page must be a positive integer");
          return;
        }
        req.query.page = pageNum.toString();
      }

      // Validate limit
      if (limit !== undefined) {
        const limitNum = parseInt(limit as string);
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
          ResponseUtil.badRequest(res, "Limit must be between 1 and 100");
          return;
        }
        req.query.limit = limitNum.toString();
      }

      // Validate sort order
      if (sortOrder !== undefined) {
        if (sortOrder !== "asc" && sortOrder !== "desc") {
          ResponseUtil.badRequest(res, 'Sort order must be "asc" or "desc"');
          return;
        }
      }

      next();
    };
  }

  static validateDateRange() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const { startDate, endDate } = req.query;

      if (startDate) {
        const start = new Date(startDate as string);
        if (isNaN(start.getTime())) {
          ResponseUtil.badRequest(res, "Invalid start date format");
          return;
        }
      }

      if (endDate) {
        const end = new Date(endDate as string);
        if (isNaN(end.getTime())) {
          ResponseUtil.badRequest(res, "Invalid end date format");
          return;
        }
      }

      if (startDate && endDate) {
        const start = new Date(startDate as string);
        const end = new Date(endDate as string);
        if (start > end) {
          ResponseUtil.badRequest(res, "Start date must be before end date");
          return;
        }
      }

      next();
    };
  }

  static validateUUID(paramName: string) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const value = req.params[paramName];
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

      if (!value || !uuidRegex.test(value)) {
        ResponseUtil.badRequest(res, `Invalid ${paramName} format`);
        return;
      }

      next();
    };
  }

  static validateRequired(fields: string[]) {
    return (req: Request, res: Response, next: NextFunction): void => {
      const missingFields: string[] = [];

      for (const field of fields) {
        if (
          req.body[field] === undefined ||
          req.body[field] === null ||
          req.body[field] === ""
        ) {
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
  }
}
