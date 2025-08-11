import bcrypt from "bcrypt";
import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { OrganizationService } from "../services/organizationService";
import { UserService } from "../services/userService";
import { AuthenticatedRequest } from "../types";
import { ResponseUtil } from "../utils/response";
import { ValidationUtil } from "../utils/validation";

export class AuthController {
  private userService: UserService;
  private organizationService: OrganizationService;

  constructor() {
    this.userService = new UserService();
    this.organizationService = new OrganizationService();
  }

  register = async (req: Request, res: Response) => {
    try {
      const {
        username,
        password,
        organizationName,
        organizationId: reqOrganizationId,
        role,
      } = req.body;

      // Validate input
      const usernameValidation = ValidationUtil.validateUsername(username);
      if (!usernameValidation.isValid) {
        return ResponseUtil.badRequest(res, usernameValidation.message);
      }

      const passwordValidation = ValidationUtil.validatePassword(password);
      if (!passwordValidation.isValid) {
        return ResponseUtil.badRequest(res, passwordValidation.message);
      }

      // Check if username already exists
      const existingUser = await this.userService.getUserByUsername(username);
      if (existingUser) {
        return ResponseUtil.badRequest(res, "Username already exists");
      }

      // Hash password using bcrypt
      const saltRounds = 10;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      let finalOrganizationId: string | undefined;
      let user: any;

      // If role is owner and organizationName is provided, create new organization
      if (role === "owner" && organizationName) {
        // First create the user without organization
        user = await this.userService.createUser({
          username,
          passwordHash,
          role: "owner",
        });

        // Then create the organization with the user as owner
        const organization = await this.organizationService.createOrganization({
          name: organizationName,
          ownerId: user.id,
        });

        finalOrganizationId = organization.id;

        // Update the user with the organization ID
        user = await this.userService.updateUser(user.id, {
          organizationId: organization.id,
        });
      } else {
        // Regular user creation or adding user to existing organization
        user = await this.userService.createUser({
          username,
          passwordHash,
          role: role || "user",
          organizationId: reqOrganizationId,
        });
        finalOrganizationId = reqOrganizationId;
      }

      const userResponse = await this.userService.getUserByUsername(username);
      if (!userResponse) {
        return ResponseUtil.error(res, "User creation failed");
      }

      // Remove password from response
      const { passwordHash: _, ...userWithoutPassword } = userResponse;

      return ResponseUtil.success(
        res,
        {
          user: userWithoutPassword,
          organization: finalOrganizationId
            ? await this.organizationService.getOrganizationById(
                finalOrganizationId
              )
            : null,
        },
        "User registered successfully",
        201
      );
    } catch (error: any) {
      console.error("Registration error:", error);
      return ResponseUtil.badRequest(res, error.message);
    }
  };

  login = async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body;

      const user = await this.userService.getUserByUsername(username);
      if (!user) {
        return ResponseUtil.unauthorized(res, "Invalid credentials");
      }

      if (!user.isActive) {
        return ResponseUtil.forbidden(res, "Account is deactivated");
      }

