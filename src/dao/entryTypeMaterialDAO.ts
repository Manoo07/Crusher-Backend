import { EntryType, EntryTypeMaterial, Prisma } from "@prisma/client";
import { prisma } from "../utils/database";
import { logger } from "../utils/logger";

export class EntryTypeMaterialDAO {
  async create(
    data: Prisma.EntryTypeMaterialCreateInput
  ): Promise<EntryTypeMaterial> {
    logger.info("Creating entry type material in DAO", { data });
    const result = await prisma.entryTypeMaterial.create({
      data,
      include: {
        organization: true,
        materialRate: true,
      },
    });
    logger.info("Entry type material created successfully in DAO", { result });
    return result;
  }

  async findById(id: string): Promise<EntryTypeMaterial | null> {
    logger.info("Fetching entry type material by ID in DAO", { id });
    const result = await prisma.entryTypeMaterial.findUnique({
      where: { id },
      include: {
        organization: true,
        materialRate: true,
      },
    });
    if (result) {
      logger.info("Entry type material found in DAO", { result });
    } else {
      logger.warn("Entry type material not found in DAO", { id });
    }
    return result;
  }

  async findByOrganization(
    organizationId: string
  ): Promise<EntryTypeMaterial[]> {
    logger.info("Fetching entry type materials by organization in DAO", {
      organizationId,
    });
    const result = await prisma.entryTypeMaterial.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      include: {
        organization: true,
        materialRate: true,
      },
      orderBy: [
        { entryType: "asc" },
        { materialRate: { materialType: "asc" } },
      ],
    });
    logger.info("Entry type materials retrieved successfully in DAO", {
      count: result.length,
    });
    return result;
  }

  async findByEntryType(
    organizationId: string,
    entryType: EntryType
  ): Promise<EntryTypeMaterial[]> {
    logger.info("Fetching entry type materials by entry type in DAO", {
      organizationId,
      entryType,
    });
    const result = await prisma.entryTypeMaterial.findMany({
      where: {
        organizationId,
        entryType,
        isActive: true,
      },
      include: {
        organization: true,
        materialRate: true,
      },
      orderBy: {
        materialRate: { materialType: "asc" },
      },
    });
    logger.info("Entry type materials retrieved successfully in DAO", {
      count: result.length,
    });
    return result;
  }

  async findByMaterialRateId(
    materialRateId: string
  ): Promise<EntryTypeMaterial[]> {
    logger.info("Fetching entry type materials by material rate ID in DAO", {
      materialRateId,
    });
    const result = await prisma.entryTypeMaterial.findMany({
      where: {
        materialRateId,
        isActive: true,
      },
      include: {
        organization: true,
        materialRate: true,
      },
    });
    logger.info("Entry type materials retrieved successfully in DAO", {
      count: result.length,
    });
    return result;
  }

  async update(
    id: string,
    data: Prisma.EntryTypeMaterialUpdateInput
  ): Promise<EntryTypeMaterial> {
    logger.info("Updating entry type material in DAO", { id, data });
    const result = await prisma.entryTypeMaterial.update({
      where: { id },
      data,
      include: {
        organization: true,
        materialRate: true,
      },
    });
    logger.info("Entry type material updated successfully in DAO", { result });
    return result;
  }

  async delete(id: string): Promise<EntryTypeMaterial> {
    logger.info("Deleting entry type material in DAO", { id });
    const result = await prisma.entryTypeMaterial.delete({
      where: { id },
      include: {
        organization: true,
        materialRate: true,
      },
    });
    logger.info("Entry type material deleted successfully in DAO", { result });
    return result;
  }

  async findExisting(
    organizationId: string,
    entryType: EntryType,
    materialRateId: string
  ): Promise<EntryTypeMaterial | null> {
    logger.info("Checking for existing entry type material in DAO", {
      organizationId,
      entryType,
      materialRateId,
    });
    const result = await prisma.entryTypeMaterial.findUnique({
      where: {
        organizationId_entryType_materialRateId: {
          organizationId,
          entryType,
          materialRateId,
        },
      },
      include: {
        organization: true,
        materialRate: true,
      },
    });
    if (result) {
      logger.info("Existing entry type material found in DAO", { result });
    } else {
      logger.warn("No existing entry type material found in DAO", {
        organizationId,
        entryType,
        materialRateId,
      });
    }
    return result;
  }

  async createBulk(
    data: Prisma.EntryTypeMaterialCreateManyInput[]
  ): Promise<{ count: number }> {
    logger.info("Creating bulk entry type materials in DAO", { data });
    const result = await prisma.entryTypeMaterial.createMany({
      data,
      skipDuplicates: true,
    });
    logger.info("Bulk entry type materials created successfully in DAO", {
      count: result.count,
    });
    return result;
  }
}
