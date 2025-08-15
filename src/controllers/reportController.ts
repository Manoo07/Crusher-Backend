import { Response } from "express";
import moment from "moment-timezone";
import { ReportService } from "../services/reportService";
import { AuthenticatedRequest } from "../types";
import { logger } from "../utils/logger";
import { ResponseUtil } from "../utils/response";

export class ReportController {
  private reportService: ReportService;

  constructor() {
    this.reportService = new ReportService();
  }

  generatePdfReport = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    logger.info("PDF report generation request received", {
      userId: req.user?.id,
      organizationId: req.organizationId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    });

    try {
      if (!req.user || !req.organizationId) {
        logger.warn("Unauthorized PDF report generation attempt", {
          userId: req.user?.id,
        });
        ResponseUtil.unauthorized(res, "Authentication required");
        return;
      }

      const { startDate, endDate, timezone } = req.query;

      if (!startDate || !endDate) {
        logger.warn("PDF report generation missing date parameters", {
          userId: req.user.id,
        });
        ResponseUtil.badRequest(res, "Start date and end date are required");
        return;
      }

      // Default to IST if timezone not provided
      const userTimezone = (timezone as string) || "Asia/Kolkata";

      // Validate timezone if provided
      if (timezone) {
        try {
          moment.tz.zone(userTimezone);
        } catch (error) {
          logger.warn("Invalid timezone provided", {
            userId: req.user.id,
            timezone: userTimezone,
          });
          ResponseUtil.badRequest(res, `Invalid timezone: ${userTimezone}`);
          return;
        }
      }

      // Validate date format
      if (
        !moment(startDate as string, "YYYY-MM-DD", true).isValid() ||
        !moment(endDate as string, "YYYY-MM-DD", true).isValid()
      ) {
        logger.warn("PDF report generation invalid date format", {
          userId: req.user.id,
          startDate,
          endDate,
        });
        ResponseUtil.badRequest(res, "Invalid date format. Use YYYY-MM-DD");
        return;
      }

      // Validate date range
      const start = moment(startDate as string);
      const end = moment(endDate as string);

      if (end.isBefore(start)) {
        ResponseUtil.badRequest(res, "End date cannot be before start date");
        return;
      }

      // Generate report data
      const reportData = await this.reportService.generateReportData(
        req.organizationId,
        startDate as string,
        endDate as string,
        userTimezone
      );

      // Generate PDF
      const pdfBuffer = await this.reportService.generatePdfReport(reportData);

      // Set response headers
      const filename = `${reportData.organization.name}_Report_${start.format(
        "YYYY-MM-DD"
      )}_to_${end.format("YYYY-MM-DD")}.pdf`;

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.setHeader("Content-Length", pdfBuffer.length);

      logger.info("PDF report generated successfully", {
        userId: req.user!.id,
        organizationId: req.organizationId,
        filename,
        size: pdfBuffer.length,
      });

      // Send PDF
      res.send(pdfBuffer);
    } catch (error: any) {
      logger.error("PDF report generation error", {
        userId: req.user?.id,
        organizationId: req.organizationId,
        error: error.message,
      });
      ResponseUtil.error(res, error.message);
    }
  };

  generateCsvReport = async (
    req: AuthenticatedRequest,
    res: Response
  ): Promise<void> => {
    logger.info("CSV report generation request received", {
      userId: req.user?.id,
      organizationId: req.organizationId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      type: req.query.type,
    });

    try {
      if (!req.user || !req.organizationId) {
        logger.warn("Unauthorized CSV report generation attempt", {
          userId: req.user?.id,
        });
        ResponseUtil.unauthorized(res, "Authentication required");
        return;
      }

      const { startDate, endDate, type, timezone } = req.query;

      if (!startDate || !endDate) {
        logger.warn("CSV report generation missing date parameters", {
          userId: req.user.id,
        });
        ResponseUtil.badRequest(res, "Start date and end date are required");
        return;
      }

      // Default to IST if timezone not provided
      const userTimezone = (timezone as string) || "Asia/Kolkata";

      // Validate timezone if provided
      if (timezone) {
        try {
          moment.tz.zone(userTimezone);
        } catch (error) {
          logger.warn("Invalid timezone provided", {
            userId: req.user.id,
            timezone: userTimezone,
          });
          ResponseUtil.badRequest(res, `Invalid timezone: ${userTimezone}`);
          return;
        }
      }

      if (
        !type ||
        !["sales", "rawstone", "expenses", "all"].includes(type as string)
      ) {
        ResponseUtil.badRequest(
          res,
          "Invalid type. Use 'sales', 'rawstone', 'expenses', or 'all'"
        );
        return;
      }

      // Validate date format
      if (
        !moment(startDate as string, "YYYY-MM-DD", true).isValid() ||
        !moment(endDate as string, "YYYY-MM-DD", true).isValid()
      ) {
        ResponseUtil.badRequest(res, "Invalid date format. Use YYYY-MM-DD");
        return;
      }

      // Validate date range
      const start = moment(startDate as string);
      const end = moment(endDate as string);

      if (end.isBefore(start)) {
        ResponseUtil.badRequest(res, "End date cannot be before start date");
        return;
      }

      // Generate report data
      const reportData = await this.reportService.generateReportData(
        req.organizationId,
        startDate as string,
        endDate as string,
        userTimezone
      );

      const csvReports = await this.reportService.generateCsvReports(
        reportData
      );

      const requestedType = type as string;
      let csvContent = "";
      let filename = "";

      switch (requestedType) {
        case "sales":
          csvContent = csvReports.salesCsv;
          filename = `${reportData.organization.name}_Sales_${start.format(
            "YYYY-MM-DD"
          )}_to_${end.format("YYYY-MM-DD")}.csv`;
          break;
        case "rawstone":
          csvContent = csvReports.rawStoneCsv;
          filename = `${reportData.organization.name}_RawStone_${start.format(
            "YYYY-MM-DD"
          )}_to_${end.format("YYYY-MM-DD")}.csv`;
          break;
        case "expenses":
          csvContent = csvReports.expensesCsv;
          filename = `${reportData.organization.name}_Expenses_${start.format(
            "YYYY-MM-DD"
          )}_to_${end.format("YYYY-MM-DD")}.csv`;
          break;
        case "all":
          // Combine all CSV reports
          csvContent = `SALES TRANSACTIONS\n${csvReports.salesCsv}\n\nRAW STONE PURCHASES\n${csvReports.rawStoneCsv}\n\nEXPENSES\n${csvReports.expensesCsv}`;
          filename = `${
            reportData.organization.name
          }_Complete_Report_${start.format("YYYY-MM-DD")}_to_${end.format(
            "YYYY-MM-DD"
          )}.csv`;
          break;
      }

      // Set response headers
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
      res.setHeader("Content-Length", Buffer.byteLength(csvContent, "utf8"));

      logger.info("CSV report generated successfully", {
        userId: req.user!.id,
        organizationId: req.organizationId,
        type: type as string,
        filename,
        size: csvContent.length,
      });

      // Send CSV
      res.send(csvContent);
    } catch (error: any) {
      logger.error("CSV report generation error", {
        userId: req.user?.id,
        organizationId: req.organizationId,
        type: req.query.type,
        error: error.message,
      });
      ResponseUtil.error(res, error.message);
    }
  };

  getReportSummary = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user || !req.organizationId) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      const { startDate, endDate, timezone } = req.query;

      if (!startDate || !endDate) {
        return ResponseUtil.badRequest(
          res,
          "Start date and end date are required"
        );
      }

      // Default to IST if timezone not provided
      const userTimezone = (timezone as string) || "Asia/Kolkata";

      // Validate timezone if provided
      if (timezone) {
        try {
          moment.tz.zone(userTimezone);
        } catch (error) {
          return ResponseUtil.badRequest(
            res,
            `Invalid timezone: ${userTimezone}`
          );
        }
      }

      // Validate date format
      if (
        !moment(startDate as string, "YYYY-MM-DD", true).isValid() ||
        !moment(endDate as string, "YYYY-MM-DD", true).isValid()
      ) {
        return ResponseUtil.badRequest(
          res,
          "Invalid date format. Use YYYY-MM-DD"
        );
      }

      // Validate date range
      const start = moment(startDate as string);
      const end = moment(endDate as string);

      if (end.isBefore(start)) {
        return ResponseUtil.badRequest(
          res,
          "End date cannot be before start date"
        );
      }

      // Generate report data (summary only)
      const reportData = await this.reportService.generateReportData(
        req.organizationId,
        startDate as string,
        endDate as string,
        userTimezone
      );

      return ResponseUtil.success(
        res,
        {
          organization: reportData.organization,
          dateRange: reportData.dateRange,
          summary: reportData.summary,
          counts: {
            salesTransactions: reportData.salesEntries.length,
            rawStoneTransactions: reportData.rawStoneEntries.length,
            expenses: reportData.expenses.length,
          },
        },
        "Report summary retrieved successfully"
      );
    } catch (error: any) {
      logger.error("Report summary error", {
        userId: req.user?.id,
        organizationId: req.organizationId,
        error: (error as Error).message,
      });
      return ResponseUtil.error(res, error.message);
    }
  };

  getAvailableDateRanges = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user || !req.organizationId) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      // Get date ranges based on available data
      const today = moment();
      const availableRanges = [
        {
          label: "Today",
          startDate: today.format("YYYY-MM-DD"),
          endDate: today.format("YYYY-MM-DD"),
        },
        {
          label: "This Week",
          startDate: today.clone().startOf("week").format("YYYY-MM-DD"),
          endDate: today.clone().endOf("week").format("YYYY-MM-DD"),
        },
        {
          label: "This Month",
          startDate: today.clone().startOf("month").format("YYYY-MM-DD"),
          endDate: today.clone().endOf("month").format("YYYY-MM-DD"),
        },
        {
          label: "Last Month",
          startDate: today
            .clone()
            .subtract(1, "month")
            .startOf("month")
            .format("YYYY-MM-DD"),
          endDate: today
            .clone()
            .subtract(1, "month")
            .endOf("month")
            .format("YYYY-MM-DD"),
        },
        {
          label: "Last 3 Months",
          startDate: today
            .clone()
            .subtract(3, "months")
            .startOf("month")
            .format("YYYY-MM-DD"),
          endDate: today.clone().endOf("month").format("YYYY-MM-DD"),
        },
        {
          label: "This Year",
          startDate: today.clone().startOf("year").format("YYYY-MM-DD"),
          endDate: today.clone().endOf("year").format("YYYY-MM-DD"),
        },
      ];

      return ResponseUtil.success(
        res,
        { availableRanges },
        "Available date ranges retrieved successfully"
      );
    } catch (error: any) {
      logger.error("Available date ranges error", {
        userId: req.user?.id,
        organizationId: req.organizationId,
        error: (error as Error).message,
      });
      return ResponseUtil.error(res, error.message);
    }
  };
}
