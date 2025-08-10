import { Router } from "express";
import { OtherExpenseController } from "../controllers/otherExpenseController";
import { AuthMiddleware } from "../middlewares/auth";
import { ErrorMiddleware } from "../middlewares/error";
import { ValidationMiddleware } from "../middlewares/validation";

const router = Router();
const otherExpenseController = new OtherExpenseController();

// Apply authentication middleware to all routes
router.use(AuthMiddleware.authenticate);
router.use(AuthMiddleware.requireActiveUser());

// Get expense summary
router.get(
  "/",
  ValidationMiddleware.validateDateRange(),
  ErrorMiddleware.asyncHandler(otherExpenseController.getExpenseSummary)
);

// Get expense types
router.get(
  "/types",
  ErrorMiddleware.asyncHandler(otherExpenseController.getExpenseTypes)
);

// Create expense
router.post(
  "/",
  ValidationMiddleware.validateRequired(["expensesName", "amount"]),
  ErrorMiddleware.asyncHandler(otherExpenseController.createExpense)
);

// Get expense by ID
router.get(
  "/:id",
  ValidationMiddleware.validateUUID("id"),
  ErrorMiddleware.asyncHandler(otherExpenseController.getExpenseById)
);

// Update expense
router.put(
  "/:id",
  ValidationMiddleware.validateUUID("id"),
  ErrorMiddleware.asyncHandler(otherExpenseController.updateExpense)
);

// Delete expense (soft delete)
router.delete(
  "/:id",
  ValidationMiddleware.validateUUID("id"),
  ErrorMiddleware.asyncHandler(otherExpenseController.deleteExpense)
);

export { router as expenseRoutes };
