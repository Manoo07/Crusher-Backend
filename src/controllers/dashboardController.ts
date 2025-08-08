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

      const period = (req.query.period as string) || "month";
      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined;
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : undefined;
      const userId = req.query.userId as string;

      const summary = await this.dashboardService.getDashboardSummary(
        req.organizationId,
        period,
        startDate,
        endDate,
        userId
      );

      return ResponseUtil.success(
        res,
        summary,
        "Dashboard summary retrieved successfully"
      );
    } catch (error: any) {
      console.error("Get dashboard summary error:", error);
      return ResponseUtil.error(res, error.message);
    }
  };

  getFinancialMetrics = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user || !req.organizationId) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      const period = (req.query.period as string) || "month";
      const userId = req.query.userId as string;

      const metrics = await this.dashboardService.getFinancialMetrics(
        req.organizationId,
        period,
        userId
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

      const period = (req.query.period as string) || "month";

      const stats = await this.dashboardService.getDashboardStats(
        req.organizationId,
        period
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
