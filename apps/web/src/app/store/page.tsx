import { prisma } from "@/lib/db";
import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { StoreClient } from "@/components/marketing/store-client";

export const dynamic = "force-dynamic";

export default async function StorePage() {
  const [mcPlans, discordPlans] = await Promise.all([
    prisma.plan.findMany({ where: { isActive: true, type: "MINECRAFT" }, orderBy: { sortOrder: "asc" } }),
    prisma.plan.findMany({ where: { isActive: true, type: "DISCORD_BOT" }, orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <>
      <Navbar />
      <StoreClient mcPlans={mcPlans} discordPlans={discordPlans} />
      <Footer />
    </>
  );
}
