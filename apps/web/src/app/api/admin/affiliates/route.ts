import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.user.role !== "admin") return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const affiliates = await prisma.affiliateProfile.findMany({
    orderBy: { totalEarnings: "desc" },
    include: {
      user: { select: { name: true, email: true } },
      payouts: { where: { status: "PENDING" }, select: { id: true, amountCents: true } },
      _count: { select: { commissions: true, clicks: true } },
    },
  });

  return NextResponse.json(affiliates);
}

// PATCH — approve/reject payout or update commission %
export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const { action, payoutId, affiliateId, commissionPct, note } = await req.json();

  if (action === "approve-payout" || action === "reject-payout" || action === "mark-paid") {
    const status = action === "approve-payout" ? "APPROVED" : action === "mark-paid" ? "PAID" : "REJECTED";
    const payout = await prisma.affiliatePayout.update({
      where: { id: payoutId },
      data: { status, note: note ?? undefined },
    });
    if (status === "PAID") {
      await prisma.affiliateProfile.update({
        where: { id: payout.affiliateId },
        data: { pendingEarnings: { decrement: payout.amountCents } },
      });
      await prisma.affiliateCommission.updateMany({
        where: { affiliateId: payout.affiliateId, paid: false },
        data: { paid: true },
      });
    }
    return NextResponse.json({ success: true });
  }

  if (action === "set-commission") {
    await prisma.affiliateProfile.update({
      where: { id: affiliateId },
      data: { commissionPct: Number(commissionPct) },
    });
    return NextResponse.json({ success: true });
  }

  if (action === "toggle-active") {
    const profile = await prisma.affiliateProfile.findUnique({ where: { id: affiliateId } });
    await prisma.affiliateProfile.update({
      where: { id: affiliateId },
      data: { isActive: !profile?.isActive },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
