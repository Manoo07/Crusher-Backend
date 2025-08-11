import { Response } from "express";
import { EntryTypeMaterialService } from "../services/entryTypeMaterialService";
import { TruckEntryService } from "../services/truckEntryService";
import { AuthenticatedRequest, TruckEntryFilters } from "../types";
import { ResponseUtil } from "../utils/response";
import { ValidationUtil } from "../utils/validation";

export class TruckEntryController {
  private truckEntryService: TruckEntryService;
  private entryTypeMaterialService: EntryTypeMaterialService;

  constructor() {
    this.truckEntryService = new TruckEntryService();
    this.entryTypeMaterialService = new EntryTypeMaterialService();
  }

  getTruckEntries = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user || !req.organizationId) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      const filters: TruckEntryFilters = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        sortBy: (req.query.sortBy as string) || "entryDate",
        sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
        entryType: req.query.entryType as string,
        materialType: req.query.materialType as string,
        status: (req.query.status as string) || "active",
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        userId: req.query.userId as string,
      };

      const result = await this.truckEntryService.getTruckEntriesByOrganization(
        req.organizationId,
        filters
      );

      return ResponseUtil.success(
        res,
        result.entries,
        "Truck entries retrieved successfully",
        200,
        result.pagination
      );
    } catch (error: any) {
      console.error("Get truck entries error:", error);
      return ResponseUtil.error(res, error.message);
    }
  };

  getTruckEntriesSummary = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user || !req.organizationId) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      const startDate = req.query.startDate
        ? new Date(req.query.startDate as string)
        : undefined;
      const endDate = req.query.endDate
        ? new Date(req.query.endDate as string)
        : undefined;
      const userId = req.query.userId as string;

      const summary = await this.truckEntryService.getTruckEntriesSummary(
        req.organizationId,
        startDate,
        endDate,
        userId
      );

      return ResponseUtil.success(
        res,
        { summary },
        "Summary retrieved successfully"
      );
    } catch (error: any) {
      console.error("Get truck entries summary error:", error);
      return ResponseUtil.error(res, error.message);
    }
  };

  createTruckEntry = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user || !req.organizationId) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      const {
        truckNumber,
        truckName,
        entryType,
        materialType, // Legacy field for backward compatibility
        entryTypeMaterialId, // New field using bridge table
        units,
        ratePerUnit,
        notes,
        truckImage,
      }: any = req.body;

      // Auto-generate entry date and time
      const now = new Date();
      const entryDate = now;
      const entryTime = now;

      // Validate truck number format
      const truckNumberRegex = /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$/;
      if (!truckNumberRegex.test(truckNumber)) {
        return ResponseUtil.badRequest(res, "Invalid truck number format");
      }

      // Validate units and rate
      const unitsValidation = ValidationUtil.validateDecimal(
        units,
        "units",
        0.1
      );
      if (!unitsValidation.isValid) {
        return ResponseUtil.badRequest(res, unitsValidation.message);
      }

      const rateValidation = ValidationUtil.validateDecimal(
        ratePerUnit,
        "rate per unit",
        1
      );
      if (!rateValidation.isValid) {
        return ResponseUtil.badRequest(res, rateValidation.message);
      }

      // Material validation for Sales entries
      if (entryType === "Sales") {
        // Check if using new bridge table approach or legacy approach
        if (!entryTypeMaterialId && !materialType) {
          return ResponseUtil.badRequest(
            res,
            "Either entryTypeMaterialId or materialType is required for Sales entries"
          );
        }

        // If using bridge table, validate the entry type material mapping
        if (entryTypeMaterialId) {
          const entryTypeMaterial =
            await this.entryTypeMaterialService.getEntryTypeMaterialById(
              entryTypeMaterialId
            );
          if (!entryTypeMaterial) {
            return ResponseUtil.badRequest(
              res,
              "Invalid entry type material mapping"
            );
          }

          // Verify it belongs to the organization and matches the entry type
          if (entryTypeMaterial.organizationId !== req.organizationId) {
            return ResponseUtil.forbidden(
              res,
              "Material mapping not found for your organization"
            );
          }

          if (entryTypeMaterial.entryType !== entryType) {
            return ResponseUtil.badRequest(
              res,
              "Material mapping does not match the entry type"
            );
          }
        }
      }

      // Calculate total amount for response
      const calculatedTotalAmount =
        unitsValidation.value! * rateValidation.value!;

      const truckEntry = await this.truckEntryService.createTruckEntry({
        organizationId: req.organizationId,
        userId: req.user.id,
        truckNumber,
        truckName,
        entryType,
        materialType, // Keep for backward compatibility
        entryTypeMaterialId, // New field for bridge table
        units: unitsValidation.value!,
        ratePerUnit: rateValidation.value!,
        entryDate: entryDate,
        entryTime: entryTime,
        notes,
        truckImage,
      });

      return ResponseUtil.success(
        res,
        {
          truckEntry: {
            ...truckEntry,
            calculatedTotal: calculatedTotalAmount,
          },
        },
        "Truck entry created successfully",
        201
      );
    } catch (error: any) {
      console.error("Create truck entry error:", error);
      return ResponseUtil.badRequest(res, error.message);
    }
  };

  getTruckEntryById = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      if (!req.user || !req.organizationId) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      const truckEntry = await this.truckEntryService.getTruckEntryById(id);

      if (!truckEntry) {
        return ResponseUtil.notFound(res, "Truck entry not found");
      }

      // Check if user has access to this truck entry
      if (truckEntry.organizationId !== req.organizationId) {
        return ResponseUtil.forbidden(res, "Access denied");
      }

      return ResponseUtil.success(
        res,
        truckEntry,
        "Truck entry retrieved successfully"
      );
    } catch (error: any) {
      console.error("Get truck entry error:", error);
      return ResponseUtil.error(res, error.message);
    }
  };

  updateTruckEntry = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const updateData = req.body;

      if (!req.user || !req.organizationId) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      const existingEntry = await this.truckEntryService.getTruckEntryById(id);
      if (!existingEntry) {
        return ResponseUtil.notFound(res, "Truck entry not found");
      }

      // Check access permissions
      if (existingEntry.organizationId !== req.organizationId) {
        return ResponseUtil.forbidden(res, "Access denied");
      }

      // Users can only edit their own entries, owners can edit any
      if (req.user.role !== "owner" && existingEntry.userId !== req.user.id) {
        return ResponseUtil.forbidden(
          res,
          "You can only edit your own entries"
        );
      }

      // Auto-update entryTime when record is modified
      const now = new Date();
      updateData.entryTime = now;

      // Remove entryDate from updateData if provided - it should not be changed on update
      delete updateData.entryDate;

      const truckEntry = await this.truckEntryService.updateTruckEntry(
        id,
        updateData
      );

      return ResponseUtil.success(
        res,
        { truckEntry },
        "Truck entry updated successfully"
      );
    } catch (error: any) {
      console.error("Update truck entry error:", error);
      return ResponseUtil.badRequest(res, error.message);
    }
  };

  deleteTruckEntry = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      if (!req.user || !req.organizationId) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      const existingEntry = await this.truckEntryService.getTruckEntryById(id);
      if (!existingEntry) {
        return ResponseUtil.notFound(res, "Truck entry not found");
      }

      // Check access permissions
      if (existingEntry.organizationId !== req.organizationId) {
        return ResponseUtil.forbidden(res, "Access denied");
      }

      // Users can only delete their own entries, owners can delete any
      if (req.user.role !== "owner" && existingEntry.userId !== req.user.id) {
        return ResponseUtil.forbidden(
          res,
          "You can only delete your own entries"
        );
      }

      await this.truckEntryService.deleteTruckEntry(id);

      return ResponseUtil.success(
        res,
        null,
        "Truck entry deleted successfully"
      );
    } catch (error: any) {
      console.error("Delete truck entry error:", error);
      return ResponseUtil.badRequest(res, error.message);
    }
  };

  // GET /api/truck-entries/entry-types - Get available entry types
  getEntryTypes = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user || !req.organizationId) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      const entryTypes = [
        {
          value: "Sales",
          label: "Sales",
          description: "Record truck sales transactions",
          requiresMaterial: true,
        },
        {
          value: "RawStone",
          label: "Raw Stone",
          description: "Record raw stone purchases",
          requiresMaterial: false,
        },
      ];

      return ResponseUtil.success(
        res,
        { entryTypes },
        "Entry types retrieved successfully"
      );
    } catch (error: any) {
      console.error("Get entry types error:", error);
      return ResponseUtil.error(res, error.message);
    }
  };
}
