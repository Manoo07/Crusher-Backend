/* Dev Seed Script for Prisma (PostgreSQL)
 * Mirrors existing Mongo dev seed: creates owner admin, test user,
 * default material rates, sample truck entries, sample other expenses.
 * Idempotent: safe to run multiple times.
 * CLEARS existing data first for development purposes.
 */

import { EntryStatus, EntryType, PrismaClient, UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// --- Configurable Defaults ---
const ADMIN = {
  username: process.env.ADMIN_USERNAME || "raj",
  email: process.env.ADMIN_EMAIL || "raj@gmail.com",
  password: process.env.ADMIN_PASSWORD || "Test@123",
};

const TEST_USER = {
  username: "testuser",
  password: "Test@123",
};

// Material Rates for Entry Type Sales
const MATERIAL_RATES = [
  { materialType: '1 1/2" Metal', ratePerUnit: 25000 },
  { materialType: '3/4" jalli', ratePerUnit: 18000 },
  { materialType: '1/2" jalli', ratePerUnit: 17000 },
  { materialType: '1/4" kuranai', ratePerUnit: 16000 },
  { materialType: "Dust", ratePerUnit: 12000 },
  { materialType: "Wetmix", ratePerUnit: 19000 },
  { materialType: "Msand", ratePerUnit: 22000 },
  { materialType: "Psand", ratePerUnit: 20000 },
];

// Material Rates for Entry Type RawStone
const RAWSTONE_MATERIAL_RATES = [
  { materialType: "RawStone", ratePerUnit: 20000 },
];

const TRUCK_ENTRIES = [
  {
    truckNumber: "KA01AB1234",
    truckName: "Driver A",
    entryType: "Sales" as EntryType,
    materialType: "Msand",
    units: 10,
    ratePerUnit: 22000,
    offsetDays: 1,
    notes: "Sample M-Sand sales entry",
  },
  {
    truckNumber: "KA02CD5678",
    truckName: "Driver B",
    entryType: "RawStone" as EntryType,
    materialType: null,
    units: 15,
    ratePerUnit: 18000,
    offsetDays: 1,
    notes: "Sample raw stone entry",
  },
  {
    truckNumber: "KA03EF9012",
    truckName: "Driver C",
    entryType: "Sales" as EntryType,
    materialType: "Psand",
    units: 8,
    ratePerUnit: 20000,
    offsetDays: 0,
    notes: "Sample P-Sand sales",
  },
  {
    truckNumber: "KA04GH3456",
    truckName: "Driver D",
    entryType: "Sales" as EntryType,
    materialType: '3/4" jalli',
    units: 12,
    ratePerUnit: 18000,
    offsetDays: 0,
    notes: "Sample 3/4 jalli sales",
  },
  {
    truckNumber: "KA05IJ7890",
    truckName: "Driver E",
    entryType: "Sales" as EntryType,
    materialType: '1 1/2" Metal',
    units: 6,
    ratePerUnit: 25000,
    offsetDays: 0,
    notes: "Sample 1 1/2 Metal sales",
  },
  {
    truckNumber: "KA06KL2345",
    truckName: "Driver F",
    entryType: "Sales" as EntryType,
    materialType: '1/2" jalli',
    units: 15,
    ratePerUnit: 17000,
    offsetDays: 2,
    notes: "Sample 1/2 jalli sales",
  },
  {
    truckNumber: "KA07MN6789",
    truckName: "Driver G",
    entryType: "Sales" as EntryType,
    materialType: '1/4" kuranai',
    units: 20,
    ratePerUnit: 16000,
    offsetDays: 2,
    notes: "Sample 1/4 kuranai sales",
  },
  {
    truckNumber: "KA08OP0123",
    truckName: "Driver H",
    entryType: "Sales" as EntryType,
    materialType: "Dust",
    units: 10,
    ratePerUnit: 12000,
    offsetDays: 3,
    notes: "Sample dust materials sales",
  },
];

const OTHER_EXPENSES = [
  {
    expenseType: "Fuel",
    amount: 5000.0,
    description: "Diesel refill",
    offsetDays: 0,
  },
  {
    expenseType: "Maintenance",
    amount: 3200.0,
    description: "Machine service",
    offsetDays: 1,
  },
  {
    expenseType: "Labor",
    amount: 2100.0,
    description: "Daily wages",
    offsetDays: 2,
  },
];

// Helper function to hash password
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

// Clear all data for development
async function clearData() {
  console.log("🧹 Clearing existing data...");

  // Delete in proper order to respect foreign key constraints
  // First delete child records
  await prisma.otherExpense.deleteMany({});
  await prisma.truckEntry.deleteMany({});
  await prisma.entryTypeMaterial.deleteMany({}); // Clear bridge table
  await prisma.materialRate.deleteMany({});

  // Then delete organizations (this will handle the owner relationship properly)
  await prisma.organization.deleteMany({});

  // Finally delete users
  await prisma.user.deleteMany({});

  console.log("✅ All data cleared");
}

async function main() {
  console.log("🌱 Starting DEV seed...");
  console.log(
    `📊 Database: ${process.env.DATABASE_URL?.replace(/\/\/.*@/, "//***:***@")}`
  );

  // Clear existing data first (for development)
  await clearData();

  // 1. Create Admin (owner) user first
  console.log("👤 Creating admin user...");
  const adminPasswordHash = await hashPassword(ADMIN.password);

  const admin = await prisma.user.create({
    data: {
      username: ADMIN.username,
      passwordHash: adminPasswordHash,
      role: UserRole.owner,
      isActive: true,
    },
  });
  console.log(`✅ Created admin user: ${admin.username}`);

  // 2. Create Organization with the admin user as owner
  console.log("🏢 Creating organization...");
  const org = await prisma.organization.create({
    data: {
      name: "CrusherMate Operations",
      ownerId: admin.id,
    },
  });
  console.log(`✅ Created organization: ${org.name}`);

  // 3. Update admin user with organization
  const updatedAdmin = await prisma.user.update({
    where: { id: admin.id },
    data: { organizationId: org.id },
  });
  console.log("🔗 Linked admin to organization");

  // 4. Create Test User
  console.log("👥 Creating test user...");
  const testPasswordHash = await hashPassword(TEST_USER.password);

  const testUser = await prisma.user.create({
    data: {
      username: TEST_USER.username,
      passwordHash: testPasswordHash,
      role: UserRole.user,
      organizationId: org.id,
      isActive: true,
    },
  });
  console.log(`✅ Created test user: ${testUser.username}`);

  // 5. Create Material Rates
  console.log("💰 Creating material rates...");

  // Create Sales material rates
  const salesMaterialRates: any[] = [];
  for (const rate of MATERIAL_RATES) {
    const materialRate = await prisma.materialRate.create({
      data: {
        materialType: rate.materialType,
        ratePerUnit: rate.ratePerUnit,
        organizationId: org.id,
        isActive: true,
      },
    });
    salesMaterialRates.push(materialRate);
  }

  // Create RawStone material rates
  const rawStoneMaterialRates: any[] = [];
  for (const rate of RAWSTONE_MATERIAL_RATES) {
    const materialRate = await prisma.materialRate.create({
      data: {
        materialType: rate.materialType,
        ratePerUnit: rate.ratePerUnit,
        organizationId: org.id,
        isActive: true,
      },
    });
    rawStoneMaterialRates.push(materialRate);
  }

  console.log(
    `✅ Created ${
      MATERIAL_RATES.length + RAWSTONE_MATERIAL_RATES.length
    } material rates`
  );

  // 6. Create Entry Type Material Bridge Table
  console.log("🔗 Creating entry type material mappings...");

  // Map Sales entry type to all Sales materials
  for (const materialRate of salesMaterialRates) {
    await prisma.entryTypeMaterial.create({
      data: {
        organizationId: org.id,
        entryType: "Sales",
        materialRateId: materialRate.id,
      },
    });
  }

  // Map RawStone entry type to RawStone materials
  for (const materialRate of rawStoneMaterialRates) {
    await prisma.entryTypeMaterial.create({
      data: {
        organizationId: org.id,
        entryType: "RawStone",
        materialRateId: materialRate.id,
      },
    });
  }

  console.log(
    `✅ Created ${
      salesMaterialRates.length + rawStoneMaterialRates.length
    } entry type material mappings`
  );

  // 7. Create Truck Entries
  console.log("🚛 Creating truck entries...");
  const now = new Date();
  for (const t of TRUCK_ENTRIES) {
    const entryDate = new Date(now.getTime() - t.offsetDays * 86400000);
    const entryTime = new Date(entryDate);
    entryTime.setHours(
      9 + Math.floor(Math.random() * 8),
      Math.floor(Math.random() * 60)
    ); // Random time between 9AM-5PM

    await prisma.truckEntry.create({
      data: {
        organizationId: org.id,
        userId: updatedAdmin.id,
        truckNumber: t.truckNumber,
        truckName: t.truckName,
        entryType: t.entryType,
        materialType: t.materialType,
        units: t.units,
        ratePerUnit: t.ratePerUnit,
        totalAmount: t.units * t.ratePerUnit,
        entryDate: entryDate,
        entryTime: entryTime,
        status: EntryStatus.active,
        notes: t.notes,
      },
    });
  }
  console.log(`✅ Created ${TRUCK_ENTRIES.length} truck entries`);

  // 8. Create Other Expenses
  console.log("💸 Creating other expenses...");
  for (const e of OTHER_EXPENSES) {
    const date = new Date(now.getTime() - e.offsetDays * 86400000);
    await prisma.otherExpense.create({
      data: {
        organizationId: org.id,
        userId: updatedAdmin.id,
        expensesName: e.expenseType, // Use expensesName instead of expenseType
        amount: e.amount,
        others: e.description, // Use others instead of description
        date,
        isActive: true,
      },
    });
  }
  console.log(`✅ Created ${OTHER_EXPENSES.length} other expenses`);

  console.log("🎉 DEV seed complete!");

  // Display summary
  console.log("\n📋 Summary:");
  console.log(
    `👤 Admin User: ${updatedAdmin.username} (ID: ${updatedAdmin.id})`
  );
  console.log(`👥 Test User: ${testUser.username} (ID: ${testUser.id})`);
  console.log(`🏢 Organization: ${org.name} (ID: ${org.id})`);

  console.log("\n🔐 Login Credentials:");
  console.log(`Admin: ${updatedAdmin.username} / ${ADMIN.password}`);
  console.log(`Test User: ${testUser.username} / ${TEST_USER.password}`);

  // Display statistics
  const totalUsers = await prisma.user.count();
  const totalOrganizations = await prisma.organization.count();
  const totalRates = await prisma.materialRate.count();
  const totalEntryTypeMaterials = await prisma.entryTypeMaterial.count();
  const totalTruckEntries = await prisma.truckEntry.count();
  const totalExpenses = await prisma.otherExpense.count();

  console.log("\n📊 Database Statistics:");
  console.log(`Users: ${totalUsers}`);
  console.log(`Organizations: ${totalOrganizations}`);
  console.log(`Material Rates: ${totalRates}`);
  console.log(`Entry Type Materials: ${totalEntryTypeMaterials}`);
  console.log(`Truck Entries: ${totalTruckEntries}`);
  console.log(`Other Expenses: ${totalExpenses}`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
