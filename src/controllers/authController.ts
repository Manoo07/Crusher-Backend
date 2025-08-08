import { Response } from "express";
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

  register = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { username, password, organizationName, role } = req.body;

      // Validate input
      const usernameValidation = ValidationUtil.validateUsername(username);
      if (!usernameValidation.isValid) {
        return ResponseUtil.badRequest(res, usernameValidation.message);
      }

      const passwordValidation = ValidationUtil.validatePassword(password);
      if (!passwordValidation.isValid) {
        return ResponseUtil.badRequest(res, passwordValidation.message);
      }

      // TODO: Hash password (implement proper password hashing)
      const passwordHash = password; // In production, use bcrypt.hash(password, 10)

      let organizationId: string | undefined;

      // If role is owner and organizationName is provided, create organization
      if (role === "owner" && organizationName) {
        const user = await this.userService.createUser({
          username,
          passwordHash,
          role: "owner",
        });

        const organization = await this.organizationService.createOrganization({
          name: organizationName,
          ownerId: user.id,
        });

        organizationId = organization.id;
      } else {
        // Regular user creation
        const user = await this.userService.createUser({
          username,
          passwordHash,
          role: role || "user",
          organizationId,
        });
      }

      // Generate JWT token (placeholder - implement proper JWT)
      const token = "placeholder-jwt-token";
      const refreshToken = "placeholder-refresh-token";

      const userResponse = await this.userService.getUserByUsername(username);
      if (!userResponse) {
        return ResponseUtil.error(res, "User creation failed");
      }

      // Remove password from response
      const { passwordHash: _, ...userWithoutPassword } = userResponse;

      return ResponseUtil.success(
        res,
        {
          token,
          refreshToken,
          user: userWithoutPassword,
          organization: organizationId
            ? await this.organizationService.getOrganizationById(organizationId)
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

  login = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { username, password } = req.body;

      const user = await this.userService.getUserByUsername(username);
      if (!user) {
        return ResponseUtil.unauthorized(res, "Invalid credentials");
      }

      if (!user.isActive) {
        return ResponseUtil.forbidden(res, "Account is deactivated");
      }

      // TODO: Implement proper password verification
      // const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      // if (!isValidPassword) {
      //   return ResponseUtil.unauthorized(res, 'Invalid credentials');
      // }

      // For now, simple password comparison (replace with bcrypt in production)
      if (password !== user.passwordHash) {
        return ResponseUtil.unauthorized(res, "Invalid credentials");
      }

      // Update last login
      await this.userService.updateLastLogin(user.id);

      // Generate JWT tokens (placeholder - implement proper JWT)
      const token = "placeholder-jwt-token";
      const refreshToken = "placeholder-refresh-token";

      // Remove password from response
      const { passwordHash: _, ...userWithoutPassword } = user;

      return ResponseUtil.success(
        res,
        {
          token,
          refreshToken,
          user: userWithoutPassword,
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
      // In a real application, you would:
      // 1. Invalidate the JWT token (add to blacklist)
      // 2. Clear refresh tokens from database
      // 3. Clear any session data

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

      // Remove password from response
      const { passwordHash: _, ...userWithoutPassword } = user;

      return ResponseUtil.success(
        res,
        userWithoutPassword,
        "Profile retrieved successfully"
      );
    } catch (error: any) {
      console.error("Get profile error:", error);
      return ResponseUtil.error(res, error.message);
    }
  };
}
