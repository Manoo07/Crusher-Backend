import { Organization, Prisma } from "@prisma/client";
import { OrganizationDAO } from "../dao/organizationDAO";
import { UserDAO } from "../dao/userDAO";
import { PaginationParams } from "../types";
import { logger } from "../utils/logger";
import { ValidationUtil } from "../utils/validation";

export class OrganizationService {
  private organizationDAO: OrganizationDAO;
  private userDAO: UserDAO;

  constructor() {
    this.organizationDAO = new OrganizationDAO();
    this.userDAO = new UserDAO();
  }

  async createOrganization(data: { name: string }): Promise<Organization> {
    logger.info("Creating organization in service layer", { data });

    // Validate organization name
    if (!data.name || data.name.trim().length === 0) {
      logger.warn("Validation failed: Organization name is required", { data });
      throw new Error("Organization name is required");
    }

    if (data.name.length > 100) {
      logger.warn("Validation failed: Organization name exceeds length limit", {
        data,
      });
      throw new Error("Organization name must not exceed 100 characters");
    }

    // Check if name already exists
    const nameExists = await this.organizationDAO.checkNameExists(data.name);
    if (nameExists) {
      logger.warn("Validation failed: Organization name already exists", {
        name: data.name,
      });
      throw new Error("Organization name already exists");
    }

    // Create organization with system default owner ID directly in DAO
    const result = await this.organizationDAO.createPlain({
      name: data.name.trim(),
    });

    logger.info("Organization created successfully in service layer", {
      result,
    });
    return result;
  }

  async getOrganizationById(id: string): Promise<Organization | null> {
    logger.info("Fetching organization by ID in service layer", { id });

    if (!id) {
      logger.warn("Validation failed: Organization ID is required", { id });
      throw new Error("Organization ID is required");
    }

    const result = await this.organizationDAO.findById(id);
    if (result) {
      logger.info("Organization found in service layer", { result });
    } else {
      logger.warn("Organization not found in service layer", { id });
    }
    return result;
  }

  async getOrganizationByOwnerId(
    ownerId: string
  ): Promise<Organization | null> {
    logger.info("Fetching organization by owner ID in service layer", {
      ownerId,
    });

    if (!ownerId) {
      logger.warn("Validation failed: Owner ID is required", { ownerId });
      throw new Error("Owner ID is required");
    }

    const result = await this.organizationDAO.findByOwnerId(ownerId);
    if (result) {
      logger.info("Organization found for owner in service layer", { result });
    } else {
      logger.warn("Organization not found for owner in service layer", {
        ownerId,
      });
    }
    return result;
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
    logger.info("Fetching all organizations in service layer", { params });

    const validatedParams = ValidationUtil.validatePaginationParams(params);
    const { organizations, total } = await this.organizationDAO.findAll(
      validatedParams
    );

    logger.info("Organizations fetched successfully in service layer", {
      total,
      page: validatedParams.page,
      limit: validatedParams.limit,
    });
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
    logger.info("Updating organization in service layer", { id, data });

    if (!id) {
      logger.warn("Validation failed: Organization ID is required", { id });
      throw new Error("Organization ID is required");
    }

    // Check if organization exists
    const existingOrg = await this.organizationDAO.findById(id);
    if (!existingOrg) {
      logger.warn("Organization not found for update in service layer", { id });
      throw new Error("Organization not found");
    }

    const updateData: Prisma.OrganizationUpdateInput = {};

    if (data.name !== undefined) {
      if (!data.name.trim()) {
        logger.warn("Validation failed: Organization name cannot be empty", {
          data,
        });
        throw new Error("Organization name cannot be empty");
      }

      if (data.name.length > 100) {
        logger.warn(
          "Validation failed: Organization name exceeds length limit",
          { data }
        );
        throw new Error("Organization name must not exceed 100 characters");
      }

      // Check if new name already exists (excluding current organization)
      const nameExists = await this.organizationDAO.checkNameExists(
        data.name,
        id
      );
      if (nameExists) {
        logger.warn("Validation failed: Organization name already exists", {
          name: data.name,
        });
        throw new Error("Organization name already exists");
      }

      updateData.name = data.name.trim();
    }

    const result = await this.organizationDAO.update(id, updateData);
    logger.info("Organization updated successfully in service layer", {
      result,
    });
    return result;
  }

  async deleteOrganization(id: string): Promise<Organization> {
    logger.info("Deleting organization in service layer", { id });

    if (!id) {
      logger.warn("Validation failed: Organization ID is required", { id });
      throw new Error("Organization ID is required");
    }

    // Check if organization exists
    const existingOrg = await this.organizationDAO.findById(id);
    if (!existingOrg) {
      logger.warn("Organization not found for deletion in service layer", {
        id,
      });
      throw new Error("Organization not found");
    }

    const result = await this.organizationDAO.delete(id);
    logger.info("Organization deleted successfully in service layer", {
      result,
    });
    return result;
  }

  async validateOrganizationAccess(
    userId: string,
    organizationId: string
  ): Promise<boolean> {
    logger.info("Validating organization access in service layer", {
      userId,
      organizationId,
    });

    const user = await this.userDAO.findById(userId);
    if (!user) {
      logger.warn("User not found for access validation in service layer", {
        userId,
      });
      return false;
    }

    // Check if user is a member of the organization
    if (user.organizationId === organizationId) {
      logger.info("User is a member of the organization", {
        userId,
        organizationId,
      });
      return true;
    }

    // Check if user owns the organization
    if (user.role === "owner") {
      const ownedOrganization = await this.organizationDAO.findByOwnerId(
        userId
      );
      const isOwner = ownedOrganization?.id === organizationId;
      logger.info("User ownership status for organization", {
        userId,
        organizationId,
        isOwner,
      });
      return isOwner;
    }

    logger.info("User does not have access to the organization", {
      userId,
      organizationId,
    });
    return false;
  }
}
