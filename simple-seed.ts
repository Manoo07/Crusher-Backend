import { PrismaClient, UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
});

async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

async function simpleSeed() {
  try {
    console.log("🌱 Starting simple seed test...");

    // Test 1: Create Admin User
    console.log("👤 Creating admin user...");
    const adminPasswordHash = await hashPassword("Test@123");

    const admin = await prisma.user.create({
      data: {
        username: "raj",
        passwordHash: adminPasswordHash,
        role: UserRole.owner,
        isActive: true,
      },
    });
    console.log(`✅ Created admin user: ${admin.username} (ID: ${admin.id})`);

    // Test 2: Create Organization
    console.log("🏢 Creating organization...");
    const org = await prisma.organization.create({
      data: {
        name: "Test Organization",
        ownerId: admin.id,
      },
    });
    console.log(`✅ Created organization: ${org.name} (ID: ${org.id})`);

    // Test 3: Update admin user
    const updatedAdmin = await prisma.user.update({
      where: { id: admin.id },
      data: { organizationId: org.id },
    });
    console.log("🔗 Linked admin to organization");

    // Test 4: Create Material Rate
    console.log("💰 Creating material rate...");
    const materialRate = await prisma.materialRate.create({
      data: {
        materialType: "Msand",
        ratePerUnit: 22000,
        organizationId: org.id,
        isActive: true,
      },
    });
    console.log(`✅ Created material rate: ${materialRate.materialType}`);

    // Test 5: Create Bridge Table Entry
    console.log("🔗 Creating entry type material...");
    const entryTypeMaterial = await prisma.entryTypeMaterial.create({
      data: {
        organizationId: org.id,
        entryType: "Sales",
        materialRateId: materialRate.id,
      },
    });
    console.log(
      `✅ Created entry type material mapping: ${entryTypeMaterial.id}`
    );

    console.log("🎉 Simple seed completed successfully!");
  } catch (error) {
    console.error("❌ Simple seed failed:", error);
  } finally {
    await prisma.$disconnect();
    console.log("🔌 Database disconnected");
  }
}

simpleSeed();
