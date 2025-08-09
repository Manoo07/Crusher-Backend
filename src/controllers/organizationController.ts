import { Request, Response } from "express";
import { OrganizationService } from "../services/organizationService";
import { AuthenticatedRequest, PaginationParams } from "../types";
import { ResponseUtil } from "../utils/response";

export class OrganizationController {
  private organizationService: OrganizationService;

  constructor() {
    this.organizationService = new OrganizationService();
  }

  createOrganization = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { name } = req.body;

      if (!req.user) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      const organization = await this.organizationService.createOrganization({
        name,
        ownerId: req.user.id,
      });

      return ResponseUtil.success(
        res,
        organization,
        "Organization created successfully",
        201
      );
    } catch (error: any) {
      console.error("Create organization error:", error);
      return ResponseUtil.badRequest(res, error.message);
    }
  };

  getOrganizationById = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const organization = await this.organizationService.getOrganizationById(
        id
      );

      if (!organization) {
        return ResponseUtil.notFound(res, "Organization not found");
      }

      return ResponseUtil.success(
        res,
        organization,
        "Organization retrieved successfully"
      );
    } catch (error: any) {
      console.error("Get organization error:", error);
      return ResponseUtil.error(res, error.message);
    }
  };

  getUserOrganization = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      let organization;

      // If user is an owner, get their owned organization
      if (req.user.role === "owner") {
        organization = await this.organizationService.getOrganizationByOwnerId(
          req.user.id
        );
      } else if (req.user.organizationId) {
        // If user is a member, get their organization
        organization = await this.organizationService.getOrganizationById(
          req.user.organizationId
        );
      }

      if (!organization) {
        return ResponseUtil.notFound(res, "No organization found for user");
      }

      return ResponseUtil.success(
        res,
        organization,
        "User organization retrieved successfully"
      );
    } catch (error: any) {
      console.error("Get user organization error:", error);
      return ResponseUtil.error(res, error.message);
    }
  };

  getAllOrganizations = async (req: Request, res: Response) => {
    try {
      const paginationParams: PaginationParams = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        sortBy: (req.query.sortBy as string) || "createdAt",
        sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
      };

      const result = await this.organizationService.getAllOrganizations(
        paginationParams
      );

      return ResponseUtil.success(
        res,
        result.organizations,
        "Organizations retrieved successfully",
        200,
        result.pagination
      );
    } catch (error: any) {
      console.error("Get all organizations error:", error);
      return ResponseUtil.error(res, error.message);
    }
  };

  updateOrganization = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { name } = req.body;

      if (!req.user) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      // Check if user has access to this organization
      const hasAccess =
        await this.organizationService.validateOrganizationAccess(
          req.user.id,
          id
        );

      if (!hasAccess || req.user.role !== "owner") {
        return ResponseUtil.forbidden(
          res,
          "Only organization owners can update organization details"
        );
      }

      const organization = await this.organizationService.updateOrganization(
        id,
        { name }
      );

      return ResponseUtil.success(
        res,
        organization,
        "Organization updated successfully"
      );
    } catch (error: any) {
      console.error("Update organization error:", error);
      return ResponseUtil.badRequest(res, error.message);
    }
  };

  deleteOrganization = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { id } = req.params;

      if (!req.user) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      // Check if user has access to this organization and is the owner
      const hasAccess =
        await this.organizationService.validateOrganizationAccess(
          req.user.id,
          id
        );

      if (!hasAccess || req.user.role !== "owner") {
        return ResponseUtil.forbidden(
          res,
          "Only organization owners can delete their organization"
        );
      }

      await this.organizationService.deleteOrganization(id);

      return ResponseUtil.success(
        res,
        null,
        "Organization deleted successfully"
      );
    } catch (error: any) {
      console.error("Delete organization error:", error);
      return ResponseUtil.badRequest(res, error.message);
    }
  };
}
