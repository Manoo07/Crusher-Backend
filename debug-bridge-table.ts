import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function debugBridgeTable() {
  try {
    console.log("🔍 Debugging bridge table data...\n");

    // Get all entry type materials with their related data
    const entryTypeMaterials = await prisma.entryTypeMaterial.findMany({
      include: {
        materialRate: true,
      },
      orderBy: [
        { entryType: "asc" },
        { materialRate: { materialType: "asc" } },
      ],
    });

    console.log(
      `📊 Total EntryTypeMaterial records: ${entryTypeMaterials.length}\n`
    );

    // Group by entry type
    const salesCount = entryTypeMaterials.filter(
      (etm) => etm.entryType === "Sales"
    ).length;
    const rawStoneCount = entryTypeMaterials.filter(
      (etm) => etm.entryType === "RawStone"
    ).length;

    console.log(`🏷️  Sales mappings: ${salesCount}`);
    console.log(`🪨 RawStone mappings: ${rawStoneCount}\n`);

    // Show actual mappings
    console.log("📋 Actual bridge table mappings:");
    entryTypeMaterials.forEach((etm) => {
      console.log(
        `   ${etm.entryType}: ${etm.materialRate.materialType} (ID: ${etm.id})`
      );
    });

    // Get all material rates to compare
    console.log("\n📊 All material rates in database:");
    const allRates = await prisma.materialRate.findMany({
      orderBy: { materialType: "asc" },
    });

    allRates.forEach((rate) => {
      console.log(
        `   ${rate.materialType} - ₹${rate.ratePerUnit}/unit (ID: ${rate.id})`
      );
    });

    console.log("\n✅ Debug complete!");
  } catch (error) {
    console.error("❌ Debug failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

debugBridgeTable();
