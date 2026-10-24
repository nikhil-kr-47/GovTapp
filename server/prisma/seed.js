import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma.js";

async function main() {
  console.log("🌱 Starting database seeding...");

  // 1. Categories
  const categoryData = [
    { name: "Civil Construction" },
    { name: "Electrical & Electronics" },
    { name: "Defense & Aerospace" },
    { name: "Healthcare & Medical Supplies" },
    { name: "Information Technology & Software" },
    { name: "Railways & Transport" },
  ];

  const categories = {};
  for (const cat of categoryData) {
    const upserted = await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
    categories[cat.name] = upserted;
    console.log(`✓ Category: ${cat.name} (${upserted.id})`);
  }

  // 2. Sample Users
  const hashedPassword = await bcrypt.hash("password123", 10);
  const sampleUsers = [
    { email: "contractor@govtapp.com", password: hashedPassword },
    { email: "vendor@govtapp.com", password: hashedPassword },
    { email: "tech@govtapp.com", password: hashedPassword },
  ];

  const users = {};
  for (const u of sampleUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: u,
    });
    users[u.email] = user;
    console.log(`✓ User: ${u.email}`);
  }

  // 3. UserCategory associations
  // contractor -> Civil Construction + Railways
  await prisma.userCategory.deleteMany({ where: { userId: users["contractor@govtapp.com"].id } });
  await prisma.userCategory.createMany({
    data: [
      { userId: users["contractor@govtapp.com"].id, categoryId: categories["Civil Construction"].id },
      { userId: users["contractor@govtapp.com"].id, categoryId: categories["Railways & Transport"].id },
    ],
  });

  // vendor -> Defense + Electrical
  await prisma.userCategory.deleteMany({ where: { userId: users["vendor@govtapp.com"].id } });
  await prisma.userCategory.createMany({
    data: [
      { userId: users["vendor@govtapp.com"].id, categoryId: categories["Defense & Aerospace"].id },
      { userId: users["vendor@govtapp.com"].id, categoryId: categories["Electrical & Electronics"].id },
    ],
  });

  // tech -> IT & Software + Healthcare
  await prisma.userCategory.deleteMany({ where: { userId: users["tech@govtapp.com"].id } });
  await prisma.userCategory.createMany({
    data: [
      { userId: users["tech@govtapp.com"].id, categoryId: categories["Information Technology & Software"].id },
      { userId: users["tech@govtapp.com"].id, categoryId: categories["Healthcare & Medical Supplies"].id },
    ],
  });
  console.log("✓ User-Category preferences linked");

  // 4. Categorize existing tenders by matching keywords
  const allTenders = await prisma.tender.findMany();
  for (const tender of allTenders) {
    const text = `${tender.title} ${tender.department}`.toLowerCase();
    let matchedCatId = null;

    if (text.includes("defence") || text.includes("ordnance") || text.includes("air force") || text.includes("gun") || text.includes("space")) {
      matchedCatId = categories["Defense & Aerospace"].id;
    } else if (text.includes("rail") || text.includes("siding") || text.includes("container") || text.includes("jnpt") || text.includes("fmlm")) {
      matchedCatId = categories["Railways & Transport"].id;
    } else if (text.includes("electric") || text.includes("light") || text.includes("voltage") || text.includes("wire") || text.includes("led") || text.includes("ic")) {
      matchedCatId = categories["Electrical & Electronics"].id;
    } else if (text.includes("construction") || text.includes("civil") || text.includes("floor") || text.includes("pipeline") || text.includes("grill")) {
      matchedCatId = categories["Civil Construction"].id;
    } else if (text.includes("hospital") || text.includes("medical") || text.includes("pump") || text.includes("acetone")) {
      matchedCatId = categories["Healthcare & Medical Supplies"].id;
    } else {
      matchedCatId = categories["Civil Construction"].id;
    }

    await prisma.tender.update({
      where: { id: tender.id },
      data: {
        categoryId: matchedCatId,
        value: tender.value || `₹${Math.floor(Math.random() * 80 + 10)},00,000`,
        deadline: tender.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  }
  console.log(`✓ Categorized and enriched ${allTenders.length} scraped tenders`);

  // 5. Additional curated sample tenders for variety
  const sampleTenders = [
    {
      title: "Design, Supply and Implementation of Hospital Management Information System (HMIS)",
      department: "All India Institute of Medical Sciences (AIIMS)",
      value: "₹1,85,00,000",
      deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      referenceNo: "AIIMS/IT/2026/044",
      sourceUrl: "https://eprocure.gov.in/epublish/app",
      categoryId: categories["Information Technology & Software"].id,
    },
    {
      title: "Supply and Commissioning of 500KW Rooftop Solar PV Power Plant",
      department: "National Thermal Power Corporation (NTPC)",
      value: "₹2,40,00,000",
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      referenceNo: "NTPC/SOLAR/2026/102",
      sourceUrl: "https://eprocure.gov.in/epublish/app",
      categoryId: categories["Electrical & Electronics"].id,
    },
    {
      title: "Annual Maintenance and Supply of Advanced ICU Ventilators and Patient Monitors",
      department: "Safdarjung Hospital, New Delhi",
      value: "₹75,00,000",
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      referenceNo: "SJH/MED/2026/892",
      sourceUrl: "https://eprocure.gov.in/epublish/app",
      categoryId: categories["Healthcare & Medical Supplies"].id,
    },
    {
      title: "Construction of Four-Lane Elevated Corridor on National Highway 44",
      department: "National Highways Authority of India (NHAI)",
      value: "₹18,50,00,000",
      deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
      referenceNo: "NHAI/TECH/2026/CORR/08",
      sourceUrl: "https://eprocure.gov.in/epublish/app",
      categoryId: categories["Civil Construction"].id,
    },
    {
      title: "Procurement of High-Capacity Cloud Infrastructure and Cybersecurity Suite",
      department: "Ministry of Electronics and Information Technology (MeitY)",
      value: "₹4,10,00,000",
      deadline: new Date(Date.now() + 12 * 24 * 60 * 60 * 1000),
      referenceNo: "MEITY/CYBER/2026/77",
      sourceUrl: "https://eprocure.gov.in/epublish/app",
      categoryId: categories["Information Technology & Software"].id,
    },
  ];

  for (const tender of sampleTenders) {
    await prisma.tender.upsert({
      where: { referenceNo: tender.referenceNo },
      update: {},
      create: tender,
    });
  }
  console.log(`✓ Added ${sampleTenders.length} high-value curated sample tenders`);

  console.log("🎉 Database seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
