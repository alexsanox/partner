import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { suspendServer, deleteServer } from "@/lib/pelican";

const CRON_SECRET = process.env.CRON_SECRET;
const DELETE_AFTER_DAYS = 3;

export async function POST(req: NextRequest) {
  // Verify secret so only the server can call this
  const auth = req.headers.get("authorization");
  if (!CRON_SECRET || auth !== `Bearer ${CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const cutoff = new Date(now.getTime() - DELETE_AFTER_DAYS * 24 * 60 * 60 * 1000);

  const results = { suspended: 0, deleted: 0, errors: [] as string[] };

  // ── 1. Suspend services that are SUSPENDED in DB but not yet on Pelican ──
  const toSuspend = await prisma.service.findMany({
    where: {
      status: "SUSPENDED",
      externalServerId: { not: null },
      deletedAt: null,
    },
  });

  for (const svc of toSuspend) {
    try {
      await suspendServer(Number(svc.externalServerId));
      results.suspended++;
    } catch (e) {
      results.errors.push(`suspend:${svc.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // ── 2. Hard-delete services suspended/cancelled for 3+ days ─────────────
  const toDelete = await prisma.service.findMany({
    where: {
      status: { in: ["SUSPENDED", "CANCELLED"] },
      deletedAt: null,
      OR: [
        { suspendedAt: { lte: cutoff } },
        { cancelledAt: { lte: cutoff } },
      ],
    },
  });

  for (const svc of toDelete) {
    try {
      // Delete from Pelican first
      if (svc.externalServerId) {
        await deleteServer(Number(svc.externalServerId)).catch(() => {});
      }
      // Mark as deleted in DB
      await prisma.service.update({
        where: { id: svc.id },
        data: { deletedAt: now, status: "CANCELLED" },
      });
      results.deleted++;
    } catch (e) {
      results.errors.push(`delete:${svc.id}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  console.log("[cron/cleanup]", results);
  return NextResponse.json({ ok: true, ...results });
}
