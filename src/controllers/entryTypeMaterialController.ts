import { EntryType } from "@prisma/client";
import { Response } from "express";
import { EntryTypeMaterialService } from "../services/entryTypeMaterialService";
import { AuthenticatedRequest } from "../types";
import { logger } from "../utils/logger";
import { ResponseUtil } from "../utils/response";

export class EntryTypeMaterialController {
  private entryTypeMaterialService: EntryTypeMaterialService;

  constructor() {
    this.entryTypeMaterialService = new EntryTypeMaterialService();
  }

  // GET /api/entry-type-materials - Get all entry-type-material mappings for organization
  getEntryTypeMaterials = async (req: AuthenticatedRequest, res: Response) => {
    try {
      logger.info("Fetching entry type materials", {
        userId: req.user?.id,
        organizationId: req.organizationId,
      });

      if (!req.user || !req.organizationId) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      const entryTypeMaterials =
        await this.entryTypeMaterialService.getEntryTypeMaterialsByOrganization(
          req.organizationId
        );

      logger.info("Entry type materials retrieved successfully", {
        userId: req.user?.id,
        organizationId: req.organizationId,
      });

      return ResponseUtil.success(
        res,
        { entryTypeMaterials },
        "Entry type materials retrieved successfully"
      );
    } catch (error: any) {
      logger.error("Get entry type materials error", {
        error: error.message,
      });
      return ResponseUtil.error(res, error.message);
    }
  };

  // GET /api/entry-type-materials/grouped - Get materials grouped by entry type
  getEntryTypeMaterialsGrouped = async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      logger.info("Fetching grouped entry type materials", {
        userId: req.user?.id,
        organizationId: req.organizationId,
      });

      if (!req.user || !req.organizationId) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      const groupedMaterials =
        await this.entryTypeMaterialService.getMaterialsByEntryTypeGrouped(
          req.organizationId
        );

      logger.info("Grouped entry type materials retrieved successfully", {
        userId: req.user?.id,
        organizationId: req.organizationId,
      });

