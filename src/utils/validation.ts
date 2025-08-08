import { PaginationParams } from "../types";

export class ValidationUtil {
  static validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  static validateUsername(username: string): {
    isValid: boolean;
    message?: string;
  } {
    if (!username || username.length < 3) {
      return {
        isValid: false,
        message: "Username must be at least 3 characters long",
      };
    }
    if (username.length > 15) {
      return {
        isValid: false,
        message: "Username must not exceed 15 characters",
      };
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return {
        isValid: false,
        message: "Username can only contain letters, numbers, and underscores",
      };
    }
    return { isValid: true };
  }

  static validatePassword(password: string): {
    isValid: boolean;
    message?: string;
  } {
    if (!password || password.length < 6) {
      return {
        isValid: false,
        message: "Password must be at least 6 characters long",
      };
    }
    return { isValid: true };
  }

  static validatePaginationParams(params: any): PaginationParams {
    const page = Math.max(1, parseInt(params.page) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(params.limit) || 10));
    const sortOrder = params.sortOrder === "desc" ? "desc" : "asc";

    return {
      page,
      limit,
      sortBy: params.sortBy || "createdAt",
      sortOrder,
    };
  }

  static validateDateRange(
    startDate?: string,
    endDate?: string
  ): {
    isValid: boolean;
    message?: string;
    parsedStartDate?: Date;
    parsedEndDate?: Date;
  } {
    if (!startDate && !endDate) {
      return { isValid: true };
    }

    let parsedStartDate: Date | undefined;
    let parsedEndDate: Date | undefined;

    if (startDate) {
      parsedStartDate = new Date(startDate);
      if (isNaN(parsedStartDate.getTime())) {
        return { isValid: false, message: "Invalid start date format" };
      }
    }

    if (endDate) {
      parsedEndDate = new Date(endDate);
      if (isNaN(parsedEndDate.getTime())) {
        return { isValid: false, message: "Invalid end date format" };
      }
    }

    if (parsedStartDate && parsedEndDate && parsedStartDate > parsedEndDate) {
      return { isValid: false, message: "Start date must be before end date" };
    }

    return { isValid: true, parsedStartDate, parsedEndDate };
  }

  static validateDecimal(
    value: any,
    fieldName: string,
    min: number = 0
  ): {
    isValid: boolean;
    message?: string;
    value?: number;
  } {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      return { isValid: false, message: `${fieldName} must be a valid number` };
    }
    if (numValue < min) {
      return {
        isValid: false,
        message: `${fieldName} must be at least ${min}`,
      };
    }
    return { isValid: true, value: numValue };
  }
}
