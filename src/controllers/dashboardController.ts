import { Response } from "express";
import { DashboardService } from "../services/dashboardService";
import { AuthenticatedRequest } from "../types";
import { DateFilterType, DateFilterUtil } from "../utils/dateFilters";
import { logger } from "../utils/logger";
import { ResponseUtil } from "../utils/response";

export class DashboardController {
  private dashboardService: DashboardService;

  constructor() {
    this.dashboardService = new DashboardService();
  }

  getComprehensiveDashboardSummary = async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      logger.info("Fetching comprehensive dashboard summary", {
        userId: req.user?.id,
        organizationId: req.organizationId,
        query: req.query,
      });

      if (!req.user || !req.organizationId) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      // Handle different date filter types with timezone support
      const filterType = (req.query.filterType as string) || "this_week";
      const customStart = req.query.startDate as string;
      const customEnd = req.query.endDate as string;
      const userTimezone = (req.query.timezone as string) || "UTC";

      // Initialize variables
      let startDate: Date;
      let endDate: Date;
      let utcStartDate: Date;
      let utcEndDate: Date;
      let timezoneInfo: string;

      try {
        // Validate timezone and filter parameters
        const validated = DateFilterUtil.validateDateFilterWithTimezone(
          filterType,
          userTimezone,
          customStart,
          customEnd
        );

        // Get timezone-aware date range
        const timezoneAwareDateRange = DateFilterUtil.getTimezoneAwareDateRange(
          validated.filterType,
          validated.timezone,
          customStart,
          customEnd
        );

        // User timezone dates for display
        startDate = timezoneAwareDateRange.startDate;
        endDate = timezoneAwareDateRange.endDate;

        // UTC dates for database queries
        utcStartDate = timezoneAwareDateRange.utcStartDate;
        utcEndDate = timezoneAwareDateRange.utcEndDate;

        // Format timezone info for response
        timezoneInfo = DateFilterUtil.formatTimezoneAwareDateRange(
          validated.filterType,
          timezoneAwareDateRange
        );

        logger.info("Timezone-aware date filtering applied", {
          userId: req.user?.id,
          organizationId: req.organizationId,
          filterType: validated.filterType,
          timezone: validated.timezone,
          userDateRange: `${startDate.toISOString()} - ${endDate.toISOString()}`,
          utcDateRange: `${utcStartDate.toISOString()} - ${utcEndDate.toISOString()}`,
        });
      } catch (error: any) {
        logger.error("Invalid date filter parameters", {
          error: error.message,
          filterType,
          timezone: userTimezone,
        });
        return ResponseUtil.error(res, `Invalid date filter: ${error.message}`);
      }

      const summary =
        await this.dashboardService.getComprehensiveDashboardSummary(
          req.organizationId,
          utcStartDate, // Use UTC dates for database queries
          utcEndDate
        );

