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

export interface TimezoneAwareDateRange extends DateRange {
  userTimezone: string;
  utcStartDate: Date;
  utcEndDate: Date;
}

export class DateFilterUtil {
  /**
   * Get timezone-aware date range that converts user's local time to UTC for database queries
   */
  static getTimezoneAwareDateRange(
    filterType: DateFilterType,
    timezone: string = "UTC",
    customStart?: string,
    customEnd?: string
  ): TimezoneAwareDateRange {
    // Get date range in user's timezone
    const localDateRange = this.getDateRangeInTimezone(
      filterType,
      timezone,
      customStart,
      customEnd
    );

    // Convert to UTC for database queries
    const utcStartDate = this.convertToUTC(localDateRange.startDate, timezone);
    const utcEndDate = this.convertToUTC(localDateRange.endDate, timezone);

    return {
      startDate: localDateRange.startDate,
      endDate: localDateRange.endDate,
      userTimezone: timezone,
      utcStartDate,
      utcEndDate,
    };
  }

  /**
   * Convert a date from user timezone to UTC for database queries
   */
  private static convertToUTC(date: Date, timezone: string): Date {
    if (timezone === "UTC") {
      return new Date(date);
    }

    // For Asia/Kolkata (UTC+5:30), we need to subtract 5:30 to get UTC
    // When user says "2025-08-14 00:00:00" in IST, it should become "2025-08-13 18:30:00" in UTC

    const timezoneOffsets: { [key: string]: number } = {
      "Asia/Kolkata": 5.5 * 60 * 60 * 1000, // +5:30 in milliseconds
      "Asia/Delhi": 5.5 * 60 * 60 * 1000, // +5:30 in milliseconds
      UTC: 0,
      "America/New_York": -5 * 60 * 60 * 1000, // EST (simplified)
      "Europe/London": 0, // GMT (simplified)
    };

    const offsetMs = timezoneOffsets[timezone] || 0;

    // Subtract the timezone offset to convert to UTC
    return new Date(date.getTime() - offsetMs);
  }

  /**
   * Get timezone offset in milliseconds
   */
  private static getTimezoneOffset(timezone: string): number {
    const now = new Date();
    const utc = new Date(now.toLocaleString("en-US", { timeZone: "UTC" }));
    const target = new Date(
      now.toLocaleString("en-US", { timeZone: timezone })
    );
    return target.getTime() - utc.getTime();
  }

  /**
   * Get date range in specific timezone
   */
  private static getDateRangeInTimezone(
    filterType: DateFilterType,
    timezone: string,
    customStart?: string,
    customEnd?: string
  ): DateRange {
    // Get current time in user's timezone
    const now = new Date();
    const userNow = new Date(
      now.toLocaleString("en-US", { timeZone: timezone })
    );
    const today = new Date(
      userNow.getFullYear(),
      userNow.getMonth(),
      userNow.getDate()
    );

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
        const currentDay = userNow.getDay();
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
        const currentDay = userNow.getDay();
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
        const startOfMonth = new Date(
          userNow.getFullYear(),
          userNow.getMonth(),
          1
        );
        startOfMonth.setHours(0, 0, 0, 0);

        const endOfMonth = new Date(
          userNow.getFullYear(),
          userNow.getMonth() + 1,
          0
        );
        endOfMonth.setHours(23, 59, 59, 999);

        return {
          startDate: startOfMonth,
          endDate: endOfMonth,
        };
      }

      case "last_month": {
        const startOfLastMonth = new Date(
          userNow.getFullYear(),
          userNow.getMonth() - 1,
          1
        );
        startOfLastMonth.setHours(0, 0, 0, 0);

        const endOfLastMonth = new Date(
          userNow.getFullYear(),
          userNow.getMonth(),
          0
        );
        endOfLastMonth.setHours(23, 59, 59, 999);

        return {
          startDate: startOfLastMonth,
          endDate: endOfLastMonth,
        };
      }

      case "this_year": {
        const startOfYear = new Date(userNow.getFullYear(), 0, 1);
        startOfYear.setHours(0, 0, 0, 0);

        const endOfYear = new Date(userNow.getFullYear(), 11, 31);
        endOfYear.setHours(23, 59, 59, 999);

        return {
          startDate: startOfYear,
          endDate: endOfYear,
        };
      }

      case "last_7_days": {
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 6);
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
        thirtyDaysAgo.setDate(today.getDate() - 29);
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

        // Parse custom dates in user's timezone
        // For Asia/Kolkata (UTC+5:30), when user says "2025-08-14"
        // We want to create Date objects that represent:
        // - Start: 2025-08-14 00:00:00 in Asia/Kolkata timezone
        // - End: 2025-08-14 23:59:59 in Asia/Kolkata timezone

        const customStartParts = customStart.split("-").map(Number);
        const customEndParts = customEnd.split("-").map(Number);

        // Create date objects in UTC that represent the desired time in the target timezone
        // For example, if user wants Aug 14 00:00 in IST, we need to create a UTC date that shows as that time in IST
        const startYear = customStartParts[0];
        const startMonth = customStartParts[1] - 1; // Month is 0-based
        const startDay = customStartParts[2];

        // Create dates as if they were in UTC first, then we'll adjust them
        let customStartDate = new Date(
          Date.UTC(startYear, startMonth, startDay, 0, 0, 0, 0)
        );

