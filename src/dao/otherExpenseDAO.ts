import { OtherExpense, Prisma } from "@prisma/client";
import { ExpenseFilters } from "../types";
import { prisma } from "../utils/database";
import { logger } from "../utils/logger";

export class OtherExpenseDAO {
  async create(data: Prisma.OtherExpenseCreateInput): Promise<OtherExpense> {
    logger.info("Creating other expense", { data });

    const result = await prisma.otherExpense.create({
      data,
      include: {
        organization: true,
        user: true,
      },
    });

    logger.info("Other expense created successfully", { expenseId: result.id });
    return result;
  }

  async findById(id: string): Promise<OtherExpense | null> {
    logger.info("Finding other expense by id", { id });

    const result = await prisma.otherExpense.findUnique({
      where: { id },
      include: {
        organization: true,
        user: true,
      },
    });

    if (result) {
      logger.info("Other expense found", { expenseId: result.id });
    } else {
      logger.warn("Other expense not found", { id });
    }

    return result;
  }

  async findAll(
    filters: ExpenseFilters
  ): Promise<{ expenses: OtherExpense[]; total: number }> {
    logger.info("Finding all other expenses", { filters });

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

    logger.info("Other expenses retrieved", { count: expenses.length, total });

    return { expenses, total };
  }

  async findByOrganizationId(
    organizationId: string,
    filters: ExpenseFilters
  ): Promise<{ expenses: OtherExpense[]; total: number }> {
    logger.info("Finding other expenses by organization id", {
      organizationId,
    });

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

    logger.info("Other expenses by organization retrieved", {
      count: expenses.length,
      total,
    });

    return { expenses, total };
  }

  async update(
    id: string,
    data: Prisma.OtherExpenseUpdateInput
  ): Promise<OtherExpense> {
    logger.info("Updating other expense", { id, data });

    const result = await prisma.otherExpense.update({
      where: { id },
      data,
      include: {
        organization: true,
        user: true,
      },
    });

    logger.info("Other expense updated successfully", { expenseId: result.id });

    return result;
  }

  async delete(id: string): Promise<OtherExpense> {
    logger.info("Deleting other expense", { id });

    const result = await prisma.otherExpense.delete({
      where: { id },
      include: {
        organization: true,
        user: true,
      },
    });

    logger.info("Other expense deleted successfully", { expenseId: result.id });

    return result;
  }

  async getExpenseStatsByOrganization(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    logger.info("Getting expense stats by organization", {
      organizationId,
      startDate,
      endDate,
    });

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
          id: true,
          expensesName: true,
          amount: true,
          others: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { amount: "desc" },
      }),
    ]);

    logger.info("Expense stats retrieved", {
      totalExpenses,
      totalAmount: totalAmount._sum.amount || 0,
    });

    return {
      totalExpenses,
      totalAmount: totalAmount._sum.amount || 0,
      expenses: expenses.map((item) => ({
        id: item.id,
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
    logger.info("Getting expense types by organization", { organizationId });

    const result = await prisma.otherExpense.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      select: { expensesName: true },
      distinct: ["expensesName"],
      orderBy: { expensesName: "asc" },
    });

    logger.info("Expense types retrieved", {
      count: result.length,
      organizationId,
    });

    return result.map((item) => item.expensesName);
  }
}
