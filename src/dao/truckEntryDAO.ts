import { Prisma, TruckEntry } from "@prisma/client";
import { TruckEntryFilters } from "../types";
import { prisma } from "../utils/database";

export class TruckEntryDAO {
  async create(data: Prisma.TruckEntryCreateInput): Promise<TruckEntry> {
    return await prisma.truckEntry.create({
      data,
      include: {
        organization: true,
        user: true,
      },
    });
  }

  async findById(id: string): Promise<TruckEntry | null> {
    return await prisma.truckEntry.findUnique({
      where: { id },
      include: {
        organization: true,
        user: true,
      },
    });
  }

  async findAll(
    filters: TruckEntryFilters
  ): Promise<{ entries: TruckEntry[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      entryType,
      materialType,
      status,
      startDate,
      endDate,
      userId,
    } = filters;

    const skip = (page - 1) * limit;
    const where: Prisma.TruckEntryWhereInput = {};

    if (entryType) where.entryType = entryType as any;
    if (materialType) where.materialType = materialType;
    if (status) where.status = status as any;
    if (userId) where.userId = userId;

    if (startDate || endDate) {
      where.entryDate = {};
      if (startDate) where.entryDate.gte = new Date(startDate);
      if (endDate) where.entryDate.lte = new Date(endDate);
    }

    const [entries, total] = await Promise.all([
      prisma.truckEntry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          organization: true,
          user: true,
        },
      }),
      prisma.truckEntry.count({ where }),
    ]);

    return { entries, total };
  }

  async findByOrganizationId(
    organizationId: string,
    filters: TruckEntryFilters
  ): Promise<{ entries: TruckEntry[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      entryType,
      materialType,
      status,
      startDate,
      endDate,
      userId,
    } = filters;

    const skip = (page - 1) * limit;
    const where: Prisma.TruckEntryWhereInput = { organizationId };

    if (entryType) where.entryType = entryType as any;
    if (materialType) where.materialType = materialType;
    if (status) where.status = status as any;
    if (userId) where.userId = userId;

    if (startDate || endDate) {
      where.entryDate = {};
      if (startDate) where.entryDate.gte = new Date(startDate);
      if (endDate) where.entryDate.lte = new Date(endDate);
    }

    const [entries, total] = await Promise.all([
      prisma.truckEntry.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          organization: true,
          user: true,
        },
      }),
      prisma.truckEntry.count({ where }),
    ]);

    return { entries, total };
  }

  async update(
    id: string,
    data: Prisma.TruckEntryUpdateInput
  ): Promise<TruckEntry> {
    return await prisma.truckEntry.update({
      where: { id },
      data,
      include: {
        organization: true,
        user: true,
      },
    });
  }

  async delete(id: string): Promise<TruckEntry> {
    return await prisma.truckEntry.delete({
      where: { id },
      include: {
        organization: true,
        user: true,
      },
    });
  }

  async getStatsByOrganization(
    organizationId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<any> {
    const where: Prisma.TruckEntryWhereInput = {
      organizationId,
      status: "active",
    };

    if (startDate || endDate) {
      where.entryDate = {};
      if (startDate) where.entryDate.gte = startDate;
      if (endDate) where.entryDate.lte = endDate;
    }

    const [totalEntries, totalAmount, salesEntries, rawStoneEntries] =
      await Promise.all([
        prisma.truckEntry.count({ where }),
        prisma.truckEntry.aggregate({
          where,
          _sum: { totalAmount: true },
        }),
        prisma.truckEntry.count({
          where: { ...where, entryType: "Sales" },
        }),
        prisma.truckEntry.count({
          where: { ...where, entryType: "RawStone" },
        }),
      ]);

    return {
      totalEntries,
      totalAmount: totalAmount._sum.totalAmount || 0,
      salesEntries,
      rawStoneEntries,
    };
  }
}
