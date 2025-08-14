import { Prisma, User } from "@prisma/client";
import { OrganizationDAO } from "../dao/organizationDAO";
import { UserDAO } from "../dao/userDAO";
import { UserFilters } from "../types";
import { logger } from "../utils/logger";
import { ValidationUtil } from "../utils/validation";

export class UserService {
  private userDAO: UserDAO;
  private organizationDAO: OrganizationDAO;

  constructor() {
    this.userDAO = new UserDAO();
    this.organizationDAO = new OrganizationDAO();
  }

  async createUser(data: {
    username: string;
    passwordHash: string;
    role?: "owner" | "user";
    organizationId?: string;
    profileImage?: string;
  }): Promise<User> {
    logger.info("Creating user", { username: data.username });
    // Validate username
    const usernameValidation = ValidationUtil.validateUsername(data.username);
    if (!usernameValidation.isValid) {
      throw new Error(usernameValidation.message);
    }

    // Check if username already exists
    const usernameExists = await this.userDAO.checkUsernameExists(
      data.username
    );
    if (usernameExists) {
      throw new Error("Username already exists");
    }

    // If organizationId is provided, verify it exists
    if (data.organizationId) {
      const organization = await this.organizationDAO.findById(
        data.organizationId
      );
      if (!organization) {
        throw new Error("Organization not found");
      }
    }

    const createData: Prisma.UserCreateInput = {
      username: data.username.toLowerCase(),
      passwordHash: data.passwordHash,
      role: (data.role as any) || "user",
      profileImage: data.profileImage,
    };

    if (data.organizationId) {
      createData.organization = {
        connect: { id: data.organizationId },
      };
    }

    try {
      const user = await this.userDAO.create(createData);
      logger.info("User created successfully", { userId: user.id });
      return user;
    } catch (error: any) {
      logger.error("Error creating user", { error: error.message });
      throw error;
    }
  }

  async getUserById(id: string): Promise<User | null> {
    if (!id) {
      throw new Error("User ID is required");
    }
    return await this.userDAO.findById(id);
  }

  async getUserByUsername(username: string): Promise<User | null> {
    if (!username) {
      throw new Error("Username is required");
    }
    return await this.userDAO.findByUsername(username.toLowerCase());
  }

  async getAllUsers(filters: UserFilters): Promise<{
    users: User[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const validatedParams = ValidationUtil.validatePaginationParams(filters);
    const validatedFilters: UserFilters = {
      ...validatedParams,
      role: filters.role,
      isActive: filters.isActive,
      organizationId: filters.organizationId,
    };

    const { users, total } = await this.userDAO.findAll(validatedFilters);

    return {
      users,
      pagination: {
        total,
        page: validatedParams.page!,
        limit: validatedParams.limit!,
        totalPages: Math.ceil(total / validatedParams.limit!),
      },
    };
  }

  async getUsersByOrganization(organizationId: string): Promise<User[]> {
    if (!organizationId) {
      throw new Error("Organization ID is required");
    }

    // Verify organization exists
    const organization = await this.organizationDAO.findById(organizationId);
    if (!organization) {
      throw new Error("Organization not found");
    }

    return await this.userDAO.findByOrganizationId(organizationId);
  }

  async updateUser(
    id: string,
    data: {
      username?: string;
      role?: "owner" | "user";
      isActive?: boolean;
      profileImage?: string;
      organizationId?: string;
    }
  ): Promise<User> {
    if (!id) {
      throw new Error("User ID is required");
    }

    // Check if user exists
    const existingUser = await this.userDAO.findById(id);
    if (!existingUser) {
      throw new Error("User not found");
    }

    const updateData: Prisma.UserUpdateInput = {};

    if (data.username !== undefined) {
      const usernameValidation = ValidationUtil.validateUsername(data.username);
      if (!usernameValidation.isValid) {
        throw new Error(usernameValidation.message);
      }

      // Check if new username already exists (excluding current user)
      const usernameExists = await this.userDAO.checkUsernameExists(
        data.username,
        id
      );
      if (usernameExists) {
        throw new Error("Username already exists");
      }

      updateData.username = data.username.toLowerCase();
    }

    if (data.role !== undefined) {
      updateData.role = data.role as any;
    }

    if (data.isActive !== undefined) {
      updateData.isActive = data.isActive;
    }

    if (data.profileImage !== undefined) {
      updateData.profileImage = data.profileImage;
    }

    if (data.organizationId !== undefined) {
      if (data.organizationId) {
        // If organizationId is provided, verify it exists
        const organization = await this.organizationDAO.findById(
          data.organizationId
        );
        if (!organization) {
          throw new Error("Organization not found");
        }
        updateData.organization = {
          connect: { id: data.organizationId },
        };
      } else {
        // If organizationId is null, disconnect from organization
        updateData.organization = {
          disconnect: true,
        };
      }
    }

    return await this.userDAO.update(id, updateData);
  }

  async updateUserPassword(id: string, passwordHash: string): Promise<User> {
    if (!id) {
      throw new Error("User ID is required");
    }

    if (!passwordHash) {
      throw new Error("Password hash is required");
    }

    // Check if user exists
    const existingUser = await this.userDAO.findById(id);
    if (!existingUser) {
      throw new Error("User not found");
    }

    return await this.userDAO.update(id, { passwordHash });
  }

  async updateLastLogin(id: string): Promise<User> {
    if (!id) {
      throw new Error("User ID is required");
    }
    return await this.userDAO.updateLastLogin(id);
  }

  async deactivateUser(id: string): Promise<User> {
    if (!id) {
      throw new Error("User ID is required");
    }

    // Check if user exists
    const existingUser = await this.userDAO.findById(id);
    if (!existingUser) {
      throw new Error("User not found");
    }

    return await this.userDAO.deactivateUser(id);
  }

  async activateUser(id: string): Promise<User> {
    if (!id) {
      throw new Error("User ID is required");
    }

    // Check if user exists
    const existingUser = await this.userDAO.findById(id);
    if (!existingUser) {
      throw new Error("User not found");
    }

    return await this.userDAO.activateUser(id);
  }

  async deleteUser(id: string): Promise<User> {
    if (!id) {
      throw new Error("User ID is required");
    }

    // Check if user exists
    const existingUser = await this.userDAO.findById(id);
    if (!existingUser) {
      throw new Error("User not found");
    }

    // Note: Consider soft delete vs hard delete based on business requirements
    return await this.userDAO.delete(id);
  }

  async validateUserAccess(
    userId: string,
    targetUserId: string,
    organizationId?: string
  ): Promise<boolean> {
    const user = await this.userDAO.findById(userId);
    if (!user) {
      return false;
    }

    // Users can access their own data
    if (userId === targetUserId) {
      return true;
    }

    // Organization owners can access their organization's users
    if (organizationId) {
      return user.role === "owner" && user.organizationId === organizationId;
    }

    return false;
  }
}
