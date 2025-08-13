// prisma/seed.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const MATERIAL_RATES = [
  { materialType: '1 1/2" Metal', ratePerUnit: 1500 },
  { materialType: '3/4" jalli', ratePerUnit: 1500 },
  { materialType: '1/2" jalli', ratePerUnit: 1500 },
  { materialType: '1/4" kuranai', ratePerUnit: 1500 },
  { materialType: "Dust", ratePerUnit: 1500 },
  { materialType: "Wetmix", ratePerUnit: 1500 },
  { materialType: "Msand", ratePerUnit: 1500 },
  { materialType: "Psand", ratePerUnit: 1500 },
];

const RAWSTONE_MATERIAL_RATES = [
  { materialType: "RawStone", ratePerUnit: 1500 },
];

async function main() {
  const orgs = await prisma.organization.findMany();
  console.log(`Found ${orgs.length} organizations.`);

  for (const org of orgs) {
    console.log(`Adding materials for org: ${org.name}`);

    // Sales materials
    for (const mat of MATERIAL_RATES) {
      const materialRate = await prisma.materialRate.create({
        data: {
          organizationId: org.id,
          materialType: mat.materialType,
          ratePerUnit: mat.ratePerUnit,
        },
      });

      await prisma.entryTypeMaterial.create({
        data: {
          organizationId: org.id,
          entryType: "Sales",
          materialRateId: materialRate.id,
        },
      });
    }

    // RawStone materials
    for (const mat of RAWSTONE_MATERIAL_RATES) {
      const materialRate = await prisma.materialRate.create({
        data: {
          organizationId: org.id,
          materialType: mat.materialType,
          ratePerUnit: mat.ratePerUnit,
        },
      });

      await prisma.entryTypeMaterial.create({
        data: {
          organizationId: org.id,
          entryType: "RawStone",
          materialRateId: materialRate.id,
        },
      });
    }
  }

  console.log("✅ All materials added successfully.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
