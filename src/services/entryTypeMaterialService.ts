import { EntryType, EntryTypeMaterial, Prisma } from "@prisma/client";
import { EntryTypeMaterialDAO } from "../dao/entryTypeMaterialDAO";
import { logger } from "../utils/logger";

export interface CreateEntryTypeMaterialRequest {
  organizationId: string;
  entryType: EntryType;
  materialRateId: string;
}

export type EntryTypeMaterialWithRelations = EntryTypeMaterial & {
  organization: {
    id: string;
    name: string;
    ownerId: string;
    createdAt: Date;
    updatedAt: Date;
  };
  materialRate: {
    id: string;
    organizationId: string;
    materialType: string;
    ratePerUnit: any;
    unitType: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  };
};

export class EntryTypeMaterialService {
  private entryTypeMaterialDAO: EntryTypeMaterialDAO;

  constructor() {
    this.entryTypeMaterialDAO = new EntryTypeMaterialDAO();
  }

  async createEntryTypeMaterial(
    data: CreateEntryTypeMaterialRequest
  ): Promise<any> {
    logger.info("Creating entry type material", { data });

    // Check if the combination already exists
    const existing = await this.entryTypeMaterialDAO.findExisting(
      data.organizationId,
      data.entryType,
      data.materialRateId
    );

    if (existing) {
      if (existing.isActive) {
        logger.warn("Entry type material already exists and is active", {
          existing,
        });
        throw new Error("This material is already linked to the entry type");
      } else {
        logger.info("Reactivating previously deactivated entry type material", {
          existing,
        });
        // Reactivate if it was previously deactivated
        return await this.entryTypeMaterialDAO.update(existing.id, {
          isActive: true,
        });
      }
    }

    const createData: Prisma.EntryTypeMaterialCreateInput = {
      entryType: data.entryType,
      organization: {
        connect: { id: data.organizationId },
      },
      materialRate: {
        connect: { id: data.materialRateId },
      },
    };

    const result = await this.entryTypeMaterialDAO.create(createData);
    logger.info("Entry type material created successfully", { result });
    return result;
  }

  async getEntryTypeMaterialsByOrganization(
    organizationId: string
  ): Promise<any[]> {
    logger.info("Fetching entry type materials by organization", {
      organizationId,
    });
    const result = await this.entryTypeMaterialDAO.findByOrganization(
      organizationId
    );
    logger.info("Entry type materials retrieved successfully", {
      count: result.length,
    });
    return result;
  }

  async getEntryTypeMaterialsByEntryType(
    organizationId: string,
    entryType: EntryType
  ): Promise<any[]> {
    logger.info("Fetching entry type materials by entry type", {
      organizationId,
      entryType,
    });
    const result = await this.entryTypeMaterialDAO.findByEntryType(
      organizationId,
      entryType
    );
    logger.info("Entry type materials retrieved successfully", {
      count: result.length,
    });
    return result;
  }

  async getEntryTypeMaterialById(id: string): Promise<any | null> {
    logger.info("Fetching entry type material by ID", { id });
    const result = await this.entryTypeMaterialDAO.findById(id);
    if (result) {
      logger.info("Entry type material found", { result });
    } else {
      logger.warn("Entry type material not found", { id });
    }
    return result;
  }

  async updateEntryTypeMaterial(
    id: string,
    data: Partial<CreateEntryTypeMaterialRequest>
  ): Promise<any> {
    logger.info("Updating entry type material", { id, data });

    const updateData: Prisma.EntryTypeMaterialUpdateInput = {};

    if (data.entryType) {
      updateData.entryType = data.entryType;
    }

    if (data.materialRateId) {
      updateData.materialRate = {
        connect: { id: data.materialRateId },
      };
    }

    const result = await this.entryTypeMaterialDAO.update(id, updateData);
    logger.info("Entry type material updated successfully", { result });
    return result;
  }

  async deleteEntryTypeMaterial(id: string): Promise<any> {
    logger.info("Deleting entry type material", { id });
    const result = await this.entryTypeMaterialDAO.delete(id);
    logger.info("Entry type material deleted successfully", { result });
    return result;
  }

  // Helper method to get materials grouped by entry type
  async getMaterialsByEntryTypeGrouped(
    organizationId: string
  ): Promise<Record<string, any[]>> {
    logger.info("Fetching materials grouped by entry type", { organizationId });
    const allMaterials = await this.getEntryTypeMaterialsByOrganization(
      organizationId
    );

    const grouped = allMaterials.reduce((grouped, material) => {
      const entryTypeKey = material.entryType;
      if (!grouped[entryTypeKey]) {
        grouped[entryTypeKey] = [];
      }
      grouped[entryTypeKey].push(material);
      return grouped;
    }, {} as Record<string, any[]>);

    logger.info("Materials grouped by entry type successfully", { grouped });
    return grouped;
  }

  // Method to create multiple entry-type-material relationships at once
  async createBulkEntryTypeMaterials(
    organizationId: string,
    mappings: { entryType: EntryType; materialRateIds: string[] }[]
  ): Promise<{ count: number }> {
    logger.info("Creating bulk entry type materials", {
      organizationId,
      mappings,
    });

    const createData: Prisma.EntryTypeMaterialCreateManyInput[] = [];

    for (const mapping of mappings) {
      for (const materialRateId of mapping.materialRateIds) {
        createData.push({
          organizationId,
          entryType: mapping.entryType,
          materialRateId,
        });
      }
    }

    const result = await this.entryTypeMaterialDAO.createBulk(createData);
    logger.info("Bulk entry type materials created successfully", {
      count: result.count,
    });
    return result;
  }
}
