import { EntryStatus, EntryType, PrismaClient, UserRole } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting database seed...");

  // Create a sample organization owner
  const owner = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      passwordHash: "$2b$10$example.hash.here", // In real app, use bcrypt to hash passwords
      role: UserRole.owner,
      isActive: true,
    },
  });

  // Create the organization
  const organization = await prisma.organization.upsert({
    where: { ownerId: owner.id },
    update: {},
    create: {
      name: "Sample Crusher Organization",
      ownerId: owner.id,
    },
  });

  // Create a regular user
  const user = await prisma.user.upsert({
    where: { username: "user1" },
    update: {},
    create: {
      username: "user1",
      passwordHash: "$2b$10$example.hash.here",
      role: UserRole.user,
      organizationId: organization.id,
      isActive: true,
    },
  });

  // Create material rates
  const materialRate1 = await prisma.materialRate.upsert({
    where: {
      organizationId_materialType: {
        organizationId: organization.id,
        materialType: "Sand",
      },
    },
    update: {},
    create: {
      organizationId: organization.id,
      materialType: "Sand",
      ratePerUnit: 1200.0,
      unitType: "Load",
      isActive: true,
    },
  });

  const materialRate2 = await prisma.materialRate.upsert({
    where: {
      organizationId_materialType: {
        organizationId: organization.id,
        materialType: "Stone",
      },
    },
    update: {},
    create: {
      organizationId: organization.id,
      materialType: "Stone",
      ratePerUnit: 1500.0,
      unitType: "Load",
      isActive: true,
    },
  });

  // Create sample truck entries
  const truckEntry1 = await prisma.truckEntry.create({
    data: {
      organizationId: organization.id,
      userId: user.id,
      truckNumber: "TN-01-AB-1234",
      truckName: "Ashok Leyland",
      entryType: EntryType.Sales,
      materialType: "Sand",
      units: 2.5,
      ratePerUnit: 1200.0,
      totalAmount: 3000.0,
      entryDate: new Date("2025-08-07"),
      entryTime: new Date("2025-08-07T10:30:00"),
      status: EntryStatus.active,
      notes: "Morning delivery to construction site",
    },
  });

  const truckEntry2 = await prisma.truckEntry.create({
    data: {
      organizationId: organization.id,
      userId: user.id,
      truckNumber: "TN-02-CD-5678",
      truckName: "Tata 1212",
      entryType: EntryType.RawStone,
      materialType: "Stone",
      units: 1.0,
      ratePerUnit: 1500.0,
      totalAmount: 1500.0,
      entryDate: new Date("2025-08-07"),
      entryTime: new Date("2025-08-07T14:15:00"),
      status: EntryStatus.active,
      notes: "Raw stone delivery from quarry",
    },
  });

  // Create sample other expenses
  const expense1 = await prisma.otherExpense.create({
    data: {
      organizationId: organization.id,
      userId: user.id,
      expenseType: "Fuel",
      amount: 2500.0,
      description: "Diesel for truck operations",
      date: new Date("2025-08-07"),
      isActive: true,
    },
  });

  const expense2 = await prisma.otherExpense.create({
    data: {
      organizationId: organization.id,
      userId: owner.id,
      expenseType: "Maintenance",
      amount: 1800.0,
      description: "Truck servicing and repairs",
      date: new Date("2025-08-06"),
      isActive: true,
    },
  });

  console.log("Seed data created successfully:");
  console.log("- Owner:", owner.username);
  console.log("- Organization:", organization.name);
  console.log("- User:", user.username);
  console.log(
    "- Material Rates:",
    materialRate1.materialType,
    materialRate2.materialType
  );
  console.log(
    "- Truck Entries:",
    truckEntry1.truckNumber,
    truckEntry2.truckNumber
  );
  console.log("- Other Expenses:", expense1.expenseType, expense2.expenseType);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
