import { DateFilterType, DateRange } from "./dateFilters";

/**
 * Enhanced timezone-aware date filter utilities
 * Handles client timezone and UTC storage properly
 */
export class TimezoneAwareDateFilter {
  /**
   * Get date range based on filter type with timezone awareness
   * @param filterType - Type of date filter
   * @param customStart - Custom start date string (YYYY-MM-DD)
   * @param customEnd - Custom end date string (YYYY-MM-DD)
   * @param clientTimezone - Client timezone (e.g., 'Asia/Kolkata', 'America/New_York')
   */
  static getDateRange(
    filterType: DateFilterType,
    customStart?: string,
    customEnd?: string,
    clientTimezone: string = "UTC"
  ): DateRange {
    // Get current date in client timezone
    const now = new Date();
    const clientNow = new Date(
      now.toLocaleString("en-US", { timeZone: clientTimezone })
    );

    // Create date in client timezone then convert to UTC for storage
    const createClientDate = (
      year: number,
      month: number,
      date: number,
      hour = 0,
      minute = 0,
      second = 0,
      ms = 0
    ): Date => {
      // Create date string in client timezone
      const localDateStr = `${year}-${(month + 1)
        .toString()
        .padStart(2, "0")}-${date.toString().padStart(2, "0")}T${hour
        .toString()
        .padStart(2, "0")}:${minute.toString().padStart(2, "0")}:${second
        .toString()
        .padStart(2, "0")}.${ms.toString().padStart(3, "0")}`;

      // Parse as if it's in the client timezone
      const tempDate = new Date(localDateStr);

      // Get timezone offset for the client timezone
      const clientOffset = this.getTimezoneOffset(clientTimezone);
      const localOffset = tempDate.getTimezoneOffset();

      // Adjust to get UTC equivalent of client timezone date
      const utcDate = new Date(
        tempDate.getTime() + localOffset * 60000 - clientOffset * 60000
      );

      return utcDate;
    };

    switch (filterType) {
      case "today": {
        const startOfDay = createClientDate(
          clientNow.getFullYear(),
          clientNow.getMonth(),
          clientNow.getDate(),
          0,
          0,
          0,
          0
        );
        const endOfDay = createClientDate(
          clientNow.getFullYear(),
          clientNow.getMonth(),
          clientNow.getDate(),
          23,
          59,
          59,
          999
        );
        return {
          startDate: startOfDay,
          endDate: endOfDay,
        };
      }

      case "yesterday": {
        const yesterday = new Date(clientNow);
        yesterday.setDate(clientNow.getDate() - 1);
        const startOfDay = createClientDate(
          yesterday.getFullYear(),
          yesterday.getMonth(),
          yesterday.getDate(),
          0,
          0,
          0,
          0
        );
        const endOfDay = createClientDate(
          yesterday.getFullYear(),
          yesterday.getMonth(),
          yesterday.getDate(),
          23,
          59,
          59,
          999
        );
        return {
          startDate: startOfDay,
          endDate: endOfDay,
        };
      }

      case "this_week": {
        const currentDay = clientNow.getDay(); // 0 = Sunday
        const startOfWeek = new Date(clientNow);
        startOfWeek.setDate(clientNow.getDate() - currentDay);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        return {
          startDate: createClientDate(
            startOfWeek.getFullYear(),
            startOfWeek.getMonth(),
            startOfWeek.getDate(),
            0,
            0,
            0,
            0
          ),
          endDate: createClientDate(
            endOfWeek.getFullYear(),
            endOfWeek.getMonth(),
            endOfWeek.getDate(),
            23,
            59,
            59,
            999
          ),
        };
      }

      case "last_week": {
        const currentDay = clientNow.getDay();
        const startOfLastWeek = new Date(clientNow);
        startOfLastWeek.setDate(clientNow.getDate() - currentDay - 7);
        const endOfLastWeek = new Date(startOfLastWeek);
        endOfLastWeek.setDate(startOfLastWeek.getDate() + 6);
        return {
          startDate: createClientDate(
            startOfLastWeek.getFullYear(),
            startOfLastWeek.getMonth(),
            startOfLastWeek.getDate(),
            0,
            0,
            0,
            0
          ),
          endDate: createClientDate(
            endOfLastWeek.getFullYear(),
            endOfLastWeek.getMonth(),
            endOfLastWeek.getDate(),
            23,
            59,
            59,
            999
          ),
        };
      }

      case "this_month": {
        const startOfMonth = createClientDate(
          clientNow.getFullYear(),
          clientNow.getMonth(),
          1,
          0,
          0,
          0,
          0
        );
        const endOfMonth = createClientDate(
          clientNow.getFullYear(),
          clientNow.getMonth() + 1,
          0,
          23,
          59,
          59,
          999
        );
        return {
          startDate: startOfMonth,
          endDate: endOfMonth,
        };
      }

      case "last_month": {
        const startOfLastMonth = createClientDate(
          clientNow.getFullYear(),
          clientNow.getMonth() - 1,
          1,
          0,
          0,
          0,
          0
        );
        const endOfLastMonth = createClientDate(
          clientNow.getFullYear(),
          clientNow.getMonth(),
          0,
          23,
          59,
          59,
          999
        );
        return {
          startDate: startOfLastMonth,
          endDate: endOfLastMonth,
        };
      }

      case "this_year": {
        const startOfYear = createClientDate(
          clientNow.getFullYear(),
          0,
          1,
          0,
          0,
          0,
          0
        );
        const endOfYear = createClientDate(
          clientNow.getFullYear(),
          11,
          31,
          23,
          59,
          59,
          999
        );
        return {
          startDate: startOfYear,
          endDate: endOfYear,
        };
      }

      case "last_7_days": {
        const sevenDaysAgo = new Date(clientNow);
        sevenDaysAgo.setDate(clientNow.getDate() - 6); // Including today = 7 days
        return {
          startDate: createClientDate(
            sevenDaysAgo.getFullYear(),
            sevenDaysAgo.getMonth(),
            sevenDaysAgo.getDate(),
            0,
            0,
            0,
            0
          ),
          endDate: createClientDate(
            clientNow.getFullYear(),
            clientNow.getMonth(),
            clientNow.getDate(),
            23,
            59,
            59,
            999
          ),
        };
      }

      case "last_30_days": {
        const thirtyDaysAgo = new Date(clientNow);
        thirtyDaysAgo.setDate(clientNow.getDate() - 29); // Including today = 30 days
        return {
          startDate: createClientDate(
            thirtyDaysAgo.getFullYear(),
            thirtyDaysAgo.getMonth(),
            thirtyDaysAgo.getDate(),
            0,
            0,
            0,
            0
          ),
          endDate: createClientDate(
            clientNow.getFullYear(),
            clientNow.getMonth(),
            clientNow.getDate(),
            23,
            59,
            59,
            999
          ),
        };
      }

      case "custom": {
        if (!customStart || !customEnd) {
          throw new Error(
            "Custom date range requires both startDate and endDate"
          );
        }

        // Parse custom dates (assuming they are in YYYY-MM-DD format from client timezone)
        const [startYear, startMonth, startDay] = customStart
          .split("-")
          .map(Number);
        const [endYear, endMonth, endDay] = customEnd.split("-").map(Number);

        return {
          startDate: createClientDate(
            startYear,
            startMonth - 1,
            startDay,
            0,
            0,
            0,
            0
          ),
          endDate: createClientDate(
            endYear,
            endMonth - 1,
            endDay,
            23,
            59,
            59,
            999
          ),
        };
      }

      default:
        throw new Error(`Unsupported date filter type: ${filterType}`);
    }
  }

