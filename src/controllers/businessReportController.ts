import { Response } from 'express';
import moment from 'moment';
import { ReportService } from '../services/reportService';
import { OrganizationService } from '../services/organizationService';
import { AuthenticatedRequest } from '../types';
import { ResponseUtil } from '../utils/response';

export class ReportController {
  private reportService: ReportService;
  private organizationService: OrganizationService;

  constructor() {
    this.reportService = new ReportService();
    this.organizationService = new OrganizationService();
  }

  generatePdfReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { startDate, endDate, organizationId } = req.query;

      if (!startDate || !endDate) {
        ResponseUtil.badRequest(res, "Start date and end date are required");
        return;
      }

      if (!organizationId) {
        ResponseUtil.badRequest(res, "Organization ID is required");
        return;
      }

      // Validate date format
      if (!moment(startDate as string, 'YYYY-MM-DD', true).isValid() ||
          !moment(endDate as string, 'YYYY-MM-DD', true).isValid()) {
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
        organizationId as string,
        startDate as string,
        endDate as string
      );

      // Generate PDF
      const pdfBuffer = await this.reportService.generatePdfReport(reportData);

      // Set response headers
      const filename = `${reportData.organization.name}_Report_${start.format('YYYY-MM-DD')}_to_${end.format('YYYY-MM-DD')}.pdf`;
      
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);

      // Send PDF
      res.send(pdfBuffer);

    } catch (error: any) {
      console.error('PDF report generation error:', error);
      ResponseUtil.error(res, error.message);
    }
  };

  generateCsvReport = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const { startDate, endDate, type, organizationId } = req.query;

      if (!startDate || !endDate) {
        ResponseUtil.badRequest(res, "Start date and end date are required");
        return;
      }

      if (!organizationId) {
        ResponseUtil.badRequest(res, "Organization ID is required");
        return;
      }

      if (!type || !['sales', 'rawstone', 'expenses', 'all'].includes(type as string)) {
        ResponseUtil.badRequest(res, "Invalid type. Use 'sales', 'rawstone', 'expenses', or 'all'");
        return;
      }

      // Validate date format
      if (!moment(startDate as string, 'YYYY-MM-DD', true).isValid() ||
          !moment(endDate as string, 'YYYY-MM-DD', true).isValid()) {
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
        organizationId as string,
        startDate as string,
        endDate as string
      );

      const csvReports = await this.reportService.generateCsvReports(reportData);

      const requestedType = type as string;
      let csvContent = '';
      let filename = '';

      switch (requestedType) {
        case 'sales':
          csvContent = csvReports.salesCsv;
          filename = `${reportData.organization.name}_Sales_${start.format('YYYY-MM-DD')}_to_${end.format('YYYY-MM-DD')}.csv`;
          break;
        case 'rawstone':
          csvContent = csvReports.rawStoneCsv;
          filename = `${reportData.organization.name}_RawStone_${start.format('YYYY-MM-DD')}_to_${end.format('YYYY-MM-DD')}.csv`;
          break;
        case 'expenses':
          csvContent = csvReports.expensesCsv;
          filename = `${reportData.organization.name}_Expenses_${start.format('YYYY-MM-DD')}_to_${end.format('YYYY-MM-DD')}.csv`;
          break;
        case 'all':
          // Combine all CSV reports
          csvContent = `SALES TRANSACTIONS\n${csvReports.salesCsv}\n\nRAW STONE PURCHASES\n${csvReports.rawStoneCsv}\n\nEXPENSES\n${csvReports.expensesCsv}`;
          filename = `${reportData.organization.name}_Complete_Report_${start.format('YYYY-MM-DD')}_to_${end.format('YYYY-MM-DD')}.csv`;
          break;
      }

      // Set response headers
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', Buffer.byteLength(csvContent, 'utf8'));

      // Send CSV
      res.send(csvContent);

    } catch (error: any) {
      console.error('CSV report generation error:', error);
      ResponseUtil.error(res, error.message);
    }
  };

  getReportSummary = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user || !req.organizationId) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return ResponseUtil.badRequest(res, "Start date and end date are required");
      }

      // Validate date format
      if (!moment(startDate as string, 'YYYY-MM-DD', true).isValid() ||
          !moment(endDate as string, 'YYYY-MM-DD', true).isValid()) {
        return ResponseUtil.badRequest(res, "Invalid date format. Use YYYY-MM-DD");
      }

      // Validate date range
      const start = moment(startDate as string);
      const end = moment(endDate as string);
      
      if (end.isBefore(start)) {
        return ResponseUtil.badRequest(res, "End date cannot be before start date");
      }

      // Generate report data (summary only)
      const reportData = await this.reportService.generateReportData(
        req.organizationId,
        startDate as string,
        endDate as string
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
            expenses: reportData.expenses.length
          }
        },
        "Report summary retrieved successfully"
      );

    } catch (error: any) {
      console.error('Report summary error:', error);
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
          startDate: today.format('YYYY-MM-DD'),
          endDate: today.format('YYYY-MM-DD')
        },
        {
          label: "This Week",
          startDate: today.clone().startOf('week').format('YYYY-MM-DD'),
          endDate: today.clone().endOf('week').format('YYYY-MM-DD')
        },
        {
          label: "This Month",
          startDate: today.clone().startOf('month').format('YYYY-MM-DD'),
          endDate: today.clone().endOf('month').format('YYYY-MM-DD')
        },
        {
          label: "Last Month",
          startDate: today.clone().subtract(1, 'month').startOf('month').format('YYYY-MM-DD'),
          endDate: today.clone().subtract(1, 'month').endOf('month').format('YYYY-MM-DD')
        },
        {
          label: "Last 3 Months",
          startDate: today.clone().subtract(3, 'months').startOf('month').format('YYYY-MM-DD'),
          endDate: today.clone().endOf('month').format('YYYY-MM-DD')
        },
        {
          label: "This Year",
          startDate: today.clone().startOf('year').format('YYYY-MM-DD'),
          endDate: today.clone().endOf('year').format('YYYY-MM-DD')
        }
      ];

      return ResponseUtil.success(
        res,
        { availableRanges },
        "Available date ranges retrieved successfully"
      );

    } catch (error: any) {
      console.error('Available date ranges error:', error);
      return ResponseUtil.error(res, error.message);
    }
  };
}
