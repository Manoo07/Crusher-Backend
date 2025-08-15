import { Prisma, User } from "@prisma/client";
import { UserFilters } from "../types";
import { DatabaseWrapper, prisma } from "../utils/database";

export class UserDAO {
  async create(data: Prisma.UserCreateInput): Promise<User> {
    return await DatabaseWrapper.executeWithRetry(
      () =>
        prisma.user.create({
          data,
          include: {
            organization: true,
            ownedOrganization: true,
          },
        }),
      "UserDAO.create"
    );
  }

  async findById(id: string): Promise<User | null> {
    return await DatabaseWrapper.executeWithRetry(
      () =>
        prisma.user.findUnique({
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
        }),
      "UserDAO.findById"
    );
  }

  async findByUsername(username: string): Promise<User | null> {
    return await DatabaseWrapper.executeWithRetry(
      () =>
        prisma.user.findUnique({
          where: { username },
          include: {
            organization: true,
            ownedOrganization: true,
          },
        }),
      "UserDAO.findByUsername"
    );
  }

  async findAll(
    filters: UserFilters
  ): Promise<{ users: User[]; total: number }> {
    return await DatabaseWrapper.executeWithRetry(async () => {
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
    }, "UserDAO.findAll");
  }

  async findByOrganizationId(organizationId: string): Promise<User[]> {
    return await DatabaseWrapper.executeWithRetry(
      () =>
        prisma.user.findMany({
          where: { organizationId },
          include: {
            organization: true,
          },
        }),
      "UserDAO.findByOrganizationId"
    );
  }

  async update(id: string, data: Prisma.UserUpdateInput): Promise<User> {
    return await DatabaseWrapper.executeWithRetry(
      () =>
        prisma.user.update({
          where: { id },
          data,
          include: {
            organization: true,
            ownedOrganization: true,
          },
        }),
      "UserDAO.update"
    );
  }

  async updateLastLogin(id: string): Promise<User> {
    return await DatabaseWrapper.executeWithRetry(
      () =>
        prisma.user.update({
          where: { id },
          data: { lastLogin: new Date() },
          include: {
            organization: true,
          },
        }),
      "UserDAO.updateLastLogin"
    );
  }

  async delete(id: string): Promise<User> {
    return await DatabaseWrapper.executeWithRetry(
      () =>
        prisma.user.delete({
          where: { id },
        }),
      "UserDAO.delete"
    );
  }

  async checkUsernameExists(
    username: string,
    excludeId?: string
  ): Promise<boolean> {
    return await DatabaseWrapper.executeWithRetry(async () => {
      const user = await prisma.user.findFirst({
        where: {
          username,
          ...(excludeId && { id: { not: excludeId } }),
        },
      });
      return !!user;
    }, "UserDAO.checkUsernameExists");
  }

  async deactivateUser(id: string): Promise<User> {
    return await DatabaseWrapper.executeWithRetry(
      () =>
        prisma.user.update({
          where: { id },
          data: { isActive: false },
        }),
      "UserDAO.deactivateUser"
    );
  }

  async activateUser(id: string): Promise<User> {
    return await DatabaseWrapper.executeWithRetry(
      () =>
        prisma.user.update({
          where: { id },
          data: { isActive: true },
        }),
      "UserDAO.activateUser"
    );
  }
}
