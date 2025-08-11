import { EntryType, EntryTypeMaterial, Prisma } from "@prisma/client";
import { EntryTypeMaterialDAO } from "../dao/entryTypeMaterialDAO";

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
    // Check if the combination already exists
    const existing = await this.entryTypeMaterialDAO.findExisting(
      data.organizationId,
      data.entryType,
      data.materialRateId
    );

    if (existing) {
      if (existing.isActive) {
        throw new Error("This material is already linked to the entry type");
      } else {
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

    return await this.entryTypeMaterialDAO.create(createData);
  }

  async getEntryTypeMaterialsByOrganization(
    organizationId: string
  ): Promise<any[]> {
    return await this.entryTypeMaterialDAO.findByOrganization(organizationId);
  }

  async getEntryTypeMaterialsByEntryType(
    organizationId: string,
    entryType: EntryType
  ): Promise<any[]> {
    return await this.entryTypeMaterialDAO.findByEntryType(
      organizationId,
      entryType
    );
  }

  async getEntryTypeMaterialById(id: string): Promise<any | null> {
    return await this.entryTypeMaterialDAO.findById(id);
  }

  async updateEntryTypeMaterial(
    id: string,
    data: Partial<CreateEntryTypeMaterialRequest>
  ): Promise<any> {
    const updateData: Prisma.EntryTypeMaterialUpdateInput = {};

    if (data.entryType) {
      updateData.entryType = data.entryType;
    }

    if (data.materialRateId) {
      updateData.materialRate = {
        connect: { id: data.materialRateId },
      };
    }

    return await this.entryTypeMaterialDAO.update(id, updateData);
  }

  async deleteEntryTypeMaterial(id: string): Promise<any> {
    return await this.entryTypeMaterialDAO.delete(id);
  }

  // Helper method to get materials grouped by entry type
  async getMaterialsByEntryTypeGrouped(
    organizationId: string
  ): Promise<Record<string, any[]>> {
    const allMaterials = await this.getEntryTypeMaterialsByOrganization(
      organizationId
    );

    return allMaterials.reduce((grouped, material) => {
      const entryTypeKey = material.entryType;
      if (!grouped[entryTypeKey]) {
        grouped[entryTypeKey] = [];
      }
      grouped[entryTypeKey].push(material);
      return grouped;
    }, {} as Record<string, any[]>);
  }

  // Method to create multiple entry-type-material relationships at once
  async createBulkEntryTypeMaterials(
    organizationId: string,
    mappings: { entryType: EntryType; materialRateIds: string[] }[]
  ): Promise<{ count: number }> {
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

    return await this.entryTypeMaterialDAO.createBulk(createData);
  }
}
