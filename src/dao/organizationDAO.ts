import { Organization, Prisma } from "@prisma/client";
import { PaginationParams } from "../types";
import { prisma } from "../utils/database";

export class OrganizationDAO {
  async create(data: Prisma.OrganizationCreateInput): Promise<Organization> {
    return await prisma.organization.create({
      data,
      include: {
        owner: true,
        _count: {
          select: {
            users: true,
            truckEntries: true,
            materialRates: true,
            otherExpenses: true,
          },
        },
      },
    });
  }

  async findById(id: string): Promise<Organization | null> {
    return await prisma.organization.findUnique({
      where: { id },
      include: {
        owner: true,
        users: true,
        _count: {
          select: {
            truckEntries: true,
            materialRates: true,
            otherExpenses: true,
          },
        },
      },
    });
  }

  async findByOwnerId(ownerId: string): Promise<Organization | null> {
    return await prisma.organization.findUnique({
      where: { ownerId },
      include: {
        owner: true,
        users: true,
      },
    });
  }

  async findAll(
    params: PaginationParams
  ): Promise<{ organizations: Organization[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = params;
    const skip = (page - 1) * limit;

    const [organizations, total] = await Promise.all([
      prisma.organization.findMany({
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          owner: true,
          _count: {
            select: {
              users: true,
              truckEntries: true,
              materialRates: true,
              otherExpenses: true,
            },
          },
        },
      }),
      prisma.organization.count(),
    ]);

    return { organizations, total };
  }

  async update(
    id: string,
    data: Prisma.OrganizationUpdateInput
  ): Promise<Organization> {
    return await prisma.organization.update({
      where: { id },
      data,
      include: {
        owner: true,
        users: true,
      },
    });
  }

  async delete(id: string): Promise<Organization> {
    return await prisma.organization.delete({
      where: { id },
    });
  }

  async checkNameExists(name: string, excludeId?: string): Promise<boolean> {
    const organization = await prisma.organization.findFirst({
      where: {
        name,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });
    return !!organization;
  }
}
