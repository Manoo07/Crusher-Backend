import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testConnection() {
  try {
    console.log("🔌 Testing database connection...");

    // Simple connection test
    await prisma.$connect();
    console.log("✅ Database connected successfully");

    // Test a simple query
    const users = await prisma.user.findMany();
    console.log(`📊 Found ${users.length} users in database`);

    console.log("🎉 Connection test complete");
  } catch (error) {
    console.error("❌ Connection test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
