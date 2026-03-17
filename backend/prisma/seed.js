const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Start seeding...");

  // Seed system settings
  console.log("Seeding system settings...");

  const systemSettings = [
    {
      key: "restrictDocsWithoutSDS",
      value: "false",
      description:
        "Allow users to upload documents that don't contain the Superintendent's name",
      category: "documents",
      isActive: true,
      createdBy: "system",
      updatedBy: "system",
    },
  ];

  for (const setting of systemSettings) {
    await prisma.systemsettings.upsert({
      where: { key: setting.key },
      update: setting,
      create: setting,
    });
  }

  console.log("Seeding finished.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
