import { MaterialRate, Prisma } from "@prisma/client";
import { MaterialRateFilters } from "../types";
import { prisma } from "../utils/database";

export class MaterialRateDAO {
  async create(data: Prisma.MaterialRateCreateInput): Promise<MaterialRate> {
    return await prisma.materialRate.create({
      data,
      include: {
        organization: true,
      },
    });
  }

  async findById(id: string): Promise<MaterialRate | null> {
    return await prisma.materialRate.findUnique({
      where: { id },
      include: {
        organization: true,
      },
    });
  }

  async findAll(
    filters: MaterialRateFilters
  ): Promise<{ rates: MaterialRate[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      materialType,
      isActive,
    } = filters;

    const skip = (page - 1) * limit;
    const where: Prisma.MaterialRateWhereInput = {};

    if (materialType)
      where.materialType = { contains: materialType, mode: "insensitive" };
    if (typeof isActive === "boolean") where.isActive = isActive;

    const [rates, total] = await Promise.all([
      prisma.materialRate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          organization: true,
        },
      }),
      prisma.materialRate.count({ where }),
    ]);

    return { rates, total };
  }

  async findByOrganizationId(
    organizationId: string,
    filters: MaterialRateFilters
  ): Promise<{ rates: MaterialRate[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      materialType,
      isActive,
    } = filters;

    const skip = (page - 1) * limit;
    const where: Prisma.MaterialRateWhereInput = { organizationId };

    if (materialType)
      where.materialType = { contains: materialType, mode: "insensitive" };
    if (typeof isActive === "boolean") where.isActive = isActive;

    const [rates, total] = await Promise.all([
      prisma.materialRate.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          organization: true,
        },
      }),
      prisma.materialRate.count({ where }),
    ]);

    return { rates, total };
  }

  async findByOrganizationAndMaterial(
    organizationId: string,
    materialType: string
  ): Promise<MaterialRate | null> {
    return await prisma.materialRate.findUnique({
      where: {
        organizationId_materialType: {
          organizationId,
          materialType,
        },
      },
      include: {
        organization: true,
      },
    });
  }

  async update(
    id: string,
    data: Prisma.MaterialRateUpdateInput
  ): Promise<MaterialRate> {
    return await prisma.materialRate.update({
      where: { id },
      data,
      include: {
        organization: true,
      },
    });
  }

  async delete(id: string): Promise<MaterialRate> {
    return await prisma.materialRate.delete({
      where: { id },
    });
  }

  async deactivate(id: string): Promise<MaterialRate> {
    return await prisma.materialRate.update({
      where: { id },
      data: { isActive: false },
      include: {
        organization: true,
      },
    });
  }

  async activate(id: string): Promise<MaterialRate> {
    return await prisma.materialRate.update({
      where: { id },
      data: { isActive: true },
      include: {
        organization: true,
      },
    });
  }

  async checkMaterialExists(
    organizationId: string,
    materialType: string,
    excludeId?: string
  ): Promise<boolean> {
    const rate = await prisma.materialRate.findFirst({
      where: {
        organizationId,
        materialType,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });
    return !!rate;
  }

  async getActiveMaterialsByOrganization(
    organizationId: string
  ): Promise<MaterialRate[]> {
    return await prisma.materialRate.findMany({
      where: {
        organizationId,
        isActive: true,
      },
      orderBy: { materialType: "asc" },
    });
  }
}
