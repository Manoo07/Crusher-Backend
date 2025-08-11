import { EntryType, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function debugAPICall() {
  try {
    const organizationId = "db5edb9d-eb4a-41b4-8596-cdbe29999ba6"; // From our test
    const entryType = "Sales";

    console.log(`🔍 Testing API logic for entryType: ${entryType}`);
    console.log(`📍 Organization ID: ${organizationId}\n`);

    // Simulate the exact query the controller is making
    const entryTypeMaterials = await prisma.entryTypeMaterial.findMany({
      where: {
        organizationId,
        entryType: entryType as EntryType,
        isActive: true,
      },
      include: {
        organization: true,
        materialRate: true,
      },
      orderBy: {
        materialRate: { materialType: "asc" },
      },
    });

    console.log(
      `📊 Query returned ${entryTypeMaterials.length} results for ${entryType}`
    );

    entryTypeMaterials.forEach((etm, index) => {
      console.log(
        `   ${index + 1}. ${etm.materialRate.materialType} - ₹${
          etm.materialRate.ratePerUnit
        }/unit`
      );
    });

    // Now test RawStone
    console.log(`\n🔍 Testing API logic for entryType: RawStone`);

    const rawStoneEntryTypeMaterials = await prisma.entryTypeMaterial.findMany({
      where: {
        organizationId,
        entryType: "RawStone",
        isActive: true,
      },
      include: {
        organization: true,
        materialRate: true,
      },
      orderBy: {
        materialRate: { materialType: "asc" },
      },
    });

    console.log(
      `📊 Query returned ${rawStoneEntryTypeMaterials.length} results for RawStone`
    );

    rawStoneEntryTypeMaterials.forEach((etm, index) => {
      console.log(
        `   ${index + 1}. ${etm.materialRate.materialType} - ₹${
          etm.materialRate.ratePerUnit
        }/unit`
      );
    });

    console.log("\n✅ Debug complete!");
  } catch (error) {
    console.error("❌ Debug failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

debugAPICall();
