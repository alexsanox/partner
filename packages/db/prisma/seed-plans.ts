import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const plans = [
  {
    name: "Dirt",
    slug: "dirt",
    description: "A humble start — perfect for playing with a few friends",
    ramMb: 2048,
    cpuPercent: 100,
    diskMb: 10240,
    playerSlots: 10,
    backupSlots: 1,
    databaseLimit: 0,
    priceMonthly: 300, // $3/mo
    priceQuarterly: 800, // $8/qtr
    priceAnnual: 3000, // $30/yr
    features: ["2 GB RAM", "10 GB Disk", "1 Backup", "10 Player Slots", "DDoS Protection"],
    sortOrder: 0,
  },
  {
    name: "Iron",
    slug: "iron",
    description: "Solid and reliable — built for growing communities",
    ramMb: 4096,
    cpuPercent: 200,
    diskMb: 25600,
    playerSlots: 30,
    backupSlots: 3,
    databaseLimit: 1,
    priceMonthly: 800, // $8/mo
    priceQuarterly: 2100, // $21/qtr
    priceAnnual: 8000, // $80/yr
    features: ["4 GB RAM", "25 GB Disk", "3 Backups", "30 Player Slots", "DDoS Protection", "Priority Support"],
    sortOrder: 1,
  },
  {
    name: "Diamond",
    slug: "diamond",
    description: "Maximum power for large networks and serious players",
    ramMb: 8192,
    cpuPercent: 400,
    diskMb: 51200,
    playerSlots: 100,
    backupSlots: 5,
    databaseLimit: 3,
    priceMonthly: 2000, // $20/mo
    priceQuarterly: 5400, // $54/qtr
    priceAnnual: 20000, // $200/yr
    features: ["8 GB RAM", "50 GB Disk", "5 Backups", "100 Player Slots", "DDoS Protection", "Priority Support", "Custom Domain"],
    sortOrder: 2,
  },
];

async function main() {
  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { slug: plan.slug },
      update: plan,
      create: plan,
    });
    console.log(`✓ Upserted plan: ${plan.name}`);
  }
  console.log("Done seeding plans!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
