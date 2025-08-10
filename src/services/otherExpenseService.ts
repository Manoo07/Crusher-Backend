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
      expensesName: string;
      amount: number;
      others?: string;
      notes?: string;
    },
    userId: string,
    organizationId: string
  ): Promise<OtherExpense> {
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
      expensesName?: string;
      amount?: number;
      others?: string;
      notes?: string;
    }
  ): Promise<OtherExpense> {
    const data: Prisma.OtherExpenseUpdateInput = {};

    if (updateData.expensesName) data.expensesName = updateData.expensesName;
    if (updateData.amount !== undefined) data.amount = updateData.amount;
    if (updateData.others !== undefined) data.others = updateData.others;
    if (updateData.notes !== undefined) data.notes = updateData.notes;
    // Note: We don't allow updating the date after creation

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
