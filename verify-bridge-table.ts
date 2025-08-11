import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function verifyBridgeTable() {
  try {
    console.log("🔍 Verifying bridge table data...\n");

    // Get all entry type materials with their related data
    const entryTypeMaterials = await prisma.entryTypeMaterial.findMany({
      include: {
        materialRate: true,
        organization: true,
      },
      orderBy: [
        { entryType: "asc" },
        { materialRate: { materialType: "asc" } },
      ],
    });

    console.log(
      `📊 Found ${entryTypeMaterials.length} entry type material mappings:\n`
    );

    // Group by entry type
    const salesMaterials = entryTypeMaterials.filter(
      (etm) => etm.entryType === "Sales"
    );
    const rawStoneMaterials = entryTypeMaterials.filter(
      (etm) => etm.entryType === "RawStone"
    );

    console.log("🏷️  SALES Entry Type Materials:");
    salesMaterials.forEach((etm, index) => {
      console.log(
        `   ${index + 1}. ${etm.materialRate.materialType} - ₹${
          etm.materialRate.ratePerUnit
        }/unit`
      );
    });

    console.log(`\n🪨 RAW STONE Entry Type Materials:`);
    rawStoneMaterials.forEach((etm, index) => {
      console.log(
        `   ${index + 1}. ${etm.materialRate.materialType} - ₹${
          etm.materialRate.ratePerUnit
        }/unit`
      );
    });

    console.log(`\n✅ Bridge table verification complete!`);
  } catch (error) {
    console.error("❌ Verification failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyBridgeTable();
