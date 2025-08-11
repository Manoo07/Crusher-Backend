import { Response } from "express";
import { MaterialRateService } from "../services/materialRateService";
import {
  AuthenticatedRequest,
  MaterialTypeWithRate,
  MaterialTypesWithRatesResponse,
} from "../types";
import { ResponseUtil } from "../utils/response";

export class MaterialRateController {
  private materialRateService: MaterialRateService;

  constructor() {
    this.materialRateService = new MaterialRateService();
  }

  getMaterialRates = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user || !req.organizationId) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      const rates =
        await this.materialRateService.getMaterialRatesByOrganization(
          req.organizationId
        );

      return ResponseUtil.success(
        res,
        rates,
        "Material rates retrieved successfully"
      );
    } catch (error: any) {
      console.error("Get material rates error:", error);
      return ResponseUtil.error(res, error.message);
    }
  };

  updateMaterialRate = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { materialType, rate } = req.body;

      if (!req.user || !req.organizationId) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      // Convert rate to number to avoid string concatenation
      const numericRate = Number(rate);

      if (isNaN(numericRate) || numericRate <= 0) {
        return ResponseUtil.badRequest(
          res,
          "Rate must be a valid number greater than 0"
        );
      }

      const materialRate =
        await this.materialRateService.createOrUpdateMaterialRate({
          organizationId: req.organizationId,
          materialType,
          ratePerUnit: numericRate,
          updatedBy: req.user.id,
        });

      return ResponseUtil.success(
        res,
        materialRate,
        `Rate for ${materialType} updated successfully`,
        201
      );
    } catch (error: any) {
      console.error("Update material rate error:", error);
      return ResponseUtil.badRequest(res, error.message);
    }
  };

  // GET /api/material-types
  getMaterialTypes = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const materialTypes = [
        '1 1/2" Metal',
        '3/4" jalli',
        '1/2" jalli',
        '1/4" kuranai',
        "Dust",
        "Wetmix",
        "Msand",
        "Psand",
        "M Sand",
        "P Sand",
        "12mm Jelly",
        "20mm Jelly",
        "40mm Jelly",
      ];

      return ResponseUtil.success(
        res,
        { materialTypes },
        "Material types retrieved successfully"
      );
    } catch (error: any) {
      console.error("Get material types error:", error);
      return ResponseUtil.error(res, error.message);
    }
  };

  // GET /api/material-rates/sales - Get material types with rates for Sales truck entries
  getMaterialTypesWithRates = async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      if (!req.user || !req.organizationId) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      // Get all material rates for the organization
      const materialRates =
        await this.materialRateService.getMaterialRatesByOrganization(
          req.organizationId
        );

      // Get standard material types
      const standardMaterialTypes = [
        "M Sand",
        "P Sand",
        "12mm Jelly",
        "20mm Jelly",
        "40mm Jelly",
        '1 1/2" Metal',
        '3/4" jalli',
        '1/2" jalli',
        '1/4" kuranai',
        "Dust",
        "Wetmix",
      ];

      // Create a map of existing rates
      const ratesMap = new Map();
      materialRates.forEach((rate: any) => {
        ratesMap.set(rate.materialType, {
          id: rate.id,
          ratePerUnit: Number(rate.ratePerUnit),
          unitType: rate.unitType || "Load",
          updatedAt: rate.updatedAt,
        });
      });

      // Build response with material types and their rates
      const materialTypesWithRates: MaterialTypeWithRate[] =
        standardMaterialTypes.map((materialType) => {
          const existingRate = ratesMap.get(materialType);
          return {
            materialType,
            ratePerUnit: existingRate ? existingRate.ratePerUnit : 0,
            unitType: existingRate ? existingRate.unitType : "Load",
            hasRate: !!existingRate,
            lastUpdated: existingRate ? existingRate.updatedAt : null,
          };
        });

      // Add any custom material types that exist in rates but not in standard list
      materialRates.forEach((rate: any) => {
        if (!standardMaterialTypes.includes(rate.materialType)) {
          materialTypesWithRates.push({
            materialType: rate.materialType,
            ratePerUnit: Number(rate.ratePerUnit),
            unitType: rate.unitType || "Load",
            hasRate: true,
            lastUpdated: rate.updatedAt,
            isCustom: true,
          });
        }
      });

      const response: MaterialTypesWithRatesResponse = {
        materialTypes: materialTypesWithRates,
        totalCount: materialTypesWithRates.length,
        organizationId: req.organizationId,
      };

      return ResponseUtil.success(
        res,
        response,
        "Material types with rates retrieved successfully"
      );
    } catch (error: any) {
      console.error("Get material types with rates error:", error);
      return ResponseUtil.error(res, error.message);
    }
  };
}
