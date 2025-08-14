import { Request, Response } from "express";
import { OtherExpenseService } from "../services/otherExpenseService";
import { ExpenseFilters } from "../types";
import { logger } from "../utils/logger";
import { ResponseUtil } from "../utils/response";

export class OtherExpenseController {
  private otherExpenseService: OtherExpenseService;

  constructor() {
    this.otherExpenseService = new OtherExpenseService();
  }

  // GET /api/expenses
  getExpenses = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info("Fetching expenses", {
        userId: (req as any).user.id,
        query: req.query,
      });

      const user = (req as any).user;
      const {
        page = 1,
        limit = 10,
        sortBy = "createdAt",
        sortOrder = "desc",
        expensesName,
        startDate,
        endDate,
        userId,
        isActive = true,
      } = req.query;

      const filters: ExpenseFilters = {
        page: Number(page),
        limit: Number(limit),
        sortBy: sortBy as string,
        sortOrder: sortOrder as "asc" | "desc",
        expensesName: expensesName as string,
        startDate: startDate as string,
        endDate: endDate as string,
        userId: userId as string,
        isActive: isActive === "true",
      };

      const result = await this.otherExpenseService.getExpensesByOrganization(
        user.organizationId,
        filters
      );

      const pagination = {
        currentPage: Number(page),
        totalPages: Math.ceil(result.total / Number(limit)),
        totalItems: result.total,
        pageSize: Number(limit),
      };

      ResponseUtil.success(
        res,
        {
          expenses: result.expenses,
          pagination,
        },
        "Expenses retrieved successfully"
      );
      logger.info("Expenses retrieved successfully", {
        userId: (req as any).user.id,
      });
    } catch (error: any) {
      logger.error("Failed to retrieve expenses", {
        error: error instanceof Error ? error.message : error,
      });
      ResponseUtil.error(res, "Failed to retrieve expenses", 500);
    }
  };

  // POST /api/expenses
  createExpense = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info("Creating expense", {
        userId: (req as any).user.id,
        body: req.body,
      });

      const user = (req as any).user;
      const { expensesName, amount, others, notes } = req.body;

      // Validate required fields
      if (!expensesName || !amount) {
        ResponseUtil.badRequest(res, "Expenses name and amount are required");
        return;
      }

      // Validate amount is a positive number
      const numericAmount = Number(amount);
      if (isNaN(numericAmount) || numericAmount <= 0) {
        ResponseUtil.badRequest(res, "Amount must be a positive number");
        return;
      }

      const expense = await this.otherExpenseService.createExpense(
        {
          expensesName,
          amount: numericAmount,
          others,
          notes,
          // Date is automatically set to current date in the backend
        },
        user.id,
        user.organizationId
      );

      ResponseUtil.success(
        res,
        { expense },
        "Expense created successfully",
        201
      );
      logger.info("Expense created successfully", {
        userId: (req as any).user.id,
      });
    } catch (error: any) {
      logger.error("Failed to create expense", {
        error: error instanceof Error ? error.message : error,
      });
      ResponseUtil.error(res, "Failed to create expense", 500);
    }
  };

  // GET /api/expenses
  getExpenseSummary = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info("Fetching expense summary", {
        userId: (req as any).user.id,
        query: req.query,
      });

      const user = (req as any).user;
      const { startDate, endDate } = req.query;

      const summary = await this.otherExpenseService.getExpenseSummary(
        user.organizationId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );

      ResponseUtil.success(
        res,
        {
          totalAmount: summary.totalAmount,
          totalCount: summary.totalExpenses,
          expenses: summary.expenses,
        },
        "Expense summary retrieved successfully"
      );
      logger.info("Expense summary retrieved successfully", {
        userId: (req as any).user.id,
      });
    } catch (error: any) {
      logger.error("Failed to retrieve expense summary", {
        error: error instanceof Error ? error.message : error,
      });
      ResponseUtil.error(res, "Failed to retrieve expense summary", 500);
    }
  };

  // GET /api/expenses/:id
  getExpenseById = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info("Fetching expense by ID", {
        userId: (req as any).user.id,
        expenseId: req.params.id,
      });

      const user = (req as any).user;
      const { id } = req.params;

      const expense = await this.otherExpenseService.getExpenseById(id);
      if (!expense) {
        ResponseUtil.notFound(res, "Expense not found");
        return;
      }

      // Check ownership
      const isOwner = await this.otherExpenseService.validateExpenseOwnership(
        id,
        user.organizationId
      );
      if (!isOwner) {
        ResponseUtil.forbidden(res, "Access denied");
        return;
      }

      ResponseUtil.success(res, { expense }, "Expense retrieved successfully");
      logger.info("Expense retrieved successfully", {
        userId: (req as any).user.id,
      });
    } catch (error: any) {
      logger.error("Failed to retrieve expense", {
        error: error instanceof Error ? error.message : error,
      });
      ResponseUtil.error(res, "Failed to retrieve expense", 500);
    }
  };

  // PUT /api/expenses/:id
  updateExpense = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info("Updating expense", {
        userId: (req as any).user.id,
        expenseId: req.params.id,
        body: req.body,
      });

      const user = (req as any).user;
      const { id } = req.params;
      const { expensesName, amount, others, notes } = req.body;

      // Check ownership
      const isOwner = await this.otherExpenseService.validateExpenseOwnership(
        id,
        user.organizationId
      );
      if (!isOwner) {
        ResponseUtil.notFound(res, "Expense not found");
        return;
      }

      const expense = await this.otherExpenseService.updateExpense(id, {
        expensesName,
        amount: amount ? Number(amount) : undefined,
        others,
        notes,
      });

      ResponseUtil.success(res, { expense }, "Expense updated successfully");
      logger.info("Expense updated successfully", {
        userId: (req as any).user.id,
      });
    } catch (error: any) {
      logger.error("Failed to update expense", {
        error: error instanceof Error ? error.message : error,
      });
      ResponseUtil.error(res, "Failed to update expense", 500);
    }
  };

  // DELETE /api/expenses/:id
  deleteExpense = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info("Deleting expense", {
        userId: (req as any).user.id,
        expenseId: req.params.id,
      });

      const user = (req as any).user;
      const { id } = req.params;

      // Check ownership
      const isOwner = await this.otherExpenseService.validateExpenseOwnership(
        id,
        user.organizationId
      );
      if (!isOwner) {
        ResponseUtil.notFound(res, "Expense not found");
        return;
      }

      await this.otherExpenseService.deleteExpense(id);

      ResponseUtil.success(res, null, "Expense deleted successfully");
      logger.info("Expense deleted successfully", {
        userId: (req as any).user.id,
      });
    } catch (error: any) {
      logger.error("Failed to delete expense", {
        error: error instanceof Error ? error.message : error,
      });
      ResponseUtil.error(res, "Failed to delete expense", 500);
    }
  };

  // GET /api/expenses/types
  getExpenseTypes = async (req: Request, res: Response): Promise<void> => {
    try {
      logger.info("Fetching expense types", { userId: (req as any).user.id });

      const user = (req as any).user;

      const types = await this.otherExpenseService.getExpenseTypes(
        user.organizationId
      );

      ResponseUtil.success(
        res,
        {
          expenseTypes: types,
        },
        "Expense types retrieved successfully"
      );
      logger.info("Expense types retrieved successfully", {
        userId: (req as any).user.id,
      });
    } catch (error: any) {
      logger.error("Failed to retrieve expense types", {
        error: error instanceof Error ? error.message : error,
      });
      ResponseUtil.error(res, "Failed to retrieve expense types", 500);
    }
  };
}
