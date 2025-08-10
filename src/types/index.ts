import { User } from "@prisma/client";
import { Request } from "express";

// Extend Express Request to include user information
export interface AuthenticatedRequest extends Request {
  user?: User;
  organizationId?: string;
}

// API Response structure
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
  };
}

// Pagination parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// Filter parameters for different entities
export interface UserFilters extends PaginationParams {
  role?: string;
  isActive?: boolean;
  organizationId?: string;
}

export interface TruckEntryFilters extends PaginationParams {
  entryType?: string;
  materialType?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  userId?: string;
}

export interface MaterialRateFilters extends PaginationParams {
  materialType?: string;
  isActive?: boolean;
}

export interface ExpenseFilters extends PaginationParams {
  expensesName?: string;
  startDate?: string;
  endDate?: string;
  userId?: string;
  isActive?: boolean;
}
