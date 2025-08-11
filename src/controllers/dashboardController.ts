import { Response } from "express";
import { DashboardService } from "../services/dashboardService";
import { AuthenticatedRequest } from "../types";
import { DateFilterType, DateFilterUtil } from "../utils/dateFilters";
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
      if (!req.user || !req.organizationId) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      // Handle different date filter types
      const filterType = (req.query.filterType as string) || "this_week";
      const customStart = req.query.startDate as string;
      const customEnd = req.query.endDate as string;

      // Initialize variables
      let startDate: Date;
      let endDate: Date;

      try {
        // Get date range using existing DateFilterUtil
        const dateRange = DateFilterUtil.getDateRange(
          filterType as DateFilterType,
          customStart,
          customEnd
        );

        startDate = dateRange.startDate;
        endDate = dateRange.endDate;
      } catch (error: any) {
        return ResponseUtil.error(res, `Invalid date filter: ${error.message}`);
      }

      const summary =
        await this.dashboardService.getComprehensiveDashboardSummary(
          req.organizationId,
          startDate,
          endDate
        );

      // Return the summary
      return ResponseUtil.success(
        res,
        {
          ...summary,
          filterInfo: {
            filterType,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          },
        },
        "Comprehensive dashboard summary retrieved successfully"
      );
    } catch (error: any) {
      console.error("Error getting comprehensive dashboard summary:", error);
      return ResponseUtil.error(
        res,
        "Failed to retrieve comprehensive dashboard summary"
      );
    }
  };

  getDashboardSummary = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user || !req.organizationId) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      // Handle different date filter types
      const filterType = (req.query.filterType as string) || "this_month";
      const customStart = req.query.startDate as string;
      const customEnd = req.query.endDate as string;

      let startDate: Date | undefined;
      let endDate: Date | undefined;
      let dateRangeDescription = "";

      try {
        // Validate and get date range
        const validatedFilterType = DateFilterUtil.validateDateFilter(
          filterType,
          customStart,
          customEnd
        );
        const dateRange = DateFilterUtil.getDateRange(
          validatedFilterType,
          customStart,
          customEnd
        );

        startDate = dateRange.startDate;
        endDate = dateRange.endDate;
        dateRangeDescription = DateFilterUtil.formatDateRange(
          validatedFilterType,
          dateRange
        );
      } catch (error: any) {
        return ResponseUtil.error(res, `Invalid date filter: ${error.message}`);
      }

      const summary = await this.dashboardService.getDashboardStats(
        req.organizationId,
        startDate,
        endDate
      );

      // Add filter information to response
      const responseData = {
        ...summary,
        filterInfo: {
          filterType,
          dateRange: dateRangeDescription,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      };

      return ResponseUtil.success(
        res,
        responseData,
        "Dashboard summary retrieved successfully"
      );
    } catch (error: any) {
      console.error("Error getting dashboard summary:", error);
      return ResponseUtil.error(res, "Failed to retrieve dashboard summary");
    }
  };

  getFinancialMetrics = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user || !req.organizationId) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      // Handle different date filter types
      const filterType = (req.query.filterType as string) || "this_month";
      const customStart = req.query.startDate as string;
      const customEnd = req.query.endDate as string;

      let startDate: Date | undefined;
      let endDate: Date | undefined;
      let dateRangeDescription = "";

      try {
        // Validate and get date range
        const validatedFilterType = DateFilterUtil.validateDateFilter(
          filterType,
          customStart,
          customEnd
        );
        const dateRange = DateFilterUtil.getDateRange(
          validatedFilterType,
          customStart,
          customEnd
        );

        startDate = dateRange.startDate;
        endDate = dateRange.endDate;
        dateRangeDescription = DateFilterUtil.formatDateRange(
          validatedFilterType,
          dateRange
        );
      } catch (error: any) {
        return ResponseUtil.error(res, `Invalid date filter: ${error.message}`);
      }

      const metrics = await this.dashboardService.getRevenueByMaterial(
        req.organizationId,
        startDate,
        endDate
      );

      // Add filter information to response
      const responseData = {
        metrics,
        filterInfo: {
          filterType,
          dateRange: dateRangeDescription,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        },
      };

      return ResponseUtil.success(
        res,
        responseData,
        "Financial metrics retrieved successfully"
      );
    } catch (error: any) {
      console.error("Get financial metrics error:", error);
      return ResponseUtil.error(res, error.message);
    }
  };

  getDashboardStats = async (req: AuthenticatedRequest, res: Response) => {
    try {
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

      return ResponseUtil.success(
        res,
        stats,
        "Dashboard statistics retrieved successfully"
      );
    } catch (error: any) {
      console.error("Get dashboard stats error:", error);
      return ResponseUtil.error(res, error.message);
    }
  };

  getAvailableDateFilters = async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      const availableFilters = [
        {
          type: "today",
          label: "Today",
          description: "Today's data only",
        },
        {
          type: "yesterday",
          label: "Yesterday",
          description: "Yesterday's data only",
        },
        {
          type: "this_week",
          label: "This Week",
          description: "Current week (Sunday to Saturday)",
        },
        {
          type: "last_week",
          label: "Last Week",
          description: "Previous week (Sunday to Saturday)",
        },
        {
          type: "this_month",
          label: "This Month",
          description: "Current month (1st to last day)",
        },
        {
          type: "last_month",
          label: "Last Month",
          description: "Previous month",
        },
        {
          type: "this_year",
          label: "This Year",
          description: "Current year (Jan 1 to Dec 31)",
        },
        {
          type: "last_7_days",
          label: "Last 7 Days",
          description: "Last 7 days including today",
        },
        {
          type: "last_30_days",
          label: "Last 30 Days",
          description: "Last 30 days including today",
        },
        {
          type: "custom",
          label: "Custom Range",
          description: "Custom date range with startDate and endDate",
        },
      ];

      // Calculate sample date ranges for each filter
      const filtersWithRanges = availableFilters.map((filter) => {
        try {
          if (filter.type !== "custom") {
            const dateRange = DateFilterUtil.getDateRange(
              filter.type as DateFilterType
            );
            return {
              ...filter,
              sampleDateRange: DateFilterUtil.formatDateRange(
                filter.type as DateFilterType,
                dateRange
              ),
            };
          }
          return {
            ...filter,
            sampleDateRange: "Requires startDate and endDate parameters",
          };
        } catch (error) {
          return {
            ...filter,
            sampleDateRange: "Error calculating range",
          };
        }
      });

      return ResponseUtil.success(
        res,
        { filters: filtersWithRanges },
        "Available date filters retrieved successfully"
      );
    } catch (error: any) {
      console.error("Error getting available date filters:", error);
      return ResponseUtil.error(
        res,
        "Failed to retrieve available date filters"
      );
    }
  };
}
