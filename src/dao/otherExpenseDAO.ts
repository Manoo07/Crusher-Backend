import { OtherExpense, Prisma } from "@prisma/client";
import { ExpenseFilters } from "../types";
import { prisma } from "../utils/database";

export class OtherExpenseDAO {
  async create(data: Prisma.OtherExpenseCreateInput): Promise<OtherExpense> {
    return await prisma.otherExpense.create({
      data,
      include: {
        organization: true,
        user: true,
      },
    });
  }

  async findById(id: string): Promise<OtherExpense | null> {
    return await prisma.otherExpense.findUnique({
      where: { id },
      include: {
        organization: true,
        user: true,
      },
    });
  }

  async findAll(
    filters: ExpenseFilters
  ): Promise<{ expenses: OtherExpense[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      expenseType,
      startDate,
      endDate,
      userId,
      isActive,
    } = filters;

    const skip = (page - 1) * limit;
    const where: Prisma.OtherExpenseWhereInput = {};

    if (expenseType)
      where.expenseType = { contains: expenseType, mode: "insensitive" };
    if (userId) where.userId = userId;
    if (typeof isActive === "boolean") where.isActive = isActive;

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [expenses, total] = await Promise.all([
      prisma.otherExpense.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          organization: true,
          user: true,
        },
      }),
      prisma.otherExpense.count({ where }),
    ]);

    return { expenses, total };
  }

  async findByOrganizationId(
    organizationId: string,
    filters: ExpenseFilters
  ): Promise<{ expenses: OtherExpense[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      expenseType,
      startDate,
      endDate,
      userId,
      isActive,
    } = filters;

    const skip = (page - 1) * limit;
    const where: Prisma.OtherExpenseWhereInput = { organizationId };

    if (expenseType)
      where.expenseType = { contains: expenseType, mode: "insensitive" };
    if (userId) where.userId = userId;
    if (typeof isActive === "boolean") where.isActive = isActive;

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const [expenses, total] = await Promise.all([
      prisma.otherExpense.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          organization: true,
          user: true,
        },
      }),
      prisma.otherExpense.count({ where }),
    ]);

    return { expenses, total };
  }

  async update(
    id: string,
    data: Prisma.OtherExpenseUpdateInput
  ): Promise<OtherExpense> {
    return await prisma.otherExpense.update({
      where: { id },
      data,
      include: {
        organization: true,
        user: true,
      },
    });
  }

  async delete(id: string): Promise<OtherExpense> {
    return await prisma.otherExpense.update({
      where: { id },
      data: { isActive: false },
      include: {
        organization: true,
        user: true,
      },
    });
  }

  async getExpenseStatsByOrganization(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    const where: Prisma.OtherExpenseWhereInput = {
      organizationId,
      isActive: true,
    };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = startDate;
      if (endDate) where.date.lte = endDate;
    }

    const [totalExpenses, totalAmount, expensesByType] = await Promise.all([
      prisma.otherExpense.count({ where }),
      prisma.otherExpense.aggregate({
        where,
        _sum: { amount: true },
      }),
      prisma.otherExpense.groupBy({
        by: ["expenseType"],
        where,
        _sum: { amount: true },
        _count: { id: true },
        orderBy: { _sum: { amount: "desc" } },
      }),
    ]);

    return {
      totalExpenses,
      totalAmount: totalAmount._sum.amount || 0,
      expensesByType: expensesByType.map((item) => ({
        expenseType: item.expenseType,
        totalAmount: item._sum.amount || 0,
        count: item._count.id,
      })),
    };
  }

  async getExpenseTypesByOrganization(
    organizationId: string
  ): Promise<string[]> {
    const result = await prisma.otherExpense.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      select: { expenseType: true },
      distinct: ["expenseType"],
      orderBy: { expenseType: "asc" },
    });

    return result.map((item) => item.expenseType);
  }
}
