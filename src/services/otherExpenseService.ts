import { OtherExpense, Prisma } from "@prisma/client";
import { OtherExpenseDAO } from "../dao/otherExpenseDAO";
import { ExpenseFilters } from "../types";

export class OtherExpenseService {
  private otherExpenseDAO: OtherExpenseDAO;

  constructor() {
    this.otherExpenseDAO = new OtherExpenseDAO();
  }

  async createExpense(
    expenseData: {
      expenseType: string;
      amount: number;
      description?: string;
      date: string;
    },
    userId: string,
    organizationId: string
  ): Promise<OtherExpense> {
    const createData: Prisma.OtherExpenseCreateInput = {
      expenseType: expenseData.expenseType,
      amount: expenseData.amount,
      description: expenseData.description || null,
      date: new Date(expenseData.date),
      user: { connect: { id: userId } },
      organization: { connect: { id: organizationId } },
      isActive: true,
    };

    return await this.otherExpenseDAO.create(createData);
  }

  async getExpenseById(id: string): Promise<OtherExpense | null> {
    return await this.otherExpenseDAO.findById(id);
  }

  async getExpensesByOrganization(
    organizationId: string,
    filters: ExpenseFilters
  ): Promise<{ expenses: OtherExpense[]; total: number }> {
    return await this.otherExpenseDAO.findByOrganizationId(
      organizationId,
      filters
    );
  }

  async updateExpense(
    id: string,
    updateData: {
      expenseType?: string;
      amount?: number;
      description?: string;
      date?: string;
    }
  ): Promise<OtherExpense> {
    const data: Prisma.OtherExpenseUpdateInput = {};

    if (updateData.expenseType) data.expenseType = updateData.expenseType;
    if (updateData.amount !== undefined) data.amount = updateData.amount;
    if (updateData.description !== undefined)
      data.description = updateData.description;
    if (updateData.date) data.date = new Date(updateData.date);

    return await this.otherExpenseDAO.update(id, data);
  }

  async deleteExpense(id: string): Promise<OtherExpense> {
    return await this.otherExpenseDAO.delete(id);
  }

  async getExpenseSummary(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ) {
    return await this.otherExpenseDAO.getExpenseStatsByOrganization(
      organizationId,
      startDate,
      endDate
    );
  }

  async getExpenseTypes(organizationId: string): Promise<string[]> {
    return await this.otherExpenseDAO.getExpenseTypesByOrganization(
      organizationId
    );
  }

  async validateExpenseOwnership(
    expenseId: string,
    organizationId: string
  ): Promise<boolean> {
    const expense = await this.otherExpenseDAO.findById(expenseId);
    return expense?.organizationId === organizationId;
  }
}
