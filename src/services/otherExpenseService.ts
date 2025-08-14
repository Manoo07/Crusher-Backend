import { OtherExpense, Prisma } from "@prisma/client";
import { OtherExpenseDAO } from "../dao/otherExpenseDAO";
import { ExpenseFilters } from "../types";
import { logger } from "../utils/logger";

export class OtherExpenseService {
  private otherExpenseDAO: OtherExpenseDAO;

  constructor() {
    this.otherExpenseDAO = new OtherExpenseDAO();
  }

  async createExpense(
    expenseData: {
      expensesName: string;
      amount: number;
      others?: string;
      notes?: string;
    },
    userId: string,
    organizationId: string
  ): Promise<OtherExpense> {
    logger.info("Creating expense in service layer", {
      expenseData,
      userId,
      organizationId,
    });
    const createData: Prisma.OtherExpenseCreateInput = {
      expensesName: expenseData.expensesName,
      amount: expenseData.amount,
      others: expenseData.others || null,
      notes: expenseData.notes || null,
      date: new Date(), // Automatically set to current date
      user: { connect: { id: userId } },
      organization: { connect: { id: organizationId } },
      isActive: true,
    };
    const result = await this.otherExpenseDAO.create(createData);
    logger.info("Expense created successfully in service layer", {
      expenseId: result.id,
    });
    return result;
  }

  async getExpenseById(id: string): Promise<OtherExpense | null> {
    logger.info("Fetching expense by ID in service layer", { id });
    const result = await this.otherExpenseDAO.findById(id);
    if (result) {
      logger.info("Expense found in service layer", { expenseId: result.id });
    } else {
      logger.warn("Expense not found in service layer", { id });
    }
    return result;
  }

  async getExpensesByOrganization(
    organizationId: string,
    filters: ExpenseFilters
  ): Promise<{ expenses: OtherExpense[]; total: number }> {
    logger.info("Fetching expenses by organization in service layer", {
      organizationId,
      filters,
    });
    const result = await this.otherExpenseDAO.findByOrganizationId(
      organizationId,
      filters
    );
    logger.info("Expenses retrieved successfully in service layer", {
      count: result.expenses.length,
    });
    return result;
  }

  async updateExpense(
    id: string,
    updateData: {
      expensesName?: string;
      amount?: number;
      others?: string;
      notes?: string;
    }
  ): Promise<OtherExpense> {
    logger.info("Updating expense in service layer", { id, updateData });
    const data: Prisma.OtherExpenseUpdateInput = {};

    if (updateData.expensesName) data.expensesName = updateData.expensesName;
    if (updateData.amount !== undefined) data.amount = updateData.amount;
    if (updateData.others !== undefined) data.others = updateData.others;
    if (updateData.notes !== undefined) data.notes = updateData.notes;
    // Note: We don't allow updating the date after creation

    const result = await this.otherExpenseDAO.update(id, data);
    logger.info("Expense updated successfully in service layer", {
      expenseId: result.id,
    });
    return result;
  }

  async deleteExpense(id: string): Promise<OtherExpense> {
    logger.info("Deleting expense in service layer", { id });
    const result = await this.otherExpenseDAO.delete(id);
    logger.info("Expense deleted successfully in service layer", {
      expenseId: result.id,
    });
    return result;
  }

  async getExpenseSummary(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    logger.info("Fetching expense summary in service layer", {
      organizationId,
      startDate,
      endDate,
    });
    const result = await this.otherExpenseDAO.getExpenseStatsByOrganization(
      organizationId,
      startDate,
      endDate
    );
    logger.info("Expense summary retrieved successfully in service layer", {
      totalAmount: result.totalAmount,
    });
    return result;
  }

  async getExpenseTypes(organizationId: string): Promise<string[]> {
    logger.info("Fetching expense types in service layer", { organizationId });
    const result = await this.otherExpenseDAO.getExpenseTypesByOrganization(
      organizationId
    );
    logger.info("Expense types retrieved successfully in service layer", {
      count: result.length,
    });
    return result;
  }

  async validateExpenseOwnership(
    expenseId: string,
    organizationId: string
  ): Promise<boolean> {
    logger.info("Validating expense ownership in service layer", {
      expenseId,
      organizationId,
    });
    const isOwner =
      (await this.otherExpenseDAO.findById(expenseId))?.organizationId ===
      organizationId;
    logger.info("Expense ownership validation result", {
      expenseId,
      isOwner,
    });
    return isOwner;
  }

  async getExpensesByDateRange(
    organizationId: string,
    startDate: string,
    endDate: string
  ): Promise<OtherExpense[]> {
    logger.info("Fetching expenses by date range in service layer", {
      organizationId,
      startDate,
      endDate,
    });
    const filters: ExpenseFilters = {
      page: 1,
      limit: 10000, // Get all expenses within date range
      sortBy: "createdAt",
      sortOrder: "desc",
      startDate,
      endDate,
    };

    const result = await this.otherExpenseDAO.findByOrganizationId(
      organizationId,
      filters
    );
    logger.info(
      "Expenses by date range retrieved successfully in service layer",
      {
        count: result.expenses.length,
      }
    );
    return result.expenses;
  }
}
