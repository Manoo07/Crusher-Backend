import { Organization, Prisma } from "@prisma/client";
import { OrganizationDAO } from "../dao/organizationDAO";
import { UserDAO } from "../dao/userDAO";
import { PaginationParams } from "../types";
import { ValidationUtil } from "../utils/validation";

export class OrganizationService {
  private organizationDAO: OrganizationDAO;
  private userDAO: UserDAO;

  constructor() {
    this.organizationDAO = new OrganizationDAO();
    this.userDAO = new UserDAO();
  }

  async createOrganization(data: {
    name: string;
    ownerId: string;
  }): Promise<Organization> {
    // Validate organization name
    if (!data.name || data.name.trim().length === 0) {
      throw new Error("Organization name is required");
    }

    if (data.name.length > 100) {
      throw new Error("Organization name must not exceed 100 characters");
    }

    // Check if name already exists
    const nameExists = await this.organizationDAO.checkNameExists(data.name);
    if (nameExists) {
      throw new Error("Organization name already exists");
    }

    // Verify owner exists
    const owner = await this.userDAO.findById(data.ownerId);
    if (!owner) {
      throw new Error("Owner not found");
    }

    // Check if owner already has an organization
    const existingOrg = await this.organizationDAO.findByOwnerId(data.ownerId);
    if (existingOrg) {
      throw new Error("User already owns an organization");
    }

    return await this.organizationDAO.create({
      name: data.name.trim(),
      owner: {
        connect: { id: data.ownerId },
      },
    });
  }

  async getOrganizationById(id: string): Promise<Organization | null> {
    if (!id) {
      throw new Error("Organization ID is required");
    }
    return await this.organizationDAO.findById(id);
  }

  async getOrganizationByOwnerId(
    ownerId: string
  ): Promise<Organization | null> {
    if (!ownerId) {
      throw new Error("Owner ID is required");
    }
    return await this.organizationDAO.findByOwnerId(ownerId);
  }

  async getAllOrganizations(params: PaginationParams): Promise<{
    organizations: Organization[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const validatedParams = ValidationUtil.validatePaginationParams(params);
    const { organizations, total } = await this.organizationDAO.findAll(
      validatedParams
    );

    return {
      organizations,
      pagination: {
        total,
        page: validatedParams.page!,
        limit: validatedParams.limit!,
        totalPages: Math.ceil(total / validatedParams.limit!),
      },
    };
  }

  async updateOrganization(
    id: string,
    data: { name?: string }
  ): Promise<Organization> {
    if (!id) {
      throw new Error("Organization ID is required");
    }

    // Check if organization exists
    const existingOrg = await this.organizationDAO.findById(id);
    if (!existingOrg) {
      throw new Error("Organization not found");
    }

    const updateData: Prisma.OrganizationUpdateInput = {};

    if (data.name !== undefined) {
      if (!data.name.trim()) {
        throw new Error("Organization name cannot be empty");
      }

      if (data.name.length > 100) {
        throw new Error("Organization name must not exceed 100 characters");
      }

      // Check if new name already exists (excluding current organization)
      const nameExists = await this.organizationDAO.checkNameExists(
        data.name,
        id
      );
      if (nameExists) {
        throw new Error("Organization name already exists");
      }

      updateData.name = data.name.trim();
    }

    return await this.organizationDAO.update(id, updateData);
  }

  async deleteOrganization(id: string): Promise<Organization> {
    if (!id) {
      throw new Error("Organization ID is required");
    }

    // Check if organization exists
    const existingOrg = await this.organizationDAO.findById(id);
    if (!existingOrg) {
      throw new Error("Organization not found");
    }

    // Note: In a real application, you might want to check for existing data
    // and either prevent deletion or cascade delete based on business rules

    return await this.organizationDAO.delete(id);
  }

  async validateOrganizationAccess(
    userId: string,
    organizationId: string
  ): Promise<boolean> {
    const user = await this.userDAO.findById(userId);
    if (!user) {
      return false;
    }

    // Check if user is a member of the organization
    if (user.organizationId === organizationId) {
      return true;
    }

    // Check if user owns the organization
    if (user.role === "owner") {
      const ownedOrganization = await this.organizationDAO.findByOwnerId(
        userId
      );
      return ownedOrganization?.id === organizationId;
    }

    return false;
  }
}
