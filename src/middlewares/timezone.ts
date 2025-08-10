import { NextFunction, Request, Response } from "express";
import { TimezoneAwareDateFilter } from "../utils/timezoneAwareDateFilter";

export class TimezoneMiddleware {
  /**
   * Middleware to validate and normalize timezone parameter
   */
  static validateTimezone() {
    return (req: Request, res: Response, next: NextFunction): void => {
      try {
        const timezone =
          (req.query.timezone as string) ||
          (req.headers["x-timezone"] as string) ||
          "UTC";

        // Validate timezone
        if (timezone && timezone !== "UTC") {
          try {
            // Test if timezone is valid by trying to use it
            new Date().toLocaleString("en-US", { timeZone: timezone });
          } catch (error) {
            res.status(400).json({
              success: false,
              message: `Invalid timezone: ${timezone}. Please use a valid timezone like 'Asia/Kolkata', 'America/New_York', or 'UTC'`,
              availableTimezones: Object.entries(
                TimezoneAwareDateFilter.getCommonTimezones()
              ).map(([key, value]) => ({
                abbreviation: key,
                timezone: value,
              })),
            });
            return;
          }
        }

        // Add normalized timezone to request for use in controllers
        (req as any).clientTimezone = timezone;
        next();
      } catch (error: any) {
        res.status(400).json({
          success: false,
          message: `Timezone validation error: ${error.message}`,
        });
        return;
      }
    };
  }

  /**
   * Middleware to add timezone information to response headers
   */
  static addTimezoneHeaders() {
    return (req: Request, res: Response, next: NextFunction): void => {
      const timezone = (req as any).clientTimezone || "UTC";

      // Add timezone info to response headers
      res.setHeader("X-Server-Timezone", "UTC");
      res.setHeader("X-Client-Timezone", timezone);
      res.setHeader("X-Timezone-Aware", "true");

      next();
    };
  }

  /**
   * Helper to extract timezone from request
   */
  static getClientTimezone(req: Request): string {
    return (
      (req as any).clientTimezone ||
      (req.query.timezone as string) ||
      (req.headers["x-timezone"] as string) ||
      "UTC"
    );
  }
}
