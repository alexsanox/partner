import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { suspendServer } from "@/lib/pelican";

// GET /api/cron/expire-trials
// Secured with CRON_SECRET header. Call every hour via crontab:
//   0 * * * * curl -s -H "x-cron-secret: $CRON_SECRET" https://novally.tech/api/cron/expire-trials
export async function GET(req: NextRequest) {
  const secret = req.headers.get("x-cron-secret");
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();

  // Find all active trial services whose trial has ended
  const expired = await prisma.service.findMany({
    where: {
      isTrial: true,
      status: "ACTIVE",
      trialEndsAt: { lte: now },
    },
  });

  const results: { id: string; name: string; action: string; error?: string }[] = [];

  for (const service of expired) {
    try {
      if (service.externalServerId) {
        await suspendServer(Number(service.externalServerId));
      }
      await prisma.service.update({
        where: { id: service.id },
        data: { status: "SUSPENDED", suspendedAt: now },
      });
      results.push({ id: service.id, name: service.name, action: "suspended" });
    } catch (err) {
      results.push({ id: service.id, name: service.name, action: "error", error: String(err) });
    }
  }

  return NextResponse.json({ processed: results.length, results });
}
