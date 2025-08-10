import { Prisma } from "@prisma/client";
import { prisma } from "../utils/database";

export class DashboardDAO {
  async getComprehensiveDashboardSummary(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    const truckEntryWhereClause: Prisma.TruckEntryWhereInput = {
      organizationId,
      ...(startDate &&
        endDate && {
          entryDate: {
            gte: startDate,
            lte: endDate,
          },
        }),
    };

    const expenseWhereClause = {
      organizationId,
      isActive: true,
      ...(startDate &&
        endDate && {
          date: {
            gte: startDate,
            lte: endDate,
          },
        }),
    };

    // Get sales entries (entry type: "Sales")
    const salesEntries = await prisma.truckEntry.findMany({
      where: {
        ...truckEntryWhereClause,
        entryType: "Sales",
      },
      orderBy: {
        entryDate: "desc",
      },
      take: 5,
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    // Get raw stone entries (entry type: "RawStone")
    const rawStoneEntries = await prisma.truckEntry.findMany({
      where: {
        ...truckEntryWhereClause,
        entryType: "RawStone",
      },
      orderBy: {
        entryDate: "desc",
      },
      take: 5,
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    // Get expense entries
    const expenseEntries = await prisma.otherExpense.findMany({
      where: expenseWhereClause,
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    // Get aggregated data
    const [salesAggregation, rawStoneAggregation, expenseAggregation] =
      await Promise.all([
        prisma.truckEntry.aggregate({
          where: {
            ...truckEntryWhereClause,
            entryType: "Sales",
          },
          _count: { id: true },
          _sum: { totalAmount: true },
        }),
        prisma.truckEntry.aggregate({
          where: {
            ...truckEntryWhereClause,
            entryType: "RawStone",
          },
          _count: { id: true },
          _sum: { totalAmount: true },
        }),
        prisma.otherExpense.aggregate({
          where: expenseWhereClause,
          _count: { id: true },
          _sum: { amount: true },
        }),
      ]);

    // Calculate totals
    const totalSales = {
      count: salesAggregation._count.id || 0,
      totalAmount: salesAggregation._sum.totalAmount?.toNumber() || 0,
      entries: salesEntries,
    };

    const rawStone = {
      count: rawStoneAggregation._count.id || 0,
      totalAmount: rawStoneAggregation._sum.totalAmount?.toNumber() || 0,
      entries: rawStoneEntries,
    };

    const expenses = {
      count: expenseAggregation._count.id || 0,
      totalAmount: expenseAggregation._sum.amount?.toNumber() || 0,
      entries: expenseEntries,
    };

    const totalEntries = totalSales.count + rawStone.count + expenses.count;
    const netWorth =
      totalSales.totalAmount + rawStone.totalAmount - expenses.totalAmount;

    // Get recent entries from all sources (combined)
    const recentTruckEntries = await prisma.truckEntry.findMany({
      where: truckEntryWhereClause,
      orderBy: {
        entryDate: "desc",
      },
      take: 5,
      include: {
        user: {
          select: {
            username: true,
          },
        },
      },
    });

    const recentExpenses = await prisma.otherExpense.findMany({
      where: expenseWhereClause,
      orderBy: {
        createdAt: "desc",
      },
      take: 5,
    });

    // Combine and sort recent entries
    const combinedRecentEntries = [
      ...recentTruckEntries.map((entry) => ({
        ...entry,
        type: "truck_entry",
        date: entry.entryDate,
      })),
      ...recentExpenses.map((expense) => ({
        ...expense,
        type: "expense",
        date: expense.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    return {
      totalEntries,
      totalSales,
      rawStone,
      expenses,
      netWorth,
      recentEntries: combinedRecentEntries,
    };
  }

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
