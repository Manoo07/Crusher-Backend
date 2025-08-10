import { Response } from "express";
import { MaterialRateService } from "../services/materialRateService";
import { AuthenticatedRequest } from "../types";
import { ResponseUtil } from "../utils/response";

export class MaterialRateController {
  private materialRateService: MaterialRateService;

  constructor() {
    this.materialRateService = new MaterialRateService();
  }

  getMaterialRates = async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user || !req.organizationId) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      const rates =
        await this.materialRateService.getMaterialRatesByOrganization(
          req.organizationId
        );

      return ResponseUtil.success(
        res,
        rates,
        "Material rates retrieved successfully"
      );
    } catch (error: any) {
      console.error("Get material rates error:", error);
      return ResponseUtil.error(res, error.message);
    }
  };

  updateMaterialRate = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { materialType, rate } = req.body;

      if (!req.user || !req.organizationId) {
        return ResponseUtil.unauthorized(res, "Authentication required");
      }

      // Convert rate to number to avoid string concatenation
      const numericRate = Number(rate);

      if (isNaN(numericRate) || numericRate <= 0) {
        return ResponseUtil.badRequest(
          res,
          "Rate must be a valid number greater than 0"
        );
      }

      const materialRate =
        await this.materialRateService.createOrUpdateMaterialRate({
          organizationId: req.organizationId,
          materialType,
          ratePerUnit: numericRate,
          updatedBy: req.user.id,
        });

      return ResponseUtil.success(
        res,
        materialRate,
        `Rate for ${materialType} updated successfully`,
        201
      );
    } catch (error: any) {
      console.error("Update material rate error:", error);
      return ResponseUtil.badRequest(res, error.message);
    }
  };
}
