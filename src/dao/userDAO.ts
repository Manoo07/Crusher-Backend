import { Prisma, User } from "@prisma/client";
import { UserFilters } from "../types";
import { prisma } from "../utils/database";

export class UserDAO {
  async create(data: Prisma.UserCreateInput): Promise<User> {
    return await prisma.user.create({
      data,
      include: {
        organization: true,
        ownedOrganization: true,
      },
    });
  }

  async findById(id: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        organization: true,
        ownedOrganization: true,
        _count: {
          select: {
            truckEntries: true,
            otherExpenses: true,
          },
        },
      },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return await prisma.user.findUnique({
      where: { username },
      include: {
        organization: true,
        ownedOrganization: true,
      },
    });
  }

  async findAll(
    filters: UserFilters
  ): Promise<{ users: User[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = "desc",
      role,
      isActive,
      organizationId,
    } = filters;

    const skip = (page - 1) * limit;
    const where: Prisma.UserWhereInput = {};

    if (role) where.role = role as any;
    if (typeof isActive === "boolean") where.isActive = isActive;
    if (organizationId) where.organizationId = organizationId;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          organization: true,
          _count: {
            select: {
              truckEntries: true,
              otherExpenses: true,
            },
          },
        },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  async findByOrganizationId(organizationId: string): Promise<User[]> {
    return await prisma.user.findMany({
      where: { organizationId },
      include: {
        organization: true,
      },
    });
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return await prisma.user.update({
      where: { id },
      data,
      include: {
        organization: true,
        ownedOrganization: true,
      },
    });
  }

  async updateLastLogin(id: string): Promise<User> {
    return await prisma.user.update({
      where: { id },
      data: { lastLogin: new Date() },
      include: {
        organization: true,
      },
    });
  }

  async delete(id: string): Promise<User> {
    return await prisma.user.delete({
      where: { id },
    });
  }

  async checkUsernameExists(
    username: string,
    excludeId?: string
  ): Promise<boolean> {
    const user = await prisma.user.findFirst({
      where: {
        username,
        ...(excludeId && { id: { not: excludeId } }),
      },
    });
    return !!user;
  }

  async deactivateUser(id: string): Promise<User> {
    return await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async activateUser(id: string): Promise<User> {
    return await prisma.user.update({
      where: { id },
      data: { isActive: true },
    });
  }
}