      // Return the summary
      return ResponseUtil.success(
        res,
        {
          ...summary,
          filterInfo: {
            filterType,
            timezone: userTimezone,
            userDateRange: timezoneInfo,
            userStartDate: startDate.toISOString(),
            userEndDate: endDate.toISOString(),
            utcStartDate: utcStartDate.toISOString(),
            utcEndDate: utcEndDate.toISOString(),
          },
        },
        "Comprehensive dashboard summary retrieved successfully"
      );
    } catch (error: any) {
      logger.error("Error getting comprehensive dashboard summary", {
        error: error.message,
      });
      return ResponseUtil.error(
        res,
        "Failed to retrieve comprehensive dashboard summary"
      );
    }
  };

  getDashboardSummary = async (req: AuthenticatedRequest, res: Response) => {
    try {
      logger.info("Fetching dashboard summary", {
        userId: req.user?.id,
        organizationId: req.organizationId,
        query: req.query,
      });

      if (!req.user || !req.organizationId) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      // Handle different date filter types with timezone support
      const filterType = (req.query.filterType as string) || "this_month";
      const customStart = req.query.startDate as string;
      const customEnd = req.query.endDate as string;
      const userTimezone = (req.query.timezone as string) || "UTC";

      let startDate: Date | undefined;
      let endDate: Date | undefined;
      let utcStartDate: Date | undefined;
      let utcEndDate: Date | undefined;
      let dateRangeDescription = "";

      try {
        // Validate timezone and filter parameters
        const validated = DateFilterUtil.validateDateFilterWithTimezone(
          filterType,
          userTimezone,
          customStart,
          customEnd
        );

        // Get timezone-aware date range
        const timezoneAwareDateRange = DateFilterUtil.getTimezoneAwareDateRange(
          validated.filterType,
          validated.timezone,
          customStart,
          customEnd
        );

        // User timezone dates for display
        startDate = timezoneAwareDateRange.startDate;
        endDate = timezoneAwareDateRange.endDate;

        // UTC dates for database queries
        utcStartDate = timezoneAwareDateRange.utcStartDate;
        utcEndDate = timezoneAwareDateRange.utcEndDate;

        dateRangeDescription = DateFilterUtil.formatTimezoneAwareDateRange(
          validated.filterType,
          timezoneAwareDateRange
        );

        logger.info(
          "Timezone-aware date filtering applied for dashboard summary",
          {
            userId: req.user?.id,
            organizationId: req.organizationId,
            filterType: validated.filterType,
            timezone: validated.timezone,
            userDateRange: `${startDate.toISOString()} - ${endDate.toISOString()}`,
            utcDateRange: `${utcStartDate.toISOString()} - ${utcEndDate.toISOString()}`,
          }
        );
      } catch (error: any) {
        logger.error("Invalid date filter parameters for dashboard summary", {
          error: error.message,
          filterType,
          timezone: userTimezone,
        });
        return ResponseUtil.error(res, `Invalid date filter: ${error.message}`);
      }

      const summary = await this.dashboardService.getDashboardStats(
        req.organizationId,
        utcStartDate, // Use UTC dates for database queries
        utcEndDate
      );

      // Add filter information to response
      const responseData = {
        ...summary,
        filterInfo: {
          filterType,
          timezone: userTimezone,
          dateRange: dateRangeDescription,
          userStartDate: startDate!.toISOString(),
          userEndDate: endDate!.toISOString(),
          utcStartDate: utcStartDate!.toISOString(),
          utcEndDate: utcEndDate!.toISOString(),
        },
      };

      logger.info("Dashboard summary retrieved successfully", {
        userId: req.user?.id,
        organizationId: req.organizationId,
      });

      return ResponseUtil.success(
        res,
        responseData,
        "Dashboard summary retrieved successfully"
      );
    } catch (error: any) {
      logger.error("Error getting dashboard summary", {
        error: error.message,
      });
      return ResponseUtil.error(res, "Failed to retrieve dashboard summary");
    }
  };

  getFinancialMetrics = async (req: AuthenticatedRequest, res: Response) => {
    try {
      logger.info("Fetching financial metrics", {
        userId: req.user?.id,
        organizationId: req.organizationId,
        query: req.query,
      });

      if (!req.user || !req.organizationId) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      // Handle different date filter types with timezone support
      const filterType = (req.query.filterType as string) || "this_month";
      const customStart = req.query.startDate as string;
      const customEnd = req.query.endDate as string;
      const userTimezone = (req.query.timezone as string) || "UTC";

      let startDate: Date | undefined;
      let endDate: Date | undefined;
      let utcStartDate: Date | undefined;
      let utcEndDate: Date | undefined;
      let dateRangeDescription = "";

      try {
        // Validate timezone and filter parameters
        const validated = DateFilterUtil.validateDateFilterWithTimezone(
          filterType,
          userTimezone,
          customStart,
          customEnd
        );

        // Get timezone-aware date range
        const timezoneAwareDateRange = DateFilterUtil.getTimezoneAwareDateRange(
          validated.filterType,
          validated.timezone,
          customStart,
          customEnd
        );

        // User timezone dates for display
        startDate = timezoneAwareDateRange.startDate;
        endDate = timezoneAwareDateRange.endDate;

        // UTC dates for database queries
        utcStartDate = timezoneAwareDateRange.utcStartDate;
        utcEndDate = timezoneAwareDateRange.utcEndDate;

        dateRangeDescription = DateFilterUtil.formatTimezoneAwareDateRange(
          validated.filterType,
          timezoneAwareDateRange
        );

        logger.info(
          "Timezone-aware date filtering applied for financial metrics",
          {
            userId: req.user?.id,
            organizationId: req.organizationId,
            filterType: validated.filterType,
            timezone: validated.timezone,
            userDateRange: `${startDate.toISOString()} - ${endDate.toISOString()}`,
            utcDateRange: `${utcStartDate.toISOString()} - ${utcEndDate.toISOString()}`,
          }
        );
      } catch (error: any) {
        logger.error("Invalid date filter parameters for financial metrics", {
          error: error.message,
          filterType,
          timezone: userTimezone,
        });
        return ResponseUtil.error(res, `Invalid date filter: ${error.message}`);
      }

      const metrics = await this.dashboardService.getRevenueByMaterial(
        req.organizationId,
        utcStartDate, // Use UTC dates for database queries
        utcEndDate
      );

      // Add filter information to response
      const responseData = {
        metrics,
        filterInfo: {
          filterType,
          timezone: userTimezone,
          dateRange: dateRangeDescription,
          userStartDate: startDate!.toISOString(),
          userEndDate: endDate!.toISOString(),
          utcStartDate: utcStartDate!.toISOString(),
          utcEndDate: utcEndDate!.toISOString(),
        },
      };

      logger.info("Financial metrics retrieved successfully", {
        userId: req.user?.id,
        organizationId: req.organizationId,
      });

      return ResponseUtil.success(
        res,
        responseData,
        "Financial metrics retrieved successfully"
      );
    } catch (error: any) {
      logger.error("Get financial metrics error", {
        error: error.message,
      });
      return ResponseUtil.error(res, error.message);
    }
  };

  getDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
    try {
      logger.info("Fetching dashboard stats", {
        userId: req.user?.id,
        organizationId: req.organizationId,
        query: req.query,
      });

      if (!req.user || !req.organizationId) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      const year = req.query.year
        ? parseInt(req.query.year as string)
        : new Date().getFullYear();

      const stats = await this.dashboardService.getMonthlyRevenue(
        req.organizationId,
        year
      );

      logger.info("Dashboard statistics retrieved successfully", {
        userId: req.user?.id,
        organizationId: req.organizationId,
      });

      return ResponseUtil.success(
        res,
        stats,
        "Dashboard statistics retrieved successfully"
      );
    } catch (error: any) {
      logger.error("Get dashboard stats error", {
        error: error.message,
      });
      return ResponseUtil.error(res, error.message);
    }
  };

  getAvailableTimezones = async (req: AuthenticatedRequest, res: Response) => {
    try {
      logger.info("Fetching available timezones", {
        userId: req.user?.id,
        organizationId: req.organizationId,
      });

      const commonTimezones = [
        {
          value: "UTC",
          label: "UTC - Coordinated Universal Time",
          offset: "+00:00",
        },
        {
          value: "Asia/Kolkata",
          label: "IST - India Standard Time",
          offset: "+05:30",
        },
        {
          value: "America/New_York",
          label: "EST/EDT - Eastern Time",
          offset: "-05:00/-04:00",
        },
        {
          value: "America/Chicago",
          label: "CST/CDT - Central Time",
          offset: "-06:00/-05:00",
        },
        {
          value: "America/Denver",
          label: "MST/MDT - Mountain Time",
          offset: "-07:00/-06:00",
        },
        {
          value: "America/Los_Angeles",
          label: "PST/PDT - Pacific Time",
          offset: "-08:00/-07:00",
        },
        {
          value: "Europe/London",
          label: "GMT/BST - British Time",
          offset: "+00:00/+01:00",
        },
        {
          value: "Europe/Paris",
          label: "CET/CEST - Central European Time",
          offset: "+01:00/+02:00",
        },
        {
          value: "Europe/Berlin",
          label: "CET/CEST - Central European Time",
          offset: "+01:00/+02:00",
        },
        {
          value: "Asia/Tokyo",
          label: "JST - Japan Standard Time",
          offset: "+09:00",
        },
        {
          value: "Asia/Shanghai",
          label: "CST - China Standard Time",
          offset: "+08:00",
        },
        {
          value: "Asia/Dubai",
          label: "GST - Gulf Standard Time",
          offset: "+04:00",
        },
        {
          value: "Australia/Sydney",
          label: "AEST/AEDT - Australian Eastern Time",
          offset: "+10:00/+11:00",
        },
      ];

      // Add current offset for each timezone
      const timezonesWithCurrentOffset = commonTimezones.map((tz) => {
        try {
          const now = new Date();
          const tzDate = new Date(
            now.toLocaleString("en-US", { timeZone: tz.value })
          );
          const utcDate = new Date(
            now.toLocaleString("en-US", { timeZone: "UTC" })
          );
          const offsetMs = tzDate.getTime() - utcDate.getTime();
          const offsetHours = Math.floor(offsetMs / (1000 * 60 * 60));
          const offsetMinutes = Math.abs(
            Math.floor((offsetMs % (1000 * 60 * 60)) / (1000 * 60))
          );

          const currentOffset = `${offsetHours >= 0 ? "+" : ""}${String(
            offsetHours
          ).padStart(2, "0")}:${String(offsetMinutes).padStart(2, "0")}`;

          return {
            ...tz,
            currentOffset,
            currentTime: now.toLocaleString("en-US", {
              timeZone: tz.value,
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            }),
          };
        } catch (error) {
          return {
            ...tz,
            currentOffset: "Invalid",
            currentTime: "Invalid",
          };
        }
      });

      logger.info("Available timezones retrieved successfully", {
        userId: req.user?.id,
        organizationId: req.organizationId,
      });

      return ResponseUtil.success(
        res,
        { timezones: timezonesWithCurrentOffset },
        "Available timezones retrieved successfully"
      );
    } catch (error: any) {
      logger.error("Error getting available timezones", {
        error: error.message,
      });
      return ResponseUtil.error(res, "Failed to retrieve available timezones");
    }
  };

  getAvailableDateFilters = async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      logger.info("Fetching available date filters with timezone support", {
        userId: req.user?.id,
        organizationId: req.organizationId,
      });

      const availableFilters = [
        {
          type: "today",
          label: "Today",
          description: "Today's data only (timezone-aware)",
          supportsTimezone: true,
        },
        {
          type: "yesterday",
          label: "Yesterday",
          description: "Yesterday's data only (timezone-aware)",
          supportsTimezone: true,
        },
        {
          type: "this_week",
          label: "This Week",
          description: "Current week (Sunday to Saturday, timezone-aware)",
          supportsTimezone: true,
        },
        {
          type: "last_week",
          label: "Last Week",
          description: "Previous week (Sunday to Saturday, timezone-aware)",
          supportsTimezone: true,
        },
        {
          type: "this_month",
          label: "This Month",
          description: "Current month (1st to last day, timezone-aware)",
          supportsTimezone: true,
        },
        {
          type: "last_month",
          label: "Last Month",
          description: "Previous month (timezone-aware)",
          supportsTimezone: true,
        },
        {
          type: "this_year",
          label: "This Year",
          description: "Current year (Jan 1 to Dec 31, timezone-aware)",
          supportsTimezone: true,
        },
        {
          type: "last_7_days",
          label: "Last 7 Days",
          description: "Last 7 days including today (timezone-aware)",
          supportsTimezone: true,
        },
        {
          type: "last_30_days",
          label: "Last 30 Days",
          description: "Last 30 days including today (timezone-aware)",
          supportsTimezone: true,
        },
        {
          type: "custom",
          label: "Custom Range",
          description:
            "Custom date range with startDate and endDate (timezone-aware)",
          supportsTimezone: true,
        },
      ];

      // Get user's timezone from query or default to UTC
      const userTimezone = (req.query.timezone as string) || "Asia/Kolkata";

      // Calculate sample date ranges for each filter in different timezones
      const filtersWithRanges = availableFilters.map((filter) => {
        try {
          if (filter.type !== "custom") {
            // Show both UTC and user timezone examples
            const utcRange = DateFilterUtil.getTimezoneAwareDateRange(
              filter.type as DateFilterType,
              "UTC"
            );
            const userTimezoneRange = DateFilterUtil.getTimezoneAwareDateRange(
              filter.type as DateFilterType,
              userTimezone
            );

            return {
              ...filter,
              examples: {
                utc: {
                  timezone: "UTC",
                  displayRange: DateFilterUtil.formatTimezoneAwareDateRange(
                    filter.type as DateFilterType,
                    utcRange
                  ),
                  userLocalTime: {
                    start: utcRange.startDate.toISOString(),
                    end: utcRange.endDate.toISOString(),
                  },
                  databaseQuery: {
                    utcStart: utcRange.utcStartDate.toISOString(),
                    utcEnd: utcRange.utcEndDate.toISOString(),
                  },
                },
                userTimezone: {
                  timezone: userTimezone,
                  displayRange: DateFilterUtil.formatTimezoneAwareDateRange(
                    filter.type as DateFilterType,
                    userTimezoneRange
                  ),
                  userLocalTime: {
                    start: userTimezoneRange.startDate.toISOString(),
                    end: userTimezoneRange.endDate.toISOString(),
                  },
                  databaseQuery: {
                    utcStart: userTimezoneRange.utcStartDate.toISOString(),
                    utcEnd: userTimezoneRange.utcEndDate.toISOString(),
                  },
                },
              },
              usage: {
                withoutTimezone: `/dashboard?filterType=${filter.type}`,
                withTimezone: `/dashboard?filterType=${filter.type}&timezone=${userTimezone}`,
                customRange:
                  filter.type === "custom"
                    ? `/dashboard?filterType=custom&startDate=2024-01-01&endDate=2024-01-31&timezone=${userTimezone}`
                    : null,
              },
            };
          }
          return {
            ...filter,
            examples: {
              usage: "Requires startDate and endDate parameters",
            },
            usage: {
              withTimezone: `/dashboard?filterType=custom&startDate=2024-01-01&endDate=2024-01-31&timezone=${userTimezone}`,
              example: "Custom date range with timezone support",
            },
          };
        } catch (error) {
          return {
            ...filter,
            examples: {
              error: "Error calculating range",
            },
            usage: {
              error: "Error generating usage examples",
            },
          };
        }
      });

      // Add timezone information and benefits
      const responseData = {
        filters: filtersWithRanges,
        timezoneSupport: {
          enabled: true,
          defaultTimezone: "UTC",
          currentUserTimezone: userTimezone,
          benefits: [
            "Accurate date boundaries for users in different timezones",
            "Users see data based on their local time, not server time",
            "Example: India users get full day's data when filtering by 'today'",
            "Database queries automatically converted to UTC for consistency",
          ],
          howItWorks: {
            step1: "User sends timezone parameter (e.g., 'Asia/Kolkata')",
            step2: "Filter calculates date range in user's timezone",
            step3: "Date range converted to UTC for database queries",
            step4: "Response includes both user timezone and UTC information",
          },
        },
        availableTimezones: {
          endpoint: "/dashboard/timezones",
          popular: [
            "UTC",
            "Asia/Kolkata",
            "America/New_York",
            "Europe/London",
            "Asia/Tokyo",
          ],
        },
      };

      logger.info(
        "Available date filters with timezone support retrieved successfully",
        {
          userId: req.user?.id,
          organizationId: req.organizationId,
          userTimezone,
        }
      );

      return ResponseUtil.success(
        res,
        responseData,
        "Available date filters with timezone support retrieved successfully"
      );
    } catch (error: any) {
      logger.error("Error getting available date filters", {
        error: error.message,
      });
      return ResponseUtil.error(
        res,
        "Failed to retrieve available date filters"
      );
    }
  };
}
