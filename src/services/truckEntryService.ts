import { Prisma, TruckEntry } from "@prisma/client";
import { MaterialRateDAO } from "../dao/materialRateDAO";
import { TruckEntryDAO } from "../dao/truckEntryDAO";
import { TruckEntryFilters } from "../types";
import { ValidationUtil } from "../utils/validation";

export class TruckEntryService {
  private truckEntryDAO: TruckEntryDAO;
  private materialRateDAO: MaterialRateDAO;

  constructor() {
    this.truckEntryDAO = new TruckEntryDAO();
    this.materialRateDAO = new MaterialRateDAO();
  }

  async createTruckEntry(data: {
    organizationId: string;
    userId: string;
    truckNumber: string;
    truckName: string;
    entryType: "Sales" | "RawStone";
    materialType?: string; // Legacy field
    entryTypeMaterialId?: string; // New bridge table field
    units: number;
    ratePerUnit: number;
    entryDate: Date;
    entryTime: Date;
    notes?: string;
    truckImage?: string;
  }): Promise<TruckEntry> {
    // Validate required fields
    if (!data.truckNumber || !data.truckName || !data.entryType) {
      throw new Error("Missing required fields");
    }

    // Calculate total amount - ensure both values are numbers
    const totalAmount = Number(data.units) * Number(data.ratePerUnit);

    const createData: Prisma.TruckEntryCreateInput = {
      organization: { connect: { id: data.organizationId } },
      user: { connect: { id: data.userId } },
      truckNumber: data.truckNumber,
      truckName: data.truckName,
      entryType: data.entryType as any,
      materialType: data.materialType, // Keep for backward compatibility
      units: Number(data.units),
      ratePerUnit: Number(data.ratePerUnit),
      totalAmount,
      entryDate: data.entryDate,
      entryTime: data.entryTime,
      notes: data.notes,
      truckImage: data.truckImage,
      status: "active",
    };

    // Add bridge table connection if provided
    if (data.entryTypeMaterialId) {
      createData.entryTypeMaterial = {
        connect: { id: data.entryTypeMaterialId },
      };
    }

    return await this.truckEntryDAO.create(createData);
  }

  async getTruckEntryById(id: string): Promise<TruckEntry | null> {
    if (!id) {
      throw new Error("Truck entry ID is required");
    }
    return await this.truckEntryDAO.findById(id);
  }

  async getTruckEntriesByOrganization(
    organizationId: string,
    filters: TruckEntryFilters
  ): Promise<{
    entries: TruckEntry[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  }> {
    const validatedParams = ValidationUtil.validatePaginationParams(filters);
    const validatedFilters: TruckEntryFilters = {
      ...validatedParams,
      entryType: filters.entryType,
      materialType: filters.materialType,
      status: filters.status || "active",
      startDate: filters.startDate,
      endDate: filters.endDate,
      userId: filters.userId,
    };

    const { entries, total } = await this.truckEntryDAO.findByOrganizationId(
      organizationId,
      validatedFilters
    );

    return {
      entries,
      pagination: {
        total,
        page: validatedParams.page!,
        limit: validatedParams.limit!,
        totalPages: Math.ceil(total / validatedParams.limit!),
      },
    };
  }

  async updateTruckEntry(id: string, data: any): Promise<TruckEntry> {
    if (!id) {
      throw new Error("Truck entry ID is required");
    }

    // Check if truck entry exists
    const existingEntry = await this.truckEntryDAO.findById(id);
    if (!existingEntry) {
      throw new Error("Truck entry not found");
    }

    const updateData: Prisma.TruckEntryUpdateInput = {};

    // Update allowed fields
    if (data.truckNumber !== undefined)
      updateData.truckNumber = data.truckNumber;
    if (data.truckName !== undefined) updateData.truckName = data.truckName;
    if (data.entryType !== undefined) updateData.entryType = data.entryType;
    if (data.materialType !== undefined)
      updateData.materialType = data.materialType;
    if (data.units !== undefined) updateData.units = data.units;
    if (data.ratePerUnit !== undefined)
      updateData.ratePerUnit = data.ratePerUnit;
    if (data.entryDate !== undefined)
      updateData.entryDate = new Date(data.entryDate);
    if (data.entryTime !== undefined) {
      updateData.entryTime =
        typeof data.entryTime === "string"
          ? new Date(`1970-01-01T${data.entryTime}:00`)
          : data.entryTime;
    }
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.truckImage !== undefined) updateData.truckImage = data.truckImage;

    // Recalculate total amount if units or rate changed
    if (data.units !== undefined || data.ratePerUnit !== undefined) {
      const units = data.units !== undefined ? data.units : existingEntry.units;
      const ratePerUnit =
        data.ratePerUnit !== undefined
          ? data.ratePerUnit
          : existingEntry.ratePerUnit;
      updateData.totalAmount = Number(units) * Number(ratePerUnit);
    }

    return await this.truckEntryDAO.update(id, updateData);
  }

  async deleteTruckEntry(id: string): Promise<TruckEntry> {
    if (!id) {
      throw new Error("Truck entry ID is required");
    }

    // Check if truck entry exists
    const existingEntry = await this.truckEntryDAO.findById(id);
    if (!existingEntry) {
      throw new Error("Truck entry not found");
    }

    // Soft delete by setting status to 'deleted'
    return await this.truckEntryDAO.delete(id);
  }

  async getTruckEntriesSummary(
    organizationId: string,
    startDate?: Date,
    endDate?: Date,
    userId?: string
  ): Promise<any> {
    if (!organizationId) {
      throw new Error("Organization ID is required");
    }

    return await this.truckEntryDAO.getStatsByOrganization(
      organizationId,
      startDate,
      endDate
    );
  }

  async getTruckEntriesForDashboard(
    organizationId: string,
    limit: number = 10
  ): Promise<TruckEntry[]> {
    const filters: TruckEntryFilters = {
      page: 1,
      limit,
      sortBy: "createdAt",
      sortOrder: "desc",
      status: "active",
    };

    const { entries } = await this.truckEntryDAO.findByOrganizationId(
      organizationId,
      filters
    );

    return entries;
  }

  async getTruckEntriesByDateRange(
    organizationId: string,
    startDate: string,
    endDate: string
  ): Promise<TruckEntry[]> {
    if (!organizationId || !startDate || !endDate) {
      throw new Error("Organization ID, start date, and end date are required");
    }

    const filters: TruckEntryFilters = {
      page: 1,
      limit: 10000, // Get all entries within date range
      sortBy: "createdAt",
      sortOrder: "desc",
      status: "active",
      startDate,
      endDate,
    };

    const { entries } = await this.truckEntryDAO.findByOrganizationId(
      organizationId,
      filters
    );

    return entries;
  }
}
