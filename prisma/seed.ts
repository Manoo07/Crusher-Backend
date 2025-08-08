// Production Database Seeding Script for Prisma
import { PrismaClient, UserRole } from "@prisma/client";
import * as bcrypt from "bcrypt";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

// Seed organization and admin user
const seedOrganizationAndAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || "raj@gmail.com";
    const adminPassword = process.env.ADMIN_PASSWORD || "Test@123";
    const adminUsername = process.env.ADMIN_USERNAME || "raj";

    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { username: adminUsername },
      include: { organization: true },
    });

    if (existingAdmin) {
      console.log(`👤 Admin user already exists: ${adminUsername}`);
      return existingAdmin;
    }

    // Hash password
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(adminPassword, saltRounds);

    // Create admin user first (without organization)
    const adminUser = await prisma.user.create({
      data: {
        username: adminUsername,
        passwordHash: passwordHash,
        role: UserRole.owner,
        isActive: true,
      },
    });

    console.log(`✅ Admin user created: ${adminUsername}`);

    // Create organization with the admin user as owner
    const organization = await prisma.organization.create({
      data: {
        name: "CrusherMate Operations",
        ownerId: adminUser.id,
      },
    });

    console.log(`✅ Organization created: ${organization.name}`);

    // Update admin user with organization
    const updatedAdminUser = await prisma.user.update({
      where: { id: adminUser.id },
      data: { organizationId: organization.id },
    });

    return updatedAdminUser;
  } catch (error) {
    console.error("❌ Error creating admin user:", error);
    throw error;
  }
};

// Seed material rates
const seedMaterialRates = async (adminUser: any) => {
  try {
    const defaultRates = [
      {
        materialType: "M-Sand",
        currentRate: 22000,
        notes: "Market rate for M-Sand per unit",
      },
      {
        materialType: "P-Sand",
        currentRate: 20000,
        notes: "Market rate for P-Sand per unit",
      },
      {
        materialType: "Blue Metal 0.5in",
        currentRate: 24000,
        notes: "Market rate for Blue Metal 0.5in per unit",
      },
      {
        materialType: "Blue Metal 0.75in",
        currentRate: 25000,
        notes: "Market rate for Blue Metal 0.75in per unit",
      },
      {
        materialType: "Jally",
        currentRate: 18000,
        notes: "Market rate for Jally per unit",
      },
      {
        materialType: "Kurunai",
        currentRate: 16000,
        notes: "Market rate for Kurunai per unit",
      },
      {
        materialType: "Mixed",
        currentRate: 20000,
        notes: "Market rate for Mixed materials per unit",
      },
    ];

    for (const rate of defaultRates) {
      const existingRate = await prisma.materialRate.findFirst({
        where: {
          materialType: rate.materialType,
          organizationId: adminUser.organizationId,
        },
      });

      if (!existingRate) {
        await prisma.materialRate.create({
          data: {
            materialType: rate.materialType,
            ratePerUnit: rate.currentRate,
            unitType: "Load",
            organizationId: adminUser.organizationId,
            isActive: true,
          },
        });
        console.log(
          `✅ Created rate for ${rate.materialType}: ₹${rate.currentRate}`
        );
      } else {
        console.log(
          `📝 Rate already exists for ${rate.materialType}: ₹${existingRate.ratePerUnit}`
        );
      }
    }
  } catch (error) {
    console.error("❌ Error seeding material rates:", error);
    throw error;
  }
};

// Main seeding function
async function main() {
  try {
    console.log("🌱 Starting production database seeding...");
    console.log(
      `📊 Database URL: ${process.env.DATABASE_URL?.replace(
        /\/\/.*@/,
        "//***:***@"
      )}`
    );

    // Test database connection
    await prisma.$connect();
    console.log("✅ Connected to production PostgreSQL database");

    // Seed admin user and organization
    const adminUser = await seedOrganizationAndAdmin();

    // Seed material rates
    await seedMaterialRates(adminUser);

    console.log("🎉 Production database seeding completed successfully!");
    console.log("\n📋 Summary:");
    console.log(
      `👤 Admin User: ${adminUser.username} (role: ${adminUser.role})`
    );
    console.log(`🏢 Organization ID: ${adminUser.organizationId}`);

    console.log("\n🔐 Login Credentials:");
    console.log(
      `Username: ${adminUser.username} / Password: ${
        process.env.ADMIN_PASSWORD || "Test@123"
      }`
    );

    // Display some statistics
    const totalUsers = await prisma.user.count();
    const totalOrganizations = await prisma.organization.count();
    const totalRates = await prisma.materialRate.count();

    console.log("\n📊 Database Statistics:");
    console.log(`Users: ${totalUsers}`);
    console.log(`Organizations: ${totalOrganizations}`);
    console.log(`Material Rates: ${totalRates}`);
  } catch (error) {
    console.error("❌ Production database seeding failed:", error);
    process.exit(1);
  }
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
