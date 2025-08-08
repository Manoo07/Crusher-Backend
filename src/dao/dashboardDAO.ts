import { Prisma } from "@prisma/client";
import { prisma } from "../utils/database";

export class DashboardDAO {
  async getDashboardStats(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const whereClause: Prisma.TruckEntryWhereInput = {
      organizationId,
      ...(startDate &&
        endDate && {
          entryDate: {
            gte: startDate,
            lte: endDate,
          },
        }),
    };

    const [
      totalTruckEntries,
      revenueResult,
      totalExpenses,
      totalActiveRates,
      recentEntries,
    ] = await Promise.all([
      // Total truck entries
      prisma.truckEntry.count({
        where: whereClause,
      }),

      // Total revenue
      prisma.truckEntry.aggregate({
        where: whereClause,
        _sum: {
          totalAmount: true,
        },
      }),

      // Total expenses
      prisma.otherExpense.aggregate({
        where: {
          organizationId,
          isActive: true,
          ...(startDate &&
            endDate && {
              date: {
                gte: startDate,
                lte: endDate,
              },
            }),
        },
        _sum: {
          amount: true,
        },
      }),

      // Total active material rates
      prisma.materialRate.count({
        where: {
          organizationId,
          isActive: true,
        },
      }),

      // Recent entries (last 10)
      prisma.truckEntry.findMany({
        where: {
          organizationId,
        },
        orderBy: {
          entryDate: "desc",
        },
        take: 10,
        include: {
          user: {
            select: {
              username: true,
            },
          },
        },
      }),
    ]);

    const totalRevenue = revenueResult._sum.totalAmount?.toNumber() || 0;
    const totalExpenseAmount = totalExpenses._sum.amount?.toNumber() || 0;
    const netProfit = totalRevenue - totalExpenseAmount;

    return {
      totalTruckEntries,
      totalRevenue,
      totalExpenses: totalExpenseAmount,
      netProfit,
      totalActiveRates,
      recentEntries,
    };
  }

  async getRevenueByMaterial(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const whereClause: Prisma.TruckEntryWhereInput = {
      organizationId,
      ...(startDate &&
        endDate && {
          entryDate: {
            gte: startDate,
            lte: endDate,
          },
        }),
    };

    const result = await prisma.truckEntry.groupBy({
      by: ["materialType"],
      where: whereClause,
      _sum: {
        totalAmount: true,
        units: true,
      },
      orderBy: {
        _sum: {
          totalAmount: "desc",
        },
      },
    });

    return result.map((item) => ({
      materialType: item.materialType || "Unknown",
      revenue: item._sum.totalAmount?.toNumber() || 0,
      units: item._sum.units?.toNumber() || 0,
    }));
  }

  async getMonthlyRevenue(organizationId: string, year: number) {
    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const result = await prisma.truckEntry.groupBy({
      by: ["entryDate"],
      where: {
        organizationId,
        entryDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      _sum: {
        totalAmount: true,
      },
    });

    // Group by month
    const monthlyData = new Map<number, number>();

    result.forEach((item) => {
      const month = item.entryDate.getMonth();
      const revenue = item._sum.totalAmount?.toNumber() || 0;
      monthlyData.set(month, (monthlyData.get(month) || 0) + revenue);
    });

    const months = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    return months.map((month, index) => ({
      month,
      revenue: monthlyData.get(index) || 0,
    }));
  }

  async getTopMaterials(organizationId: string, limit: number = 5) {
    const result = await prisma.truckEntry.groupBy({
      by: ["materialType"],
      where: {
        organizationId,
      },
      _sum: {
        totalAmount: true,
        units: true,
      },
      orderBy: {
        _sum: {
          totalAmount: "desc",
        },
      },
      take: limit,
    });

    return result.map((item) => ({
      materialType: item.materialType || "Unknown",
      revenue: item._sum.totalAmount?.toNumber() || 0,
      units: item._sum.units?.toNumber() || 0,
    }));
  }
}
