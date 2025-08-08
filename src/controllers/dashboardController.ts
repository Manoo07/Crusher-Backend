import { Response } from "express";
import { DashboardService } from "../services/dashboardService";
import { AuthenticatedRequest } from "../types";
import { ResponseUtil } from "../utils/response";

export class DashboardController {
  private dashboardService: DashboardService;

  constructor() {
    this.dashboardService = new DashboardService();
  }

  getDashboardSummary = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user || !req.organizationId) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined;
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : undefined;

      const summary = await this.dashboardService.getDashboardStats(
        req.organizationId,
        startDate,
        endDate
      );

      return ResponseUtil.success(
        res,
        summary,
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

      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined;
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : undefined;

      const metrics = await this.dashboardService.getRevenueByMaterial(
        req.organizationId,
        startDate,
        endDate
      );

      return ResponseUtil.success(
        res,
        metrics,
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
}
