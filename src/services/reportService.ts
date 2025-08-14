import * as csvWriter from "csv-writer";
import moment from "moment";
import puppeteer from "puppeteer";
import { logger } from "../utils/logger";
import { MaterialRateService } from "./materialRateService";
import { OrganizationService } from "./organizationService";
import { OtherExpenseService } from "./otherExpenseService";
import { TruckEntryService } from "./truckEntryService";

interface DateRange {
  startDate: string;
  endDate: string;
}

interface ReportData {
  organization: any;
  dateRange: DateRange;
  salesEntries: any[];
  rawStoneEntries: any[];
  expenses: any[];
  summary: {
    totalSalesAmount: number;
    totalRawStoneAmount: number;
    totalExpenseAmount: number;
    totalSalesQuantity: number;
    totalRawStoneQuantity: number;
    netProfit: number;
  };
}

export class ReportService {
  private truckEntryService: TruckEntryService;
  private organizationService: OrganizationService;
  private expenseService: OtherExpenseService;
  private materialRateService: MaterialRateService;

  constructor() {
    this.truckEntryService = new TruckEntryService();
    this.organizationService = new OrganizationService();
    this.expenseService = new OtherExpenseService();
    this.materialRateService = new MaterialRateService();
  }

  async generateReportData(
    organizationId: string,
    startDate: string,
    endDate: string
  ): Promise<ReportData> {
    logger.info("Starting report data generation", {
      organizationId,
      startDate,
      endDate,
    });

    try {
      // Get organization details
      logger.info("Fetching organization details", { organizationId });
      const organization = await this.organizationService.getOrganizationById(
        organizationId
      );
      if (!organization) {
        logger.error("Organization not found", { organizationId });
        throw new Error("Organization not found");
      }

      // Get truck entries within date range
      logger.info("Fetching truck entries", {
        organizationId,
        startDate,
        endDate,
      });
      const allEntries =
        await this.truckEntryService.getTruckEntriesByDateRange(
          organizationId,
          startDate,
          endDate
        );

      // Separate Sales and Raw Stone entries
      const salesEntries = allEntries.filter(
        (entry: any) => entry.entryType === "Sales"
      );
      const rawStoneEntries = allEntries.filter(
        (entry: any) => entry.entryType === "RawStone"
      );

      // Get expenses within date range
      const expenses = await this.expenseService.getExpensesByDateRange(
        organizationId,
        startDate,
        endDate
      );

      // Calculate summary - ensuring proper number conversion
      const totalSalesAmount = salesEntries.reduce(
        (sum: number, entry: any) => {
          const amount = parseFloat(entry.totalAmount) || 0;
          return sum + amount;
        },
        0
      );

      const totalRawStoneAmount = rawStoneEntries.reduce(
        (sum: number, entry: any) => {
          const amount = parseFloat(entry.totalAmount) || 0;
          return sum + amount;
        },
        0
      );

      const totalExpenseAmount = expenses.reduce(
        (sum: number, expense: any) => {
          const amount = parseFloat(expense.amount) || 0;
          return sum + amount;
        },
        0
      );

      const totalSalesQuantity = salesEntries.reduce(
        (sum: number, entry: any) => {
          const quantity = parseFloat(entry.units) || 0;
          return sum + quantity;
        },
        0
      );

      const totalRawStoneQuantity = rawStoneEntries.reduce(
        (sum: number, entry: any) => {
          const quantity = parseFloat(entry.units) || 0;
          return sum + quantity;
        },
        0
      );

      // Net profit = Sales - Raw Stone - Expenses
      const netProfit =
        totalSalesAmount - totalRawStoneAmount - totalExpenseAmount;

      const reportData = {
        organization,
        dateRange: { startDate, endDate },
        salesEntries,
        rawStoneEntries,
        expenses,
        summary: {
          totalSalesAmount,
          totalRawStoneAmount,
          totalExpenseAmount,
          totalSalesQuantity,
          totalRawStoneQuantity,
          netProfit,
        },
      };

      logger.info("Report data generation completed successfully", {
        organizationId,
        salesCount: salesEntries.length,
        rawStoneCount: rawStoneEntries.length,
        expenseCount: expenses.length,
        netProfit,
      });

      return reportData;
    } catch (error) {
      logger.error("Error generating report data", {
        organizationId,
        startDate,
        endDate,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  async generatePdfReport(reportData: ReportData): Promise<Buffer> {
    logger.info("Starting PDF report generation", {
      organizationId: reportData.organization?.id,
    });

    // Log environment info for debugging
    logger.info("Environment info for PDF generation", {
      nodeEnv: process.env.NODE_ENV,
      puppeteerExecutablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      platform: process.platform,
      arch: process.arch,
      dockerContainer: process.env.DOCKER_CONTAINER || "unknown",
    });

    let browser;
    try {
      logger.info("Launching Puppeteer browser with optimized Docker settings");

      const launchOptions: any = {
        headless: true, // Fixed: use boolean instead of "new"
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-accelerated-2d-canvas",
          "--no-first-run",
          "--no-zygote",
          "--single-process", // Important for Docker
          "--disable-gpu",
          "--disable-background-timer-throttling",
          "--disable-backgrounding-occluded-windows",
          "--disable-renderer-backgrounding",
          "--disable-features=TranslateUI,VizDisplayCompositor",
          "--disable-crash-reporter",
          "--disable-breakpad",
          "--disable-client-side-phishing-detection",
          "--disable-sync",
          "--disable-default-apps",
          "--hide-scrollbars",
          "--mute-audio",
          "--disable-extensions",
          "--disable-plugins",
          "--memory-pressure-off",
          "--max_old_space_size=4096",
        ],
        timeout: 120000, // Increased timeout
        protocolTimeout: 60000,
      };

      // Use Chrome installed in Docker
      if (process.env.PUPPETEER_EXECUTABLE_PATH) {
        launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
        logger.info("Using specified Chrome executable", {
          path: process.env.PUPPETEER_EXECUTABLE_PATH,
        });
      } else {
        logger.warn("PUPPETEER_EXECUTABLE_PATH not set, using default Chrome");
      }

      browser = await puppeteer.launch(launchOptions);

      const page = await browser.newPage();

      // Optimize page settings
      await page.setViewport({
        width: 1200,
        height: 1600,
        deviceScaleFactor: 1,
      });

      // Set reasonable timeouts
      page.setDefaultTimeout(90000);
      page.setDefaultNavigationTimeout(90000);

      logger.info("Generating PDF HTML content");
      const html = this.generatePdfHTML(reportData);

      await page.setContent(html, {
        waitUntil: "domcontentloaded",
        timeout: 60000,
      });

      logger.info("Converting HTML to PDF");
      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "10mm",
          bottom: "10mm",
          left: "10mm",
          right: "10mm",
        },
        preferCSSPageSize: true,
        displayHeaderFooter: false,
        timeout: 60000,
      });

      logger.info("PDF generated successfully", { size: pdf.length });
      return Buffer.from(pdf);
    } catch (error) {
      logger.error("Error generating PDF", {
        organizationId: reportData.organization?.id,
        error: (error as Error).message,
        stack: (error as Error).stack,
      });

      // Always provide HTML fallback for any PDF generation error
      logger.warn("PDF generation failed, providing HTML fallback report");
      const html = this.generatePdfHTML(reportData);
      const htmlReport = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Report - HTML Version</title>
  <style>
    .fallback-notice { 
      background: #ffeb3b; 
      padding: 15px; 
      text-align: center; 
      margin: 20px 0; 
      border: 2px solid #f57f17;
      border-radius: 5px;
      font-weight: bold;
      color: #333;
    }
    @media print {
      .fallback-notice { display: none; }
    }
  </style>
</head>
<body>
  <div class="fallback-notice">
    ⚠️ <strong>Notice:</strong> PDF generation is temporarily unavailable. 
    This HTML version contains all the same data and can be printed or saved as PDF from your browser/app.
  </div>
  ${html}
</body>
</html>`;
      return Buffer.from(htmlReport, "utf8");
    } finally {
      if (browser) {
        try {
          logger.info("Closing Puppeteer browser");
          await browser.close();
        } catch (closeError) {
          logger.warn("Error closing browser (non-critical)", {
            error: (closeError as Error).message,
          });
        }
      }
    }
  }

  async generateCsvReports(reportData: ReportData): Promise<{
    salesCsv: string;
    rawStoneCsv: string;
    expensesCsv: string;
  }> {
    logger.info("Starting CSV reports generation", {
      organizationId: reportData.organization?.id,
      salesEntries: reportData.salesEntries.length,
      rawStoneEntries: reportData.rawStoneEntries.length,
      expenses: reportData.expenses.length,
    });

    try {
      logger.info("Generating sales CSV");
      const salesCsv = await this.generateEntriesCsv(
        reportData.salesEntries,
        "Sales"
      );

      logger.info("Generating raw stone CSV");
      const rawStoneCsv = await this.generateEntriesCsv(
        reportData.rawStoneEntries,
        "Raw Stone"
      );

      logger.info("Generating expenses CSV");
      const expensesCsv = await this.generateExpensesCsv(reportData.expenses);

      logger.info("CSV reports generated successfully", {
        salesCsvSize: salesCsv.length,
        rawStoneCsvSize: rawStoneCsv.length,
        expensesCsvSize: expensesCsv.length,
      });

      return {
        salesCsv,
        rawStoneCsv,
        expensesCsv,
      };
    } catch (error) {
      logger.error("Error generating CSV reports", {
        organizationId: reportData.organization?.id,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  private async generateEntriesCsv(
    entries: any[],
    type: string
  ): Promise<string> {
    const createCsvWriter = csvWriter.createObjectCsvStringifier;

    const csvStringifier = createCsvWriter({
      header: [
        { id: "date", title: "Date" },
        { id: "vehicleNumber", title: "Vehicle Number" },
        { id: "materialType", title: "Material Type" },
        { id: "quantity", title: "Quantity (Loads)" },
        { id: "rate", title: "Rate per Load" },
        { id: "totalAmount", title: "Total Amount" },
        { id: "customerName", title: "Customer Name" },
        { id: "remarks", title: "Remarks" },
      ],
    });

    const records = entries.map((entry) => ({
      date: moment(entry.createdAt).format("DD/MM/YYYY"),
      vehicleNumber: entry.truckNumber || "",
      materialType: entry.materialType || "",
      quantity: entry.units || 0,
      rate: entry.ratePerUnit || 0,
      totalAmount: entry.totalAmount || 0,
      customerName: entry.truckName || "",
      remarks: entry.notes || "",
    }));

    const header = csvStringifier.getHeaderString();
    const body = csvStringifier.stringifyRecords(records);

    return header + body;
  }

  private async generateExpensesCsv(expenses: any[]): Promise<string> {
    const createCsvWriter = csvWriter.createObjectCsvStringifier;

    const csvStringifier = createCsvWriter({
      header: [
        { id: "date", title: "Date" },
        { id: "description", title: "Description" },
        { id: "amount", title: "Amount" },
        { id: "category", title: "Category" },
        { id: "remarks", title: "Remarks" },
      ],
    });

    const records = expenses.map((expense) => ({
      date: moment(expense.createdAt).format("DD/MM/YYYY"),
      description: expense.others || expense.expensesName || "",
      amount: expense.amount || 0,
      category: expense.expensesName || "",
      remarks: expense.notes || "",
    }));

    const header = csvStringifier.getHeaderString();
    const body = csvStringifier.stringifyRecords(records);

    return header + body;
  }

  private formatCurrency(amount: number): string {
    if (amount >= 100000000) {
      // 10 crores
      return (amount / 10000000).toFixed(1) + " Cr";
    } else if (amount >= 10000000) {
      // 1 crore
      return (amount / 10000000).toFixed(2) + " Cr";
    } else if (amount >= 100000) {
      // 1 lakh
      return (amount / 100000).toFixed(1) + " L";
    } else if (amount >= 1000) {
      // 1 thousand
      return (amount / 1000).toFixed(0) + " K";
    } else {
      return amount.toLocaleString("en-IN");
    }
  }

  private formatFullCurrency(amount: number): string {
    // Handle very large numbers with better formatting
    if (amount >= 10000000000) {
      // 10 billion+
      return (amount / 10000000).toFixed(1) + " Cr";
    } else if (amount >= 1000000000) {
      // 1 billion+
      return (amount / 10000000).toFixed(2) + " Cr";
    } else if (amount >= 100000000) {
      // 100 million+
      return (amount / 10000000).toFixed(1) + " Cr";
    } else if (amount >= 10000000) {
      // 10 million+
      return (amount / 10000000).toFixed(2) + " Cr";
    } else {
      return amount.toLocaleString("en-IN");
    }
  }

  private getAmountClass(amount: number): string {
    // Return CSS class based on amount size
    return amount >= 1000000000 ? "amount amount-large" : "amount";
  }

  private generatePdfHTML(reportData: ReportData): string {
    const {
      organization,
      dateRange,
      salesEntries,
      rawStoneEntries,
      expenses,
      summary,
    } = reportData;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>${organization.name} - Business Report</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', -apple-system, BlinkMacSystemFont, sans-serif;
                color: #1a1a1a;
                line-height: 1.5;
                background: #ffffff;
            }
            
            .container {
                max-width: 100%;
                padding: 0;
                background: white;
            }
            
            /* Header Section */
            .header {
                background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
                color: white;
                padding: 20px 0;
                text-align: center;
                border-bottom: 4px solid #1d4ed8;
            }
            
            .logo-container {
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 16px;
            }
            
            .logo {
                width: 80px;
                height: 80px;
                border-radius: 50%;
                background: white;
                padding: 4px;
                border: 3px solid #1e40af;
            }
            
            .company-name {
                font-size: 32px;
                font-weight: 700;
                margin-top: 8px;
                color: white;
                letter-spacing: 1px;
            }
            
            .report-subtitle {
                font-size: 16px;
                font-weight: 400;
                opacity: 0.9;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-top: 4px;
            }
            
            /* Report Info Section */
            .report-info {
                background: #f8fafc;
                padding: 16px 24px;
                border-bottom: 1px solid #e2e8f0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .date-range {
                font-size: 16px;
                font-weight: 600;
                color: #334155;
            }
            
            .generated-date {
                color: #64748b;
                font-size: 12px;
                font-weight: 500;
            }
            
            /* Summary Section */
            .summary-section {
                padding: 32px 24px;
                background: white;
                border-bottom: 3px solid #e2e8f0;
                margin-bottom: 48px;
            }
            
            .summary-title {
                font-size: 20px;
                font-weight: 700;
                color: #1e293b;
                margin-bottom: 20px;
                padding-bottom: 8px;
                border-bottom: 2px solid #2563eb;
            }
            
            .summary-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 16px;
                margin-bottom: 16px;
            }
            
            .summary-card {
                background: #ffffff;
                border: 2px solid #e2e8f0;
                border-radius: 0;
                padding: 20px;
                border-left: 6px solid #2563eb;
            }
            
            .summary-card.sales {
                border-left-color: #10b981;
            }
            
            .summary-card.rawstone {
                border-left-color: #f59e0b;
            }
            
            .summary-card.expenses {
                border-left-color: #ef4444;
            }
            
            .profit-card {
                grid-column: 1 / -1;
                background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
                color: white;
                text-align: center;
                border: none;
                padding: 20px;
                margin-top: 8px;
            }
            
            .summary-label {
                font-size: 11px;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                margin-bottom: 8px;
                opacity: 0.8;
            }
            
            .summary-value {
                font-size: 18px;
                font-weight: 700;
                line-height: 1.2;
                margin-bottom: 4px;
            }
            
            .summary-quantity {
                font-size: 10px;
                opacity: 0.7;
                font-weight: 500;
            }
            
            /* Section Styles */
            .section {
                background: white;
                margin-bottom: 48px;
                border: none;
                overflow: visible;
            }
            
            .section:last-of-type {
                margin-bottom: 32px;
            }
            
            .section-header {
                background: transparent;
                padding: 0 0 16px 0;
                border-bottom: none;
                margin-bottom: 12px;
            }
            
            .section-title {
                font-size: 20px;
                font-weight: 700;
                color: #1e293b;
                display: flex;
                align-items: center;
                gap: 12px;
                margin: 0;
                text-transform: uppercase;
                letter-spacing: 1px;
                padding-bottom: 8px;
                border-bottom: 3px solid transparent;
            }
            
            .section-title.sales {
                border-bottom-color: #10b981;
            }
            
            .section-title.rawstone {
                border-bottom-color: #f59e0b;
            }
            
            .section-title.expenses {
                border-bottom-color: #ef4444;
            }
            
            .section-title::before {
                content: '';
                width: 6px;
                height: 28px;
                background: #2563eb;
                border-radius: 0;
            }
            
            .section-title.sales::before {
                background: #10b981;
            }
            
            .section-title.rawstone::before {
                background: #f59e0b;
            }
            
            .section-title.expenses::before {
                background: #ef4444;
            }
            
            /* Table Container */
            .table-container {
                padding: 0;
                overflow-x: auto;
                margin-bottom: 16px;
            }
            
            table {
                width: 100%;
                border-collapse: collapse;
                font-size: 11px;
                background: white;
            }
            
            th {
                background: #334155 !important;
                color: white !important;
                padding: 18px 14px;
                text-align: left;
                font-weight: 700;
                text-transform: uppercase;
                font-size: 11px;
                letter-spacing: 1px;
                border: 1px solid #1e293b;
                white-space: nowrap;
                position: sticky;
                top: 0;
                z-index: 10;
            }
            
            th.amount {
                text-align: right;
                padding-right: 18px;
                background: #334155 !important;
                color: white !important;
            }
            
            th:first-child {
                border-left: 2px solid #1e293b;
                background: #334155 !important;
            }
            
            th:last-child {
                border-right: 2px solid #1e293b;
                background: #334155 !important;
            }
            
            td {
                padding: 16px 14px;
                border: 1px solid #cbd5e1;
                vertical-align: middle;
                color: #1e293b;
                font-size: 12px;
                background: white;
                font-weight: 500;
            }
            
            td:first-child {
                border-left: 2px solid #cbd5e1;
                font-weight: 600;
            }
            
            td:last-child {
                border-right: 2px solid #cbd5e1;
            }
            
            /* Better table continuity styling */
            tbody tr:first-child td {
                border-top: 1px solid #cbd5e1;
            }
            
            tbody tr:last-child td {
                border-bottom: 2px solid #334155;
            }
            
            tr:nth-child(even) td {
                background: #f8fafc !important;
            }
            
            tr:hover td {
                background: #f1f5f9 !important;
            }
            
            .amount {
                text-align: right;
                font-weight: 700;
                font-family: 'SF Mono', 'Monaco', 'Consolas', monospace;
                white-space: nowrap;
                color: #1e293b;
                padding-right: 18px;
                font-size: 12px;
                min-width: 100px;
                word-break: break-all;
            }
            
            .amount-large {
                font-size: 9px;
                line-height: 1.2;
            }
            
            .center {
                text-align: center;
            }
            
            /* Column Widths */
            .date-col { width: 10%; }
            .vehicle-col { width: 15%; }
            .material-col { width: 15%; }
            .customer-col { width: 15%; }
            .qty-col { width: 8%; text-align: center; }
            .rate-col { width: 18%; text-align: right; padding-right: 16px; }
            .amount-col { width: 19%; text-align: right; padding-right: 16px; }
            .description-col { width: 25%; }
            .category-col { width: 15%; }
            .remarks-col { width: 20%; }
            
            /* No Data Message */
            .no-data {
                text-align: center;
                color: #64748b;
                font-style: italic;
                padding: 40px 24px;
                background: #f8fafc;
            }
            
            /* Footer */
            .footer {
                background: #f8fafc;
                padding: 20px 24px;
                text-align: center;
                color: #64748b;
                font-size: 11px;
                border-top: 1px solid #e2e8f0;
            }
            
            .footer p {
                margin: 4px 0;
            }
            
            /* Print Optimizations */
            @media print {
                body {
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                
                .container {
                    padding: 10px;
                    background: white;
                }
                
                .header {
                    page-break-after: avoid;
                    break-after: avoid;
                }
                
                .report-info {
                    page-break-after: avoid;
                    break-after: avoid;
                }
                
                .summary-section {
                    page-break-inside: avoid;
                    break-inside: avoid;
                    page-break-after: avoid;
                    break-after: avoid;
                }
                
                .section {
                    break-inside: auto;
                    page-break-before: avoid;
                    break-before: avoid;
                    margin-bottom: 24px;
                }
                
                .section-header {
                    page-break-after: avoid;
                    break-after: avoid;
                    margin-bottom: 0;
                }
                
                table {
                    page-break-inside: auto;
                    break-inside: auto;
                    border-radius: 0;
                    margin-bottom: 16px;
                }
                
                thead {
                    display: table-header-group;
                    break-inside: avoid;
                }
                
                tbody tr {
                    break-inside: avoid;
                }
                
                th {
                    background: #94a3b8 !important;
                    -webkit-print-color-adjust: exact;
                    print-color-adjust: exact;
                }
                
                .summary-grid {
                    break-inside: avoid;
                }
                
                .no-data {
                    page-break-inside: avoid;
                    break-inside: avoid;
                }
            }
            
            @page {
                margin: 0.4in;
                size: A4;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <!-- Header -->
            <div class="header">
                <div class="logo-container">
                    <svg width="80" height="80" viewBox="0 0 400 400" class="logo">
                        <defs>
                            <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" style="stop-color:#9bb537"/>
                                <stop offset="100%" style="stop-color:#ff8c00"/>
                            </linearGradient>
                        </defs>
                        <!-- Outer circle with gradient -->
                        <circle cx="200" cy="200" r="190" stroke="url(#logoGradient)" stroke-width="20" fill="white"/>
                        
                        <!-- Crusher Mate text -->
                        <text x="200" y="140" font-family="Arial, sans-serif" font-size="28" font-weight="bold" 
                              fill="#9bb537" text-anchor="middle">Crusher Mate</text>
                        
                        <!-- Tagline -->
                        <text x="200" y="165" font-family="Arial, sans-serif" font-size="11" 
                              fill="#666" text-anchor="middle">TRACK. MANAGE. PROFIT</text>
                        
                        <!-- Crusher/excavator icon -->
                        <g transform="translate(120,220)">
                            <ellipse cx="20" cy="15" rx="25" ry="8" fill="#333"/>
                            <rect x="0" y="0" width="40" height="15" fill="#333" rx="3"/>
                            <rect x="35" y="-5" width="15" height="8" fill="#333" rx="2"/>
                            <circle cx="45" cy="0" r="3" fill="#9bb537"/>
                        </g>
                        
                        <!-- Check mark -->
                        <path d="M 160 270 L 180 285 L 220 250" stroke="#9bb537" stroke-width="6" 
                              fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                        
                        <!-- Truck icon -->
                        <g transform="translate(240,245)">
                            <rect x="0" y="0" width="50" height="25" fill="#ff8c00" rx="4"/>
                            <rect x="45" y="5" width="15" height="15" fill="#ff8c00" rx="2"/>
                            <circle cx="12" cy="30" r="8" fill="#333"/>
                            <circle cx="38" cy="30" r="8" fill="#333"/>
                            <circle cx="55" cy="30" r="6" fill="#333"/>
                        </g>
                        
                        <!-- Flowing lines (representing efficiency) -->
                        <path d="M 320 180 Q 340 190 360 180 Q 380 170 400 180" 
                              stroke="#4a90e2" stroke-width="3" fill="none" opacity="0.7"/>
                        <path d="M 325 200 Q 345 210 365 200 Q 385 190 405 200" 
                              stroke="#4a90e2" stroke-width="2" fill="none" opacity="0.5"/>
                    </svg>
                </div>
                <div class="company-name">${organization.name}</div>
                <div class="report-subtitle">Financial Business Report</div>
            </div>
            
            <!-- Report Info -->
            <div class="report-info">
                <div class="date-range">
                    Period: ${moment(dateRange.startDate).format(
                      "DD MMM YYYY"
                    )} - ${moment(dateRange.endDate).format("DD MMM YYYY")}
                </div>
                <div class="generated-date">
                    Generated: ${moment().format("DD MMM YYYY, HH:mm")}
                </div>
            </div>
            
            <!-- Executive Summary -->
            <div class="summary-section">
                <h2 class="summary-title">Executive Summary</h2>
                <div class="summary-grid">
                    <div class="summary-card sales">
                        <div class="summary-label">Sales Revenue</div>
                        <div class="summary-value">₹ ${this.formatFullCurrency(
                          summary.totalSalesAmount
                        )}</div>
                        <div class="summary-quantity">${
                          summary.totalSalesQuantity
                        } Loads</div>
                    </div>
                    <div class="summary-card rawstone">
                        <div class="summary-label">Raw Material Cost</div>
                        <div class="summary-value">₹ ${this.formatFullCurrency(
                          summary.totalRawStoneAmount
                        )}</div>
                        <div class="summary-quantity">${
                          summary.totalRawStoneQuantity
                        } Loads</div>
                    </div>
                    <div class="summary-card expenses">
                        <div class="summary-label">Other Expenses</div>
                        <div class="summary-value">₹ ${this.formatFullCurrency(
                          summary.totalExpenseAmount
                        )}</div>
                    </div>
                    <div class="summary-card profit-card">
                        <div class="summary-label">Net Profit/Loss</div>
                        <div class="summary-value" style="font-size: 24px;">₹ ${this.formatFullCurrency(
                          summary.netProfit
                        )}</div>
                    </div>
                </div>
            </div>
            
            <!-- Sales Section -->
            <div class="section">
                <div class="section-header">
                    <h3 class="section-title sales">Sales Transactions</h3>
                </div>
                <div class="table-container">
                    ${
                      salesEntries.length > 0
                        ? `
                        <table>
                            <thead>
                                <tr>
                                    <th class="date-col">Date</th>
                                    <th class="vehicle-col">Vehicle No.</th>
                                    <th class="material-col">Material</th>
                                    <th class="customer-col">Customer</th>
                                    <th class="qty-col">Loads</th>
                                    <th class="rate-col amount">Rate/Load</th>
                                    <th class="amount-col amount">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${salesEntries
                                  .map(
                                    (entry) => `
                                    <tr>
                                        <td>${moment(entry.createdAt).format(
                                          "DD/MM"
                                        )}</td>
                                        <td>${entry.truckNumber || "-"}</td>
                                        <td>${entry.materialType || "-"}</td>
                                        <td>${entry.truckName || "-"}</td>
                                        <td class="center">${
                                          entry.units || 0
                                        }</td>
                                        <td class="${this.getAmountClass(
                                          parseFloat(entry.ratePerUnit || 0)
                                        )}">₹ ${this.formatFullCurrency(
                                      parseFloat(entry.ratePerUnit || 0)
                                    )}</td>
                                        <td class="${this.getAmountClass(
                                          parseFloat(entry.totalAmount || 0)
                                        )}">₹ ${this.formatFullCurrency(
                                      parseFloat(entry.totalAmount || 0)
                                    )}</td>
                                    </tr>
                                `
                                  )
                                  .join("")}
                            </tbody>
                        </table>
                    `
                        : '<div class="no-data">No sales transactions recorded for this period</div>'
                    }
                </div>
            </div>
            
            <!-- Raw Stone Section -->
            <div class="section">
                <div class="section-header">
                    <h3 class="section-title rawstone">Raw Material Purchases</h3>
                </div>
                <div class="table-container">
                    ${
                      rawStoneEntries.length > 0
                        ? `
                        <table>
                            <thead>
                                <tr>
                                    <th class="date-col">Date</th>
                                    <th class="vehicle-col">Vehicle No.</th>
                                    <th class="material-col">Material</th>
                                    <th class="customer-col">Supplier</th>
                                    <th class="qty-col">Loads</th>
                                    <th class="rate-col amount">Rate/Load</th>
                                    <th class="amount-col amount">Amount</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${rawStoneEntries
                                  .map(
                                    (entry) => `
                                    <tr>
                                        <td>${moment(entry.createdAt).format(
                                          "DD/MM"
                                        )}</td>
                                        <td>${entry.truckNumber || "-"}</td>
                                        <td>${entry.materialType || "-"}</td>
                                        <td>${entry.truckName || "-"}</td>
                                        <td class="center">${
                                          entry.units || 0
                                        }</td>
                                        <td class="${this.getAmountClass(
                                          parseFloat(entry.ratePerUnit || 0)
                                        )}">₹ ${this.formatFullCurrency(
                                      parseFloat(entry.ratePerUnit || 0)
                                    )}</td>
                                        <td class="${this.getAmountClass(
                                          parseFloat(entry.totalAmount || 0)
                                        )}">₹ ${this.formatFullCurrency(
                                      parseFloat(entry.totalAmount || 0)
                                    )}</td>
                                    </tr>
                                `
                                  )
                                  .join("")}
                            </tbody>
                        </table>
                    `
                        : '<div class="no-data">No raw material purchases recorded for this period</div>'
                    }
                </div>
            </div>
            
            <!-- Expenses Section -->
            <div class="section">
                <div class="section-header">
                    <h3 class="section-title expenses">Other Expenses</h3>
                </div>
                <div class="table-container">
                    ${
                      expenses.length > 0
                        ? `
                        <table>
                            <thead>
                                <tr>
                                    <th class="date-col">Date</th>
                                    <th class="description-col">Description</th>
                                    <th class="category-col">Category</th>
                                    <th class="amount-col amount">Amount</th>
                                    <th class="remarks-col">Remarks</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${expenses
                                  .map(
                                    (expense) => `
                                    <tr>
                                        <td>${moment(expense.createdAt).format(
                                          "DD/MM"
                                        )}</td>
                                        <td>${
                                          expense.others ||
                                          expense.expensesName ||
                                          "-"
                                        }</td>
                                        <td>${expense.expensesName || "-"}</td>
                                        <td class="${this.getAmountClass(
                                          parseFloat(expense.amount || 0)
                                        )}">₹ ${this.formatFullCurrency(
                                      parseFloat(expense.amount || 0)
                                    )}</td>
                                        <td>${expense.notes || "-"}</td>
                                    </tr>
                                `
                                  )
                                  .join("")}
                            </tbody>
                        </table>
                    `
                        : '<div class="no-data">No other expenses recorded for this period</div>'
                    }
                </div>
            </div>
            
            <!-- Footer -->
            <div class="footer">
                <p><strong>${
                  organization.name
                }</strong> - Management Information System</p>
                <p>Report Summary: ${salesEntries.length} Sales • ${
      rawStoneEntries.length
    } Purchases • ${expenses.length} Other Expenses</p>
            </div>
        </div>
    </body>
    </html>
    `;
  }
}
