import { EntryType, EntryTypeMaterial, Prisma } from "@prisma/client";
import { prisma } from "../utils/database";

export class EntryTypeMaterialDAO {
  async create(
    data: Prisma.EntryTypeMaterialCreateInput
  ): Promise<EntryTypeMaterial> {
    return await prisma.entryTypeMaterial.create({
      data,
      include: {
        organization: true,
        materialRate: true,
      },
    });
  }

  async findById(id: string): Promise<EntryTypeMaterial | null> {
    return await prisma.entryTypeMaterial.findUnique({
      where: { id },
      include: {
        organization: true,
        materialRate: true,
      },
    });
  }

  async findByOrganization(
    organizationId: string
  ): Promise<EntryTypeMaterial[]> {
    return await prisma.entryTypeMaterial.findMany({
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
  }

  async findByEntryType(
    organizationId: string,
    entryType: EntryType
  ): Promise<EntryTypeMaterial[]> {
    return await prisma.entryTypeMaterial.findMany({
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
  }

  async findByMaterialRateId(
    materialRateId: string
  ): Promise<EntryTypeMaterial[]> {
    return await prisma.entryTypeMaterial.findMany({
      where: {
        materialRateId,
        isActive: true,
      },
      include: {
        organization: true,
        materialRate: true,
      },
    });
  }

  async update(
    id: string,
    data: Prisma.EntryTypeMaterialUpdateInput
  ): Promise<EntryTypeMaterial> {
    return await prisma.entryTypeMaterial.update({
      where: { id },
      data,
      include: {
        organization: true,
        materialRate: true,
      },
    });
  }

  async delete(id: string): Promise<EntryTypeMaterial> {
    return await prisma.entryTypeMaterial.update({
      where: { id },
      data: { isActive: false },
      include: {
        organization: true,
        materialRate: true,
      },
    });
  }

  async findExisting(
    organizationId: string,
    entryType: EntryType,
    materialRateId: string
  ): Promise<EntryTypeMaterial | null> {
    return await prisma.entryTypeMaterial.findUnique({
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
  }

  async createBulk(
    data: Prisma.EntryTypeMaterialCreateManyInput[]
  ): Promise<{ count: number }> {
    return await prisma.entryTypeMaterial.createMany({
      data,
      skipDuplicates: true,
    });
  }
}
