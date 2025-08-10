export type DateFilterType =
  | "today"
  | "yesterday"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "this_year"
  | "last_7_days"
  | "last_30_days"
  | "custom";

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export class DateFilterUtil {
  /**
   * Get date range based on filter type
   */
  static getDateRange(
    filterType: DateFilterType,
    customStart?: string,
    customEnd?: string
  ): DateRange {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    switch (filterType) {
      case "today":
        return {
          startDate: new Date(today.getTime()),
          endDate: new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1),
        };

      case "yesterday":
        const yesterday = new Date(today);
        yesterday.setDate(today.getDate() - 1);
        return {
          startDate: new Date(yesterday.getTime()),
          endDate: new Date(yesterday.getTime() + 24 * 60 * 60 * 1000 - 1),
        };

      case "this_week": {
        // Week starts on Sunday (0) and ends on Saturday (6)
        const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - currentDay);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        return {
          startDate: startOfWeek,
          endDate: endOfWeek,
        };
      }

      case "last_week": {
        const currentDay = now.getDay();
        const startOfLastWeek = new Date(today);
        startOfLastWeek.setDate(today.getDate() - currentDay - 7);
        startOfLastWeek.setHours(0, 0, 0, 0);

        const endOfLastWeek = new Date(startOfLastWeek);
        endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
        endOfLastWeek.setHours(23, 59, 59, 999);

        return {
          startDate: startOfLastWeek,
          endDate: endOfLastWeek,
        };
      }

      case "this_month": {
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        startOfMonth.setHours(0, 0, 0, 0);

        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endOfMonth.setHours(23, 59, 59, 999);

        return {
          startDate: startOfMonth,
          endDate: endOfMonth,
        };
      }

      case "last_month": {
        const startOfLastMonth = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1
        );
        startOfLastMonth.setHours(0, 0, 0, 0);

        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        endOfLastMonth.setHours(23, 59, 59, 999);

        return {
          startDate: startOfLastMonth,
          endDate: endOfLastMonth,
        };
      }

      case "this_year": {
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        startOfYear.setHours(0, 0, 0, 0);

        const endOfYear = new Date(now.getFullYear(), 11, 31);
        endOfYear.setHours(23, 59, 59, 999);

        return {
          startDate: startOfYear,
          endDate: endOfYear,
        };
      }

      case "last_7_days": {
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 6); // Including today = 7 days
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);

        return {
          startDate: sevenDaysAgo,
          endDate: endDate,
        };
      }

      case "last_30_days": {
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 29); // Including today = 30 days
        thirtyDaysAgo.setHours(0, 0, 0, 0);

        const endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999);

        return {
          startDate: thirtyDaysAgo,
          endDate: endDate,
        };
      }

      case "custom":
        if (!customStart || !customEnd) {
          throw new Error(
            "Custom date range requires both startDate and endDate"
          );
        }

        const customStartDate = new Date(customStart);
        customStartDate.setHours(0, 0, 0, 0);

        const customEndDate = new Date(customEnd);
        customEndDate.setHours(23, 59, 59, 999);

        return {
          startDate: customStartDate,
          endDate: customEndDate,
        };

      default:
        throw new Error(`Unsupported date filter type: ${filterType}`);
    }
  }

  /**
   * Format date range for display
   */
  static formatDateRange(
    filterType: DateFilterType,
    dateRange: DateRange
  ): string {
    const formatDate = (date: Date) => {
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    };

    switch (filterType) {
      case "today":
        return `Today (${formatDate(dateRange.startDate)})`;
      case "yesterday":
        return `Yesterday (${formatDate(dateRange.startDate)})`;
      case "this_week":
        return `This Week (${formatDate(dateRange.startDate)} - ${formatDate(
          dateRange.endDate
        )})`;
      case "last_week":
        return `Last Week (${formatDate(dateRange.startDate)} - ${formatDate(
          dateRange.endDate
        )})`;
      case "this_month":
        return `This Month (${formatDate(dateRange.startDate)} - ${formatDate(
          dateRange.endDate
        )})`;
      case "last_month":
        return `Last Month (${formatDate(dateRange.startDate)} - ${formatDate(
          dateRange.endDate
        )})`;
      case "this_year":
        return `This Year (${formatDate(dateRange.startDate)} - ${formatDate(
          dateRange.endDate
        )})`;
      case "last_7_days":
        return `Last 7 Days (${formatDate(dateRange.startDate)} - ${formatDate(
          dateRange.endDate
        )})`;
      case "last_30_days":
        return `Last 30 Days (${formatDate(dateRange.startDate)} - ${formatDate(
          dateRange.endDate
        )})`;
      case "custom":
        return `Custom Range (${formatDate(dateRange.startDate)} - ${formatDate(
          dateRange.endDate
        )})`;
      default:
        return `${formatDate(dateRange.startDate)} - ${formatDate(
          dateRange.endDate
        )}`;
    }
  }

  /**
   * Validate date filter parameters
   */
  static validateDateFilter(
    filterType: string,
    customStart?: string,
    customEnd?: string
  ): DateFilterType {
    const validTypes: DateFilterType[] = [
      "today",
      "yesterday",
      "this_week",
      "last_week",
      "this_month",
      "last_month",
      "this_year",
      "last_7_days",
      "last_30_days",
      "custom",
    ];

    if (!validTypes.includes(filterType as DateFilterType)) {
      throw new Error(
        `Invalid date filter type. Valid types: ${validTypes.join(", ")}`
      );
    }

    if (filterType === "custom" && (!customStart || !customEnd)) {
      throw new Error(
        "Custom date filter requires both startDate and endDate parameters"
      );
    }

    return filterType as DateFilterType;
  }
}
