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

    let browser;
    try {
      logger.info("Launching Puppeteer browser with optimized settings");
      browser = await puppeteer.launch({
        headless: "new",
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--disable-features=VizDisplayCompositor",
          "--disable-extensions",
          "--disable-plugins",
          "--disable-default-apps",
          "--no-first-run",
          "--no-default-browser-check",
          "--single-process",
          "--disable-background-timer-throttling",
          "--disable-backgrounding-occluded-windows",
          "--disable-renderer-backgrounding",
        ],
        timeout: 120000,
        protocolTimeout: 120000,
      });

      logger.info("Creating new page");
      const page = await browser.newPage();

      page.setDefaultTimeout(90000);
      page.setDefaultNavigationTimeout(90000);

      await page.setViewport({ width: 1200, height: 1600 });

      logger.info("Generating simplified PDF HTML content");
      const html = this.generateSimplifiedPdfHTML(reportData);

      logger.info("Setting page content with minimal wait");
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

      const errorMessage = (error as Error).message || "";
      if (
        errorMessage.includes("timed out") ||
        errorMessage.includes("ProtocolError")
      ) {
        throw new Error(
          "PDF generation timed out. The report may be too large or the server is under heavy load. Please try again or contact support."
        );
      }

      throw error;
    } finally {
      if (browser) {
        try {
          logger.info("Closing Puppeteer browser");
          await browser.close();
        } catch (closeError) {
          logger.error("Error closing browser", {
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
      return (amount / 10000000).toFixed(1) + " Cr";
    } else if (amount >= 10000000) {
      return (amount / 10000000).toFixed(2) + " Cr";
    } else if (amount >= 100000) {
      return (amount / 100000).toFixed(1) + " L";
    } else if (amount >= 1000) {
      return (amount / 1000).toFixed(0) + " K";
    } else {
      return amount.toLocaleString("en-IN");
    }
  }

  private formatFullCurrency(amount: number): string {
    if (amount >= 10000000000) {
      return (amount / 10000000).toFixed(1) + " Cr";
    } else if (amount >= 1000000000) {
      return (amount / 10000000).toFixed(2) + " Cr";
    } else if (amount >= 100000000) {
      return (amount / 10000000).toFixed(1) + " Cr";
    } else if (amount >= 10000000) {
      return (amount / 10000000).toFixed(2) + " Cr";
    } else {
      return amount.toLocaleString("en-IN");
    }
  }

  private getAmountClass(amount: number): string {
    return amount >= 1000000000 ? "amount amount-large" : "amount";
  }

  // Simplified PDF HTML with minimal styling to reduce processing time
  private generateSimplifiedPdfHTML(reportData: ReportData): string {
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
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; color: #333; line-height: 1.4; }
            .container { max-width: 100%; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; padding: 20px; background: #f5f5f5; }
            .company-name { font-size: 24px; font-weight: bold; margin-bottom: 10px; }
            .report-subtitle { font-size: 16px; color: #666; }
            .date-range { text-align: center; margin-bottom: 20px; font-weight: bold; }
            .summary { margin-bottom: 30px; }
            .summary-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px; }
            .summary-card { background: #f9f9f9; padding: 15px; border-left: 4px solid #2563eb; }
            .summary-label { font-size: 12px; color: #666; text-transform: uppercase; margin-bottom: 5px; }
            .summary-value { font-size: 18px; font-weight: bold; }
            .section { margin-bottom: 30px; }
            .section-title { font-size: 18px; font-weight: bold; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 2px solid #ddd; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background: #f5f5f5; font-weight: bold; }
            .amount { text-align: right; font-family: monospace; }
            .no-data { text-align: center; color: #666; padding: 20px; font-style: italic; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <div class="company-name">${organization.name}</div>
                <div class="report-subtitle">Business Report</div>
            </div>
            
            <div class="date-range">
                Period: ${moment(dateRange.startDate).format(
                  "DD MMM YYYY"
                )} - ${moment(dateRange.endDate).format("DD MMM YYYY")}
            </div>
            
            <div class="summary">
                <h2>Executive Summary</h2>
                <div class="summary-grid">
                    <div class="summary-card">
                        <div class="summary-label">Sales Revenue</div>
                        <div class="summary-value">₹ ${this.formatFullCurrency(
                          summary.totalSalesAmount
                        )}</div>
                        <div>${summary.totalSalesQuantity} Loads</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-label">Raw Material Cost</div>
                        <div class="summary-value">₹ ${this.formatFullCurrency(
                          summary.totalRawStoneAmount
                        )}</div>
                        <div>${summary.totalRawStoneQuantity} Loads</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-label">Other Expenses</div>
                        <div class="summary-value">₹ ${this.formatFullCurrency(
                          summary.totalExpenseAmount
                        )}</div>
                    </div>
                    <div class="summary-card">
                        <div class="summary-label">Net Profit/Loss</div>
                        <div class="summary-value">₹ ${this.formatFullCurrency(
                          summary.netProfit
                        )}</div>
                    </div>
                </div>
            </div>
            
            <div class="section">
                <h3 class="section-title">Sales Transactions</h3>
                ${
                  salesEntries.length > 0
                    ? `
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Vehicle</th>
                                <th>Material</th>
                                <th>Customer</th>
                                <th>Loads</th>
                                <th>Rate</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${salesEntries
                              .map(
                                (entry) => `
                                <tr>
                                    <td>${moment(entry.createdAt).format(
                                      "DD/MM/YYYY"
                                    )}</td>
                                    <td>${entry.truckNumber || "-"}</td>
                                    <td>${entry.materialType || "-"}</td>
                                    <td>${entry.truckName || "-"}</td>
                                    <td>${entry.units || 0}</td>
                                    <td class="amount">₹ ${this.formatFullCurrency(
                                      parseFloat(entry.ratePerUnit || 0)
                                    )}</td>
                                    <td class="amount">₹ ${this.formatFullCurrency(
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
            
            <div class="section">
                <h3 class="section-title">Raw Material Purchases</h3>
                ${
                  rawStoneEntries.length > 0
                    ? `
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Vehicle</th>
                                <th>Material</th>
                                <th>Supplier</th>
                                <th>Loads</th>
                                <th>Rate</th>
                                <th>Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${rawStoneEntries
                              .map(
                                (entry) => `
                                <tr>
                                    <td>${moment(entry.createdAt).format(
                                      "DD/MM/YYYY"
                                    )}</td>
                                    <td>${entry.truckNumber || "-"}</td>
                                    <td>${entry.materialType || "-"}</td>
                                    <td>${entry.truckName || "-"}</td>
                                    <td>${entry.units || 0}</td>
                                    <td class="amount">₹ ${this.formatFullCurrency(
                                      parseFloat(entry.ratePerUnit || 0)
                                    )}</td>
                                    <td class="amount">₹ ${this.formatFullCurrency(
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
            
            <div class="section">
                <h3 class="section-title">Other Expenses</h3>
                ${
                  expenses.length > 0
                    ? `
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>Description</th>
                                <th>Category</th>
                                <th>Amount</th>
                                <th>Remarks</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${expenses
                              .map(
                                (expense) => `
                                <tr>
                                    <td>${moment(expense.createdAt).format(
                                      "DD/MM/YYYY"
                                    )}</td>
                                    <td>${
                                      expense.others ||
                                      expense.expensesName ||
                                      "-"
                                    }</td>
                                    <td>${expense.expensesName || "-"}</td>
                                    <td class="amount">₹ ${this.formatFullCurrency(
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
            
            <div class="footer">
                <p><strong>${
                  organization.name
                }</strong> - Management Information System</p>
                <p>Generated: ${moment().format("DD MMM YYYY, HH:mm")}</p>
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
