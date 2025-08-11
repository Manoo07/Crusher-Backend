import { EntryType } from "@prisma/client";
import { Response } from "express";
import { EntryTypeMaterialService } from "../services/entryTypeMaterialService";
import { MaterialRateService } from "../services/materialRateService";
import {
  AuthenticatedRequest,
  MaterialTypeWithRate,
  MaterialTypesWithRatesResponse,
} from "../types";
import { ResponseUtil } from "../utils/response";

export class MaterialRateController {
  private materialRateService: MaterialRateService;
  private entryTypeMaterialService: EntryTypeMaterialService;

  constructor() {
    this.materialRateService = new MaterialRateService();
    this.entryTypeMaterialService = new EntryTypeMaterialService();
  }

  getMaterialRates = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user || !req.organizationId) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      const { entryType } = req.query;

      // If entryType filter is provided, use the bridge table to get filtered results
      if (entryType) {
        // Validate entry type
        if (!Object.values(EntryType).includes(entryType as EntryType)) {
          return ResponseUtil.badRequest(
            res,
            "Invalid entry type. Use 'Sales' or 'RawStone'"
          );
        }

        // Get materials linked to this entry type through the bridge table
        const entryTypeMaterials =
          await this.entryTypeMaterialService.getEntryTypeMaterialsByEntryType(
            req.organizationId,
            entryType as EntryType
          );

        // Transform data to match the expected material rates format
        const filteredRates = entryTypeMaterials.map((etm) => ({
          id: etm.materialRate.id,
          organizationId: etm.materialRate.organizationId,
          materialType: etm.materialRate.materialType,
          ratePerUnit: etm.materialRate.ratePerUnit,
          unitType: etm.materialRate.unitType,
          isActive: etm.materialRate.isActive,
          createdAt: etm.materialRate.createdAt,
          updatedAt: etm.materialRate.updatedAt,
          // Additional bridge table info
          entryTypeMaterialId: etm.id,
          entryType: etm.entryType,
        }));

        return ResponseUtil.success(
          res,
          filteredRates,
          `Material rates for ${entryType} retrieved successfully`
        );
      }

      // Default behavior: get all material rates for the organization
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

  // NEW: GET /api/material-rates/:id - Get individual material rate
  getMaterialRateById = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user || !req.organizationId) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      const { id } = req.params;

      const materialRate = await this.materialRateService.getMaterialRateById(
        id
      );

      if (!materialRate) {
        return ResponseUtil.notFound(res, "Material rate not found");
      }

      // Ensure the material rate belongs to the user's organization
      if (materialRate.organizationId !== req.organizationId) {
        return ResponseUtil.forbidden(res, "Access denied");
      }

      return ResponseUtil.success(
        res,
        materialRate,
        "Material rate retrieved successfully"
      );
    } catch (error: any) {
      console.error("Get material rate by ID error:", error);
      return ResponseUtil.error(res, error.message);
    }
  };

  // NEW: PUT /api/material-rates/:id - Update individual material rate
  updateMaterialRateById = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user || !req.organizationId) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      const { id } = req.params;
      const { materialType, ratePerUnit, unitType, isActive } = req.body;

      // Check if material rate exists and belongs to organization
      const existingRate = await this.materialRateService.getMaterialRateById(
        id
      );

      if (!existingRate) {
        return ResponseUtil.notFound(res, "Material rate not found");
      }

      if (existingRate.organizationId !== req.organizationId) {
        return ResponseUtil.forbidden(res, "Access denied");
      }

      // Validate rate if provided
      if (ratePerUnit !== undefined) {
        const numericRate = Number(ratePerUnit);
        if (isNaN(numericRate) || numericRate <= 0) {
          return ResponseUtil.badRequest(
            res,
            "Rate must be a valid number greater than 0"
          );
        }
      }

      // Build update data
      const updateData: any = {};
      if (materialType !== undefined) updateData.materialType = materialType;
      if (ratePerUnit !== undefined)
        updateData.ratePerUnit = Number(ratePerUnit);
      if (unitType !== undefined) updateData.unitType = unitType;
      if (isActive !== undefined) updateData.isActive = isActive;

      if (Object.keys(updateData).length === 0) {
        return ResponseUtil.badRequest(
          res,
          "No valid fields provided for update"
        );
      }

      const updatedRate = await this.materialRateService.updateMaterialRateById(
        id,
        updateData
      );

      return ResponseUtil.success(
        res,
        updatedRate,
        "Material rate updated successfully"
      );
    } catch (error: any) {
      console.error("Update material rate by ID error:", error);
      return ResponseUtil.error(res, error.message);
    }
  };

  // NEW: DELETE /api/material-rates/:id - Delete individual material rate
  deleteMaterialRateById = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user || !req.organizationId) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      const { id } = req.params;

      // Check if material rate exists and belongs to organization
      const existingRate = await this.materialRateService.getMaterialRateById(
        id
      );

      if (!existingRate) {
        return ResponseUtil.notFound(res, "Material rate not found");
      }

      if (existingRate.organizationId !== req.organizationId) {
        return ResponseUtil.forbidden(res, "Access denied");
      }

      // Check if this material rate is being used in any truck entries or bridge table
      // For now, we'll do a soft delete by setting isActive to false
      const deletedRate = await this.materialRateService.updateMaterialRateById(
        id,
        {
          isActive: false,
        }
      );

      return ResponseUtil.success(
        res,
        deletedRate,
        "Material rate deleted successfully"
      );
    } catch (error: any) {
      console.error("Delete material rate by ID error:", error);
      return ResponseUtil.error(res, error.message);
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

  // GET /api/material-rates/sales - Get material types with rates for Sales truck entries (backward compatibility)
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

  // NEW: GET /api/material-rates/by-entry-type/:entryType - Get materials for specific entry type using bridge table
  getMaterialsByEntryType = async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      if (!req.user || !req.organizationId) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      const { entryType } = req.params;

      // Validate entry type
      if (!Object.values(EntryType).includes(entryType as EntryType)) {
        return ResponseUtil.badRequest(res, "Invalid entry type");
      }

      // Get materials linked to this entry type through the bridge table
      const entryTypeMaterials =
        await this.entryTypeMaterialService.getEntryTypeMaterialsByEntryType(
          req.organizationId,
          entryType as EntryType
        );

      // Transform data to include material details with rates
      const materialsWithRates = entryTypeMaterials.map((etm) => ({
        id: etm.id,
        materialType: etm.materialRate.materialType,
        ratePerUnit: Number(etm.materialRate.ratePerUnit),
        unitType: etm.materialRate.unitType,
        isActive: etm.materialRate.isActive,
        materialRateId: etm.materialRate.id,
        entryTypeMaterialId: etm.id,
        lastUpdated: etm.materialRate.updatedAt,
      }));

      return ResponseUtil.success(
        res,
        {
          entryType,
          materials: materialsWithRates,
          totalCount: materialsWithRates.length,
          organizationId: req.organizationId,
        },
        `Materials for ${entryType} retrieved successfully`
      );
    } catch (error: any) {
      console.error("Get materials by entry type error:", error);
      return ResponseUtil.error(res, error.message);
    }
  };

  // NEW: GET /api/material-rates/available-for-entry-type/:entryType - Get all materials available to link to an entry type
  getAvailableMaterialsForEntryType = async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      if (!req.user || !req.organizationId) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      const { entryType } = req.params;

      // Validate entry type
      if (!Object.values(EntryType).includes(entryType as EntryType)) {
        return ResponseUtil.badRequest(res, "Invalid entry type");
      }

      // Get all material rates for the organization
      const allMaterialRates =
        await this.materialRateService.getMaterialRatesByOrganization(
          req.organizationId
        );

      // Get materials already linked to this entry type
      const linkedMaterials =
        await this.entryTypeMaterialService.getEntryTypeMaterialsByEntryType(
          req.organizationId,
          entryType as EntryType
        );

      const linkedMaterialRateIds = new Set(
        linkedMaterials.map((etm) => etm.materialRateId)
      );

      // Filter out already linked materials
      const availableMaterials = allMaterialRates
        .filter((rate: any) => !linkedMaterialRateIds.has(rate.id))
        .map((rate: any) => ({
          id: rate.id,
          materialType: rate.materialType,
          ratePerUnit: Number(rate.ratePerUnit),
          unitType: rate.unitType,
          isActive: rate.isActive,
          lastUpdated: rate.updatedAt,
        }));

      return ResponseUtil.success(
        res,
        {
          entryType,
          availableMaterials,
          totalCount: availableMaterials.length,
          organizationId: req.organizationId,
        },
        `Available materials for ${entryType} retrieved successfully`
      );
    } catch (error: any) {
      console.error("Get available materials for entry type error:", error);
      return ResponseUtil.error(res, error.message);
    }
  };
}
