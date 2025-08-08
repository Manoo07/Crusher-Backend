import { MaterialRate } from "@prisma/client";
import { MaterialRateDAO } from "../dao/materialRateDAO";

export class MaterialRateService {
  private materialRateDAO: MaterialRateDAO;

  constructor() {
    this.materialRateDAO = new MaterialRateDAO();
  }

  async createOrUpdateMaterialRate(data: {
    organizationId: string;
    materialType: string;
    ratePerUnit: number;
    updatedBy: string;
  }): Promise<MaterialRate> {
    if (!data.materialType || !data.organizationId) {
      throw new Error("Material type and organization ID are required");
    }

    if (data.ratePerUnit <= 0) {
      throw new Error("Rate per unit must be greater than 0");
    }

    // Check if rate already exists for this material and organization
    const existingRate =
      await this.materialRateDAO.findByOrganizationAndMaterial(
        data.organizationId,
        data.materialType
      );

    if (existingRate) {
      // Update existing rate
      return await this.materialRateDAO.update(existingRate.id, {
        ratePerUnit: data.ratePerUnit,
        isActive: true,
      });
    } else {
      // Create new rate
      return await this.materialRateDAO.create({
        organization: { connect: { id: data.organizationId } },
        materialType: data.materialType,
        ratePerUnit: data.ratePerUnit,
        isActive: true,
      });
    }
  }

  async getMaterialRatesByOrganization(
    organizationId: string
  ): Promise<MaterialRate[]> {
    if (!organizationId) {
      throw new Error("Organization ID is required");
    }

    return await this.materialRateDAO.getActiveMaterialsByOrganization(
      organizationId
    );
  }

  async getMaterialRate(
    organizationId: string,
    materialType: string
  ): Promise<MaterialRate | null> {
    if (!organizationId || !materialType) {
      throw new Error("Organization ID and material type are required");
    }

    return await this.materialRateDAO.findByOrganizationAndMaterial(
      organizationId,
      materialType
    );
  }

  async deactivateMaterialRate(id: string): Promise<MaterialRate> {
    if (!id) {
      throw new Error("Material rate ID is required");
    }

    return await this.materialRateDAO.deactivate(id);
  }

  async activateMaterialRate(id: string): Promise<MaterialRate> {
    if (!id) {
      throw new Error("Material rate ID is required");
    }

    return await this.materialRateDAO.activate(id);
  }

  async getAllMaterialRatesWithFilters(filters: any): Promise<{
    rates: MaterialRate[];
    pagination: any;
  }> {
    return await this.materialRateDAO.findAll(filters);
  }
}