      return ResponseUtil.success(
        res,
        { groupedMaterials },
        "Grouped entry type materials retrieved successfully"
      );
    } catch (error: any) {
      logger.error("Get grouped entry type materials error", {
        error: error.message,
      });
      return ResponseUtil.error(res, error.message);
    }
  };

  // GET /api/entry-type-materials/by-entry-type/:entryType - Get materials for specific entry type
  getEntryTypeMaterialsByType = async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      logger.info("Fetching entry type materials by type", {
        userId: req.user?.id,
        organizationId: req.organizationId,
        entryType: req.params.entryType,
      });

      if (!req.user || !req.organizationId) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      const { entryType } = req.params;

      // Validate entry type
      if (!Object.values(EntryType).includes(entryType as EntryType)) {
        return ResponseUtil.badRequest(res, "Invalid entry type");
      }

      const entryTypeMaterials =
        await this.entryTypeMaterialService.getEntryTypeMaterialsByEntryType(
          req.organizationId,
          entryType as EntryType
        );

      logger.info("Entry type materials by type retrieved successfully", {
        userId: req.user?.id,
        organizationId: req.organizationId,
        entryType: req.params.entryType,
      });

      return ResponseUtil.success(
        res,
        { entryTypeMaterials, entryType },
        `Materials for ${entryType} retrieved successfully`
      );
    } catch (error: any) {
      logger.error("Get entry type materials by type error", {
        error: error.message,
      });
      return ResponseUtil.error(res, error.message);
    }
  };

  // POST /api/entry-type-materials - Create new entry-type-material mapping
  createEntryTypeMaterial = async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      logger.info("Creating entry type material", {
        userId: req.user?.id,
        organizationId: req.organizationId,
        body: req.body,
      });

      if (!req.user || !req.organizationId) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      const { entryType, materialRateId } = req.body;

      if (!entryType || !materialRateId) {
        return ResponseUtil.badRequest(
          res,
          "Entry type and material rate ID are required"
        );
      }

      // Validate entry type
      if (!Object.values(EntryType).includes(entryType as EntryType)) {
        return ResponseUtil.badRequest(res, "Invalid entry type");
      }

      const entryTypeMaterial =
        await this.entryTypeMaterialService.createEntryTypeMaterial({
          organizationId: req.organizationId,
          entryType: entryType as EntryType,
          materialRateId,
        });

      logger.info("Entry type material created successfully", {
        userId: req.user?.id,
        organizationId: req.organizationId,
      });

      return ResponseUtil.success(
        res,
        { entryTypeMaterial },
        "Entry type material mapping created successfully",
        201
      );
    } catch (error: any) {
      logger.error("Create entry type material error", {
        error: error.message,
      });
      return ResponseUtil.badRequest(res, error.message);
    }
  };

  // POST /api/entry-type-materials/bulk - Create multiple mappings at once
  createBulkEntryTypeMaterials = async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      logger.info("Creating bulk entry type materials", {
        userId: req.user?.id,
        organizationId: req.organizationId,
        body: req.body,
      });

      if (!req.user || !req.organizationId) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      const { mappings } = req.body;

      if (!mappings || !Array.isArray(mappings)) {
        return ResponseUtil.badRequest(res, "Mappings array is required");
      }

      // Validate mappings structure
      for (const mapping of mappings) {
        if (
          !mapping.entryType ||
          !mapping.materialRateIds ||
          !Array.isArray(mapping.materialRateIds)
        ) {
          return ResponseUtil.badRequest(
            res,
            "Each mapping must have entryType and materialRateIds array"
          );
        }

        if (
          !Object.values(EntryType).includes(mapping.entryType as EntryType)
        ) {
          return ResponseUtil.badRequest(
            res,
            `Invalid entry type: ${mapping.entryType}`
          );
        }
      }

      const result =
        await this.entryTypeMaterialService.createBulkEntryTypeMaterials(
          req.organizationId,
          mappings
        );

      logger.info("Bulk entry type materials created successfully", {
        userId: req.user?.id,
        organizationId: req.organizationId,
      });

      return ResponseUtil.success(
        res,
        { created: result.count },
        `${result.count} entry type material mappings created successfully`,
        201
      );
    } catch (error: any) {
      logger.error("Create bulk entry type materials error", {
        error: error.message,
      });
      return ResponseUtil.badRequest(res, error.message);
    }
  };

  // GET /api/entry-type-materials/:id - Get specific entry-type-material mapping
  getEntryTypeMaterialById = async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      logger.info("Fetching entry type material by ID", {
        userId: req.user?.id,
        organizationId: req.organizationId,
        id: req.params.id,
      });

      const { id } = req.params;

      if (!req.user || !req.organizationId) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      const entryTypeMaterial =
        await this.entryTypeMaterialService.getEntryTypeMaterialById(id);

      if (!entryTypeMaterial) {
        return ResponseUtil.notFound(
          res,
          "Entry type material mapping not found"
        );
      }

      // Check if user has access to this mapping
      if (entryTypeMaterial.organizationId !== req.organizationId) {
        return ResponseUtil.forbidden(res, "Access denied");
      }

      logger.info("Entry type material by ID retrieved successfully", {
        userId: req.user?.id,
        organizationId: req.organizationId,
        id: req.params.id,
      });

      return ResponseUtil.success(
        res,
        { entryTypeMaterial },
        "Entry type material mapping retrieved successfully"
      );
    } catch (error: any) {
      logger.error("Get entry type material by ID error", {
        error: error.message,
      });
      return ResponseUtil.error(res, error.message);
    }
  };

  // PUT /api/entry-type-materials/:id - Update entry-type-material mapping
  updateEntryTypeMaterial = async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      logger.info("Updating entry type material", {
        userId: req.user?.id,
        organizationId: req.organizationId,
        id: req.params.id,
        body: req.body,
      });

      const { id } = req.params;
      const updateData = req.body;

      if (!req.user || !req.organizationId) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      const existingMapping =
        await this.entryTypeMaterialService.getEntryTypeMaterialById(id);
      if (!existingMapping) {
        return ResponseUtil.notFound(
          res,
          "Entry type material mapping not found"
        );
      }

      // Check access permissions
      if (existingMapping.organizationId !== req.organizationId) {
        return ResponseUtil.forbidden(res, "Access denied");
      }

      // Only owners can modify mappings
      if (req.user.role !== "owner") {
        return ResponseUtil.forbidden(
          res,
          "Only organization owners can modify material mappings"
        );
      }

      const entryTypeMaterial =
        await this.entryTypeMaterialService.updateEntryTypeMaterial(
          id,
          updateData
        );

      logger.info("Entry type material updated successfully", {
        userId: req.user?.id,
        organizationId: req.organizationId,
        id: req.params.id,
      });

      return ResponseUtil.success(
        res,
        { entryTypeMaterial },
        "Entry type material mapping updated successfully"
      );
    } catch (error: any) {
      logger.error("Update entry type material error", {
        error: error.message,
      });
      return ResponseUtil.badRequest(res, error.message);
    }
  };

  // DELETE /api/entry-type-materials/:id - Delete (deactivate) entry-type-material mapping
  deleteEntryTypeMaterial = async (
    req: AuthenticatedRequest,
    res: Response
  ) => {
    try {
      logger.info("Deleting entry type material", {
        userId: req.user?.id,
        organizationId: req.organizationId,
        id: req.params.id,
      });

      const { id } = req.params;

      if (!req.user || !req.organizationId) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      const existingMapping =
        await this.entryTypeMaterialService.getEntryTypeMaterialById(id);
      if (!existingMapping) {
        return ResponseUtil.notFound(
          res,
          "Entry type material mapping not found"
        );
      }

      // Check access permissions
      if (existingMapping.organizationId !== req.organizationId) {
        return ResponseUtil.forbidden(res, "Access denied");
      }

      // Only owners can delete mappings
      if (req.user.role !== "owner") {
        return ResponseUtil.forbidden(
          res,
          "Only organization owners can delete material mappings"
        );
      }

      await this.entryTypeMaterialService.deleteEntryTypeMaterial(id);

      logger.info("Entry type material deleted successfully", {
        userId: req.user?.id,
        organizationId: req.organizationId,
        id: req.params.id,
      });

      return ResponseUtil.success(
        res,
        null,
        "Entry type material mapping deleted successfully"
      );
    } catch (error: any) {
      logger.error("Delete entry type material error", {
        error: error.message,
      });
      return ResponseUtil.badRequest(res, error.message);
    }
  };
}
