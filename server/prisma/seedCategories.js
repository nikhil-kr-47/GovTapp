import { prisma } from "../lib/prisma.js";

async function main() {
  console.log("🌱 Seeding categories to database...");

  const categories = [
    { name: "Civil Construction" },
    { name: "Electrical & Electronics" },
    { name: "Defense & Aerospace" },
    { name: "Healthcare & Medical Supplies" },
    { name: "Information Technology & Software" },
    { name: "Railways & Transport" },
  ];

  for (const cat of categories) {
    const upserted = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
    console.log(`✓ Category ready: ${upserted.name} (${upserted.id})`);
  }

  console.log("✅ All 6 categories seeded successfully!");
}

main()
  .catch((e) => {
    console.error("Failed seeding categories:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
