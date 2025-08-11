import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function populateEntryTypeMaterials() {
  try {
    console.log("🔄 Populating entry-type-material bridge table...");

    // Get all organizations
    const organizations = await prisma.organization.findMany({
      include: {
        materialRates: true,
      },
    });

    console.log(`Found ${organizations.length} organizations`);

    for (const org of organizations) {
      console.log(`\n📊 Processing organization: ${org.name}`);

      if (org.materialRates.length === 0) {
        console.log(
          `  ⚠️  No material rates found for ${org.name}, skipping...`
        );
        continue;
      }

      // Create mappings for Sales entry type (all materials can be used for sales)
      const salesMappings = org.materialRates.map((rate) => ({
        organizationId: org.id,
        entryType: "Sales" as const,
        materialRateId: rate.id,
      }));

      // Create mappings for RawStone entry type (typically stone-related materials)
      const rawStoneMaterials = org.materialRates.filter(
        (rate) =>
          rate.materialType.toLowerCase().includes("stone") ||
          rate.materialType.toLowerCase().includes("jally") ||
          rate.materialType.toLowerCase().includes("metal") ||
          rate.materialType.toLowerCase().includes("sand") ||
          rate.materialType.toLowerCase().includes("dust")
      );

      const rawStoneMappings = rawStoneMaterials.map((rate) => ({
        organizationId: org.id,
        entryType: "RawStone" as const,
        materialRateId: rate.id,
      }));

      // Insert Sales mappings
      if (salesMappings.length > 0) {
        const salesResult = await prisma.entryTypeMaterial.createMany({
          data: salesMappings,
          skipDuplicates: true,
        });
        console.log(`  ✅ Created ${salesResult.count} Sales mappings`);
      }

      // Insert RawStone mappings
      if (rawStoneMappings.length > 0) {
        const rawStoneResult = await prisma.entryTypeMaterial.createMany({
          data: rawStoneMappings,
          skipDuplicates: true,
        });
        console.log(`  ✅ Created ${rawStoneResult.count} RawStone mappings`);
      }
    }

    console.log("\n🎉 Bridge table population completed successfully!");

    // Show summary
    const totalMappings = await prisma.entryTypeMaterial.count();
    console.log(`📈 Total entry-type-material mappings: ${totalMappings}`);
  } catch (error) {
    console.error("❌ Error populating bridge table:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the population script
populateEntryTypeMaterials();
