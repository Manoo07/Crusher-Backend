import { DashboardDAO } from "../dao/dashboardDAO";

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
  recentEntries: any[];
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
    return await this.dashboardDAO.getComprehensiveDashboardSummary(
      organizationId,
      startDate,
      endDate
    );
  }

  async getDashboardStats(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<DashboardStats> {
    return await this.dashboardDAO.getDashboardStats(
      organizationId,
      startDate,
      endDate
    );
  }

  async getRevenueByMaterial(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<RevenueByMaterial[]> {
    return await this.dashboardDAO.getRevenueByMaterial(
      organizationId,
      startDate,
      endDate
    );
  }

  async getMonthlyRevenue(
    organizationId: string,
    year: number
  ): Promise<{ month: string; revenue: number }[]> {
    return await this.dashboardDAO.getMonthlyRevenue(organizationId, year);
  }

  async getTopMaterials(
    organizationId: string,
    limit: number = 5
  ): Promise<RevenueByMaterial[]> {
    return await this.dashboardDAO.getTopMaterials(organizationId, limit);
  }
}
