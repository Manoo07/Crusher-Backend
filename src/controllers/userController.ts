import { Response } from "express";
import { UserService } from "../services/userService";
import { AuthenticatedRequest, UserFilters } from "../types";
import { logger } from "../utils/logger";
import { ResponseUtil } from "../utils/response";

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  createUser = async (req: AuthenticatedRequest, res: Response) => {
    logger.info("Create user request received", { userId: req.user?.id });
    try {
      const { username, password, role, organizationId, profileImage } =
        req.body;

      if (!req.user) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      // Only owners can create users for their organization
      if (req.user.role !== "owner") {
        return ResponseUtil.forbidden(
          res,
          "Only organization owners can create users"
        );
      }

      // TODO: Hash password (implement proper password hashing)
      const passwordHash = password; // In production, use bcrypt.hash(password, 10)

      const user = await this.userService.createUser({
        username,
        passwordHash,
        role,
        organizationId: organizationId || req.organizationId,
        profileImage,
      });

      // Remove password hash from response
      const { passwordHash: _, ...userResponse } = user;

      logger.info("User created successfully", { userId: user.id });
      return ResponseUtil.success(
        res,
        userResponse,
        "User created successfully",
        201
      );
    } catch (error: any) {
      logger.error("Create user error", { error: error.message });
      console.error("Create user error:", error);
      return ResponseUtil.badRequest(res, error.message);
    }
  };

  getUserById = async (req: AuthenticatedRequest, res: Response) => {
    logger.info("Get user by ID request received", { userId: req.user?.id });
    try {
      const { id } = req.params;

      if (!req.user) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      // Users can view their own profile or owners can view users in their organization
      const hasAccess = await this.userService.validateUserAccess(
        req.user.id,
        id,
        req.organizationId
      );

      if (!hasAccess) {
        return ResponseUtil.forbidden(res, "Access denied");
      }

      const user = await this.userService.getUserById(id);

      if (!user) {
        return ResponseUtil.notFound(res, "User not found");
      }

      // Remove password hash from response
      const { passwordHash: _, ...userResponse } = user;

      logger.info("User retrieved successfully", { userId: user.id });
      return ResponseUtil.success(
        res,
        userResponse,
        "User retrieved successfully"
      );
    } catch (error: any) {
      logger.error("Get user by ID error", { error: error.message });
      console.error("Get user error:", error);
      return ResponseUtil.error(res, error.message);
    }
  };

  getCurrentUser = async (req: AuthenticatedRequest, res: Response) => {
    logger.info("Get current user request received", { userId: req.user?.id });
    try {
      if (!req.user) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      const user = await this.userService.getUserById(req.user.id);

      if (!user) {
        return ResponseUtil.notFound(res, "User not found");
      }

      // Remove password hash from response
      const { passwordHash: _, ...userResponse } = user;

      logger.info("Current user retrieved successfully", { userId: user.id });
      return ResponseUtil.success(
        res,
        userResponse,
        "Current user retrieved successfully"
      );
    } catch (error: any) {
      logger.error("Get current user error", { error: error.message });
      console.error("Get current user error:", error);
      return ResponseUtil.error(res, error.message);
    }
  };

  getAllUsers = async (req: AuthenticatedRequest, res: Response) => {
    logger.info("Get all users request received", { userId: req.user?.id });
    try {
      if (!req.user) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      // Only owners can view all users in their organization
      if (req.user.role !== "owner") {
        return ResponseUtil.forbidden(res, "Insufficient permissions");
      }

      const filters: UserFilters = {
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        sortBy: (req.query.sortBy as string) || "createdAt",
        sortOrder: (req.query.sortOrder as "asc" | "desc") || "desc",
        role: req.query.role as string,
        isActive: req.query.isActive
          ? req.query.isActive === "true"
          : undefined,
        organizationId: req.organizationId, // Filter by user's organization
      };

      const result = await this.userService.getAllUsers(filters);

      // Remove password hashes from response
      const usersWithoutPasswords = result.users.map((user) => {
        const { passwordHash: _, ...userResponse } = user;
        return userResponse;
      });

      logger.info("All users retrieved successfully", {
        userId: req.user.id,
        organizationId: req.organizationId,
      });
      return ResponseUtil.success(
        res,
        usersWithoutPasswords,
        "Users retrieved successfully",
        200,
        result.pagination
      );
    } catch (error: any) {
      logger.error("Get all users error", { error: error.message });
      console.error("Get all users error:", error);
      return ResponseUtil.error(res, error.message);
    }
  };

  getOrganizationUsers = async (req: AuthenticatedRequest, res: Response) => {
    logger.info("Get organization users request received", {
      userId: req.user?.id,
    });
    try {
      const { organizationId } = req.params;

      if (!req.user) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      // Users can only view users from their own organization
      if (req.user.role !== "owner" || req.organizationId !== organizationId) {
        return ResponseUtil.forbidden(res, "Access denied");
      }

      const users = await this.userService.getUsersByOrganization(
        organizationId
      );

      // Remove password hashes from response
      const usersWithoutPasswords = users.map((user) => {
        const { passwordHash: _, ...userResponse } = user;
        return userResponse;
      });

      logger.info("Organization users retrieved successfully", {
        userId: req.user.id,
        organizationId,
      });
      return ResponseUtil.success(
        res,
        usersWithoutPasswords,
        "Organization users retrieved successfully"
      );
    } catch (error: any) {
      logger.error("Get organization users error", { error: error.message });
      console.error("Get organization users error:", error);
      return ResponseUtil.error(res, error.message);
    }
  };

  updateUser = async (req: AuthenticatedRequest, res: Response) => {
    logger.info("Update user request received", { userId: req.user?.id });
    try {
      const { id } = req.params;
      const { username, role, isActive, profileImage } = req.body;

      if (!req.user) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      // Users can update their own profile or owners can update users in their organization
      const hasAccess = await this.userService.validateUserAccess(
        req.user.id,
        id,
        req.organizationId
      );

      if (!hasAccess) {
        return ResponseUtil.forbidden(res, "Access denied");
      }

      // Only owners can change roles and active status
      const updateData: any = {};

      if (username !== undefined) updateData.username = username;
      if (profileImage !== undefined) updateData.profileImage = profileImage;

      if (req.user.role === "owner") {
        if (role !== undefined) updateData.role = role;
        if (isActive !== undefined) updateData.isActive = isActive;
      }

      const user = await this.userService.updateUser(id, updateData);

      // Remove password hash from response
      const { passwordHash: _, ...userResponse } = user;

      logger.info("User updated successfully", { userId: user.id });
      return ResponseUtil.success(
        res,
        userResponse,
        "User updated successfully"
      );
    } catch (error: any) {
      logger.error("Update user error", { error: error.message });
      console.error("Update user error:", error);
      return ResponseUtil.badRequest(res, error.message);
    }
  };

  updatePassword = async (req: AuthenticatedRequest, res: Response) => {
    logger.info("Update password request received", { userId: req.user?.id });
    try {
      const { id } = req.params;
      const { currentPassword, newPassword } = req.body;

      if (!req.user) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      // Users can only update their own password
      if (req.user.id !== id) {
        return ResponseUtil.forbidden(res, "Access denied");
      }

      // TODO: Verify current password and hash new password
      // const isValidPassword = await bcrypt.compare(currentPassword, req.user.passwordHash);
      // if (!isValidPassword) {
      //   return ResponseUtil.badRequest(res, 'Current password is incorrect');
      // }

      // const newPasswordHash = await bcrypt.hash(newPassword, 10);

      const newPasswordHash = newPassword; // Placeholder - implement proper hashing

      const user = await this.userService.updateUserPassword(
        id,
        newPasswordHash
      );

      logger.info("Password updated successfully", { userId: id });
      return ResponseUtil.success(res, null, "Password updated successfully");
    } catch (error: any) {
      logger.error("Update password error", { error: error.message });
      console.error("Update password error:", error);
      return ResponseUtil.badRequest(res, error.message);
    }
  };

  deactivateUser = async (req: AuthenticatedRequest, res: Response) => {
    logger.info("Deactivate user request received", { userId: req.user?.id });
    try {
      const { id } = req.params;

      if (!req.user) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      // Only owners can deactivate users
      if (req.user.role !== "owner") {
        return ResponseUtil.forbidden(
          res,
          "Only organization owners can deactivate users"
        );
      }

      const user = await this.userService.deactivateUser(id);

      // Remove password hash from response
      const { passwordHash: _, ...userResponse } = user;

      logger.info("User deactivated successfully", { userId: user.id });
      return ResponseUtil.success(
        res,
        userResponse,
        "User deactivated successfully"
      );
    } catch (error: any) {
      logger.error("Deactivate user error", { error: error.message });
      console.error("Deactivate user error:", error);
      return ResponseUtil.badRequest(res, error.message);
    }
  };

  activateUser = async (req: AuthenticatedRequest, res: Response) => {
    logger.info("Activate user request received", { userId: req.user?.id });
    try {
      const { id } = req.params;

      if (!req.user) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      // Only owners can activate users
      if (req.user.role !== "owner") {
        return ResponseUtil.forbidden(
          res,
          "Only organization owners can activate users"
        );
      }

      const user = await this.userService.activateUser(id);

      // Remove password hash from response
      const { passwordHash: _, ...userResponse } = user;

      logger.info("User activated successfully", { userId: user.id });
      return ResponseUtil.success(
        res,
        userResponse,
        "User activated successfully"
      );
    } catch (error: any) {
      logger.error("Activate user error", { error: error.message });
      console.error("Activate user error:", error);
      return ResponseUtil.badRequest(res, error.message);
    }
  };
}