      // Verify password using bcrypt
      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return ResponseUtil.unauthorized(res, "Invalid credentials");
      }

      // Update last login
      await this.userService.updateLastLogin(user.id);

      // Get user's organization
      const organization = user.organizationId
        ? await this.organizationService.getOrganizationById(
            user.organizationId
          )
        : user.role === "owner"
        ? await this.organizationService.getOrganizationByOwnerId(user.id)
        : null;

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          username: user.username,
          role: user.role,
          organizationId: user.organizationId || organization?.id,
        },
        process.env.JWT_SECRET || "your-secret-key-here",
        { expiresIn: "24h" }
      );

      // Remove password from response
      const { passwordHash: _, ...userWithoutPassword } = user;

      return ResponseUtil.success(
        res,
        {
          token,
          user: {
            ...userWithoutPassword,
            organizationId: user.organizationId || organization?.id,
            organization,
          },
          expiresIn: "24h",
        },
        "Login successful"
      );
    } catch (error: any) {
      console.error("Login error:", error);
      return ResponseUtil.error(res, error.message);
    }
  };

  verifyToken = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      // Remove password from response
      const { passwordHash: _, ...userWithoutPassword } = req.user;

      return ResponseUtil.success(
        res,
        {
          user: userWithoutPassword,
        },
        "Token is valid"
      );
    } catch (error: any) {
      console.error("Token verification error:", error);
      return ResponseUtil.unauthorized(res, "Token verification failed");
    }
  };

  logout = async (req: AuthenticatedRequest, res: Response) => {
    try {
      // In a stateless JWT system, logout is handled client-side by removing the token
      return ResponseUtil.success(res, null, "Logout successful");
    } catch (error: any) {
      console.error("Logout error:", error);
      return ResponseUtil.error(res, error.message);
    }
  };

  getProfile = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      const user = await this.userService.getUserById(req.user.id);
      if (!user) {
        return ResponseUtil.notFound(res, "User not found");
      }

      // Get user's organization
      const organization = user.organizationId
        ? await this.organizationService.getOrganizationById(
            user.organizationId
          )
        : user.role === "owner"
        ? await this.organizationService.getOrganizationByOwnerId(user.id)
        : null;

      // Remove password from response
      const { passwordHash: _, ...userWithoutPassword } = user;

      return ResponseUtil.success(
        res,
        {
          ...userWithoutPassword,
          organizationId: user.organizationId || organization?.id,
          organization,
        },
        "Profile retrieved successfully"
      );
    } catch (error: any) {
      console.error("Get profile error:", error);
      return ResponseUtil.error(res, error.message);
    }
  };

  updateProfile = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      const { username, currentPassword, newPassword } = req.body;
      const userId = req.user.id;

      // Get current user data
      const currentUser = await this.userService.getUserById(userId);
      if (!currentUser) {
        return ResponseUtil.notFound(res, "User not found");
      }

      const updateData: any = {};

      // If username is being updated, validate it
      if (username && username !== currentUser.username) {
        const usernameValidation = ValidationUtil.validateUsername(username);
        if (!usernameValidation.isValid) {
          return ResponseUtil.badRequest(res, usernameValidation.message);
        }

        // Check if new username already exists
        const existingUser = await this.userService.getUserByUsername(username);
        if (existingUser && existingUser.id !== userId) {
          return ResponseUtil.badRequest(res, "Username already exists");
        }

        updateData.username = username;
      }

      // If password is being updated
      if (newPassword) {
        if (!currentPassword) {
          return ResponseUtil.badRequest(
            res,
            "Current password is required to update password"
          );
        }

        // Verify current password
        const isValidCurrentPassword = await bcrypt.compare(
          currentPassword,
          currentUser.passwordHash
        );
        if (!isValidCurrentPassword) {
          return ResponseUtil.badRequest(res, "Current password is incorrect");
        }

        // Validate new password
        const passwordValidation = ValidationUtil.validatePassword(newPassword);
        if (!passwordValidation.isValid) {
          return ResponseUtil.badRequest(res, passwordValidation.message);
        }

        // Hash new password
        const saltRounds = 10;
        updateData.passwordHash = await bcrypt.hash(newPassword, saltRounds);
      }

      // Update user if there are changes
      if (Object.keys(updateData).length === 0) {
        return ResponseUtil.badRequest(
          res,
          "No valid fields provided for update"
        );
      }

      const updatedUser = await this.userService.updateUser(userId, updateData);

      // Get user's organization
      const organization = updatedUser.organizationId
        ? await this.organizationService.getOrganizationById(
            updatedUser.organizationId
          )
        : updatedUser.role === "owner"
        ? await this.organizationService.getOrganizationByOwnerId(
            updatedUser.id
          )
        : null;

      // Remove password from response
      const { passwordHash: _, ...userWithoutPassword } = updatedUser;

      return ResponseUtil.success(
        res,
        {
          ...userWithoutPassword,
          organizationId: updatedUser.organizationId || organization?.id,
          organization,
        },
        "Profile updated successfully"
      );
    } catch (error: any) {
      console.error("Update profile error:", error);
      return ResponseUtil.error(res, error.message);
    }
  };

  deleteProfile = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      const { password } = req.body;
      const userId = req.user.id;

      // Get current user data
      const currentUser = await this.userService.getUserById(userId);
      if (!currentUser) {
        return ResponseUtil.notFound(res, "User not found");
      }

      // Verify password before deletion
      if (!password) {
        return ResponseUtil.badRequest(
          res,
          "Password is required to delete account"
        );
      }

      const isValidPassword = await bcrypt.compare(
        password,
        currentUser.passwordHash
      );
      if (!isValidPassword) {
        return ResponseUtil.badRequest(res, "Invalid password");
      }

      // Check if user is an organization owner
      if (currentUser.role === "owner") {
        // Check if there are other users in the organization
        const organization =
          await this.organizationService.getOrganizationByOwnerId(userId);
        if (organization) {
          // For now, prevent deletion if user owns an organization
          // In a real app, you might want to transfer ownership or delete the organization
          return ResponseUtil.badRequest(
            res,
            "Cannot delete account while owning an organization. Please contact support."
          );
        }
      }

      // Soft delete user (deactivate instead of hard delete to maintain data integrity)
      await this.userService.updateUser(userId, {
        isActive: false,
        username: `deleted_${userId}_${Date.now()}`, // Prevent username conflicts
      });

      return ResponseUtil.success(res, null, "Account deleted successfully");
    } catch (error: any) {
      console.error("Delete profile error:", error);
      return ResponseUtil.error(res, error.message);
    }
  };
}