        // For end date, if it's the same as start date or next day, treat as single day
        // If endDate is next day, it means "only the start day"
        let customEndDate: Date;

        const startDate = new Date(
          customStartParts[0],
          customStartParts[1] - 1,
          customStartParts[2]
        );
        const endDateTest = new Date(
          customEndParts[0],
          customEndParts[1] - 1,
          customEndParts[2]
        );
        const daysDiff =
          (endDateTest.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000);

        if (daysDiff === 1) {
          // Single day filter: endDate is next day, so we want only the start day
          customEndDate = new Date(
            Date.UTC(startYear, startMonth, startDay, 23, 59, 59, 999)
          );
        } else {
          // Multi-day filter: include up to the end of the specified end date
          const endYear = customEndParts[0];
          const endMonth = customEndParts[1] - 1;
          const endDay = customEndParts[2];
          customEndDate = new Date(
            Date.UTC(endYear, endMonth, endDay, 23, 59, 59, 999)
          );
        }

        return {
          startDate: customStartDate,
          endDate: customEndDate,
        };

      default:
        throw new Error(`Unsupported date filter type: ${filterType}`);
    }
  }

  /**
   * Get date range based on filter type (backwards compatibility)
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
   * Format timezone-aware date range for display
   */
  static formatTimezoneAwareDateRange(
    filterType: DateFilterType,
    dateRange: TimezoneAwareDateRange
  ): string {
    const formatDate = (date: Date, timezone: string) => {
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        timeZone: timezone,
      });
    };

    const formatTime = (date: Date, timezone: string) => {
      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: timezone,
      });
    };

    const timezoneDisplay =
      dateRange.userTimezone === "UTC" ? "UTC" : `${dateRange.userTimezone}`;

    switch (filterType) {
      case "today":
        return `Today in ${timezoneDisplay} (${formatDate(
          dateRange.startDate,
          dateRange.userTimezone
        )})`;
      case "yesterday":
        return `Yesterday in ${timezoneDisplay} (${formatDate(
          dateRange.startDate,
          dateRange.userTimezone
        )})`;
      case "this_week":
        return `This Week in ${timezoneDisplay} (${formatDate(
          dateRange.startDate,
          dateRange.userTimezone
        )} - ${formatDate(dateRange.endDate, dateRange.userTimezone)})`;
      case "last_week":
        return `Last Week in ${timezoneDisplay} (${formatDate(
          dateRange.startDate,
          dateRange.userTimezone
        )} - ${formatDate(dateRange.endDate, dateRange.userTimezone)})`;
      case "this_month":
        return `This Month in ${timezoneDisplay} (${formatDate(
          dateRange.startDate,
          dateRange.userTimezone
        )} - ${formatDate(dateRange.endDate, dateRange.userTimezone)})`;
      case "last_month":
        return `Last Month in ${timezoneDisplay} (${formatDate(
          dateRange.startDate,
          dateRange.userTimezone
        )} - ${formatDate(dateRange.endDate, dateRange.userTimezone)})`;
      case "this_year":
        return `This Year in ${timezoneDisplay} (${formatDate(
          dateRange.startDate,
          dateRange.userTimezone
        )} - ${formatDate(dateRange.endDate, dateRange.userTimezone)})`;
      case "last_7_days":
        return `Last 7 Days in ${timezoneDisplay} (${formatDate(
          dateRange.startDate,
          dateRange.userTimezone
        )} - ${formatDate(dateRange.endDate, dateRange.userTimezone)})`;
      case "last_30_days":
        return `Last 30 Days in ${timezoneDisplay} (${formatDate(
          dateRange.startDate,
          dateRange.userTimezone
        )} - ${formatDate(dateRange.endDate, dateRange.userTimezone)})`;
      case "custom":
        return `Custom Range in ${timezoneDisplay} (${formatDate(
          dateRange.startDate,
          dateRange.userTimezone
        )} - ${formatDate(dateRange.endDate, dateRange.userTimezone)})`;
      default:
        return `${formatDate(
          dateRange.startDate,
          dateRange.userTimezone
        )} - ${formatDate(
          dateRange.endDate,
          dateRange.userTimezone
        )} (${timezoneDisplay})`;
    }
  }

  /**
   * Validate timezone
   */
  static validateTimezone(timezone: string): boolean {
    try {
      // Test if timezone is valid by trying to use it
      new Date().toLocaleString("en-US", { timeZone: timezone });
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Format date range for display (backwards compatibility)
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
   * Validate date filter parameters with timezone support
   */
  static validateDateFilterWithTimezone(
    filterType: string,
    timezone?: string,
    customStart?: string,
    customEnd?: string
  ): { filterType: DateFilterType; timezone: string } {
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

    // Default to UTC if no timezone provided
    const validatedTimezone = timezone || "UTC";

    // Validate timezone
    if (!this.validateTimezone(validatedTimezone)) {
      throw new Error(
        `Invalid timezone: ${validatedTimezone}. Please provide a valid IANA timezone identifier (e.g., 'Asia/Kolkata', 'America/New_York')`
      );
    }

    return {
      filterType: filterType as DateFilterType,
      timezone: validatedTimezone,
    };
  }

  /**
   * Validate date filter parameters (backwards compatibility)
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
