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
      expensesName,
      startDate,
      endDate,
      userId,
      isActive,
    } = filters;

    const skip = (page - 1) * limit;
    const where: Prisma.OtherExpenseWhereInput = {};

    if (expensesName)
      where.expensesName = { contains: expensesName, mode: "insensitive" };
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
      expensesName,
      startDate,
      endDate,
      userId,
      isActive,
    } = filters;

    const skip = (page - 1) * limit;
    const where: Prisma.OtherExpenseWhereInput = { organizationId };

    if (expensesName)
      where.expensesName = { contains: expensesName, mode: "insensitive" };
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

    const [totalExpenses, totalAmount, expenses] = await Promise.all([
      prisma.otherExpense.count({ where }),
      prisma.otherExpense.aggregate({
        where,
        _sum: { amount: true },
      }),
      prisma.otherExpense.findMany({
        where,
        select: {
          expensesName: true,
          amount: true,
          others: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { amount: "desc" },
      }),
    ]);

    return {
      totalExpenses,
      totalAmount: totalAmount._sum.amount || 0,
      expenses: expenses.map((item) => ({
        expensesName: item.expensesName,
        totalAmount: item.amount || 0,
        others: item.others || null,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
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
      select: { expensesName: true },
      distinct: ["expensesName"],
      orderBy: { expensesName: "asc" },
    });

    return result.map((item) => item.expensesName);
  }
}
