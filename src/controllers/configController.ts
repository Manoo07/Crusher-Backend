import { Request, Response } from "express";
import { MaterialRateService } from "../services/materialRateService";
import { ResponseUtil } from "../utils/response";

export class ConfigController {
  private materialRateService: MaterialRateService;

  constructor() {
    this.materialRateService = new MaterialRateService();
  }

  // GET /api/config/app
  getAppConfig = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;

      const config = {
        version: "1.0.0",
        environment: process.env.NODE_ENV || "development",
        features: {
          truckEntries: true,
          materialRates: true,
          otherExpenses: true,
          reports: true,
          dashboard: true,
        },
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
          organizationId: user.organizationId,
        },
        organization: {
          id: user.organizationId,
        },
      };

      ResponseUtil.success(
        res,
        { config },
        "App configuration retrieved successfully"
      );
    } catch (error) {
      ResponseUtil.error(res, "Failed to retrieve app configuration", 500);
    }
  };

  // GET /api/config/rates
  getCurrentRates = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const { units = 10 } = req.query;

      const materialRates =
        await this.materialRateService.getMaterialRatesByOrganization(
          user.organizationId
        );

      const rates = materialRates.map((rate) => ({
        materialType: rate.materialType,
        currentRate: Number(rate.ratePerUnit),
        lastUpdated: rate.updatedAt,
      }));

      ResponseUtil.success(
        res,
        {
          rates,
          previewUnits: Number(units),
        },
        "Current rates retrieved successfully"
      );
    } catch (error) {
      ResponseUtil.error(res, "Failed to retrieve current rates", 500);
    }
  };

  // POST /api/config/calculate
  calculateTotal = async (req: Request, res: Response): Promise<void> => {
    try {
      const { units, ratePerUnit, materialType } = req.body;

      if (!units || !ratePerUnit) {
        ResponseUtil.badRequest(res, "Units and rate per unit are required");
        return;
      }

      const totalAmount = Number(units) * Number(ratePerUnit);

      const calculation = {
        units: Number(units),
        ratePerUnit: Number(ratePerUnit),
        totalAmount,
      };

      const formatted = {
        units: `${Number(units).toLocaleString()} loads`,
        ratePerUnit: `₹${Number(ratePerUnit).toLocaleString()}`,
        totalAmount: `₹${totalAmount.toLocaleString()}`,
        materialType: materialType || "Not specified",
      };

      ResponseUtil.success(
        res,
        {
          calculation,
          formatted,
        },
        "Calculation completed successfully"
      );
    } catch (error) {
      ResponseUtil.error(res, "Failed to calculate total", 500);
    }
  };

  // POST /api/config/validate
  validateTruckEntry = async (req: Request, res: Response): Promise<void> => {
    try {
      const user = (req as any).user;
      const { truckNumber, entryType, materialType, units, ratePerUnit } =
        req.body;

      const errors: string[] = [];
      const warnings: string[] = [];
      let isValid = true;

      // Validate required fields
      if (!truckNumber) {
        errors.push("Truck number is required");
        isValid = false;
      }
      if (!entryType) {
        errors.push("Entry type is required");
        isValid = false;
      }
      if (!units || Number(units) <= 0) {
        errors.push("Units must be greater than 0");
        isValid = false;
      }
      if (!ratePerUnit || Number(ratePerUnit) <= 0) {
        errors.push("Rate per unit must be greater than 0");
        isValid = false;
      }

      // Validate truck number format
      if (truckNumber && !/^[A-Z]{2}\d{2}[A-Z]{2}\d{4}$/.test(truckNumber)) {
        warnings.push(
          "Truck number format should be: XX00XX0000 (e.g., KA01AB1234)"
        );
      }

      // Validate material type for sales entries
      if (entryType === "Sales" && !materialType) {
        errors.push("Material type is required for sales entries");
        isValid = false;
      }

      // Check if material rate exists for the given material type
      if (materialType && entryType === "Sales") {
        try {
          const materialRates =
            await this.materialRateService.getMaterialRatesByOrganization(
              user.organizationId
            );
          const rateExists = materialRates.some(
            (rate) => rate.materialType === materialType
          );

          if (!rateExists) {
            warnings.push(
              `No standard rate found for material type: ${materialType}`
            );
          } else {
            const standardRate = materialRates.find(
              (rate) => rate.materialType === materialType
            );
            if (
              standardRate &&
              Math.abs(Number(standardRate.ratePerUnit) - Number(ratePerUnit)) >
                Number(standardRate.ratePerUnit) * 0.1
            ) {
              warnings.push(
                `Rate differs significantly from standard rate of ₹${standardRate.ratePerUnit}`
              );
            }
          }
        } catch (error) {
          // Ignore rate validation errors
        }
      }

      const validatedData = {
        truckNumber: truckNumber?.toUpperCase(),
        entryType,
        materialType,
        units: Number(units),
        ratePerUnit: Number(ratePerUnit),
        totalAmount: Number(units) * Number(ratePerUnit),
      };

      ResponseUtil.success(
        res,
        {
          isValid,
          errors,
          warnings,
          validatedData,
        },
        "Validation completed"
      );
    } catch (error) {
      ResponseUtil.error(res, "Failed to validate truck entry", 500);
    }
  };
}
