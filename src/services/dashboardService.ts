import { DashboardDAO } from "../dao/dashboardDAO";
import { logger } from "../utils/logger";

export interface DashboardStats {
  totalTruckEntries: number;
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalActiveRates: number;
  recentEntries: any[];
}

export interface ComprehensiveDashboardSummary {
  totalEntries: number;
  totalSales: {
    count: number;
    totalAmount: number;
    entries: any[];
  };
  rawStone: {
    count: number;
    totalAmount: number;
    entries: any[];
  };
  expenses: {
    count: number;
    totalAmount: number;
    entries: any[];
  };
  netWorth: number;
  // recentEntries: any[];
}

export interface RevenueByMaterial {
  materialType: string;
  revenue: number;
  units: number;
}

export class DashboardService {
  private dashboardDAO: DashboardDAO;

  constructor() {
    this.dashboardDAO = new DashboardDAO();
  }

  async getComprehensiveDashboardSummary(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ComprehensiveDashboardSummary> {
    logger.info("Fetching comprehensive dashboard summary", {
      organizationId,
      startDate,
      endDate,
    });

    const result = await this.dashboardDAO.getComprehensiveDashboardSummary(
      organizationId,
      startDate,
      endDate
    );

    logger.info("Dashboard summary fetched successfully", { organizationId });
    return result;
  }

  async getDashboardStats(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<DashboardStats> {
    logger.info("Fetching dashboard stats", {
      organizationId,
      startDate,
      endDate,
    });

    const result = await this.dashboardDAO.getDashboardStats(
      organizationId,
      startDate,
      endDate
    );

    logger.info("Dashboard stats fetched successfully", { organizationId });
    return result;
  }

  async getRevenueByMaterial(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<RevenueByMaterial[]> {
    logger.info("Fetching revenue by material", {
      organizationId,
      startDate,
      endDate,
    });

    const result = await this.dashboardDAO.getRevenueByMaterial(
      organizationId,
      startDate,
      endDate
    );

    logger.info("Revenue by material fetched successfully", { organizationId });
    return result;
  }

  async getMonthlyRevenue(
    organizationId: string,
    year: number
  ): Promise<{ month: string; revenue: number }[]> {
    logger.info("Fetching monthly revenue", { organizationId, year });

    const result = await this.dashboardDAO.getMonthlyRevenue(
      organizationId,
      year
    );

    logger.info("Monthly revenue fetched successfully", { organizationId });
    return result;
  }

  async getTopMaterials(
    organizationId: string,
    limit: number = 5
  ): Promise<RevenueByMaterial[]> {
    logger.info("Fetching top materials", { organizationId, limit });

    const result = await this.dashboardDAO.getTopMaterials(
      organizationId,
      limit
    );

    logger.info("Top materials fetched successfully", { organizationId });
    return result;
  }
}