  /**
   * Get timezone offset in minutes for a given timezone
   */
  private static getTimezoneOffset(timezone: string): number {
    const now = new Date();
    const utc = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
    const local = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
    return (utc.getTime() - local.getTime()) / (1000 * 60);
  }

  /**
   * Format date for display in client timezone
   */
  static formatDateForClient(
    date: Date,
    clientTimezone: string = "UTC"
  ): string {
    return date.toLocaleDateString("en-US", {
      timeZone: clientTimezone,
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }

  /**
   * Format date range for display in client timezone
   */
  static formatDateRangeForClient(
    filterType: DateFilterType,
    dateRange: DateRange,
    clientTimezone: string = "UTC"
  ): string {
    const formatDate = (date: Date) =>
      this.formatDateForClient(date, clientTimezone);

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
   * Validate and parse date string in client timezone
   */
  static validateDateString(dateString: string, paramName: string): void {
    if (!dateString) {
      throw new Error(`${paramName} is required`);
    }

    // Check if it's in YYYY-MM-DD format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateString)) {
      throw new Error(`${paramName} must be in YYYY-MM-DD format`);
    }

    // Check if it's a valid date
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      throw new Error(`${paramName} is not a valid date`);
    }
  }

  /**
   * Get common timezone mappings for easier client integration
   */
  static getCommonTimezones(): Record<string, string> {
    return {
      IST: "Asia/Kolkata", // Indian Standard Time
      UTC: "UTC", // Coordinated Universal Time
      EST: "America/New_York", // Eastern Standard Time
      PST: "America/Los_Angeles", // Pacific Standard Time
      CST: "America/Chicago", // Central Standard Time
      JST: "Asia/Tokyo", // Japan Standard Time
      GMT: "Europe/London", // Greenwich Mean Time
      CET: "Europe/Paris", // Central European Time
      AEST: "Australia/Sydney", // Australian Eastern Standard Time
    };
  }

  /**
   * Convert UTC date back to client timezone for display
   */
  static convertUTCToClientTimezone(
    utcDate: Date,
    clientTimezone: string
  ): Date {
    return new Date(
      utcDate.toLocaleString("en-US", { timeZone: clientTimezone })
    );
  }
}
