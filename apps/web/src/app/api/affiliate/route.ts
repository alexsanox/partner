import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
function genCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// GET - fetch own affiliate profile (create if not exists)
export async function GET() {
  const session = await requireAuth();

  let profile = await prisma.affiliateProfile.findUnique({
    where: { userId: session.user.id },
    include: {
      commissions: { orderBy: { createdAt: "desc" }, take: 20 },
      payouts: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  if (!profile) {
    const code = genCode();
    profile = await prisma.affiliateProfile.create({
      data: { userId: session.user.id, code },
      include: {
        commissions: { orderBy: { createdAt: "desc" }, take: 20 },
        payouts: { orderBy: { createdAt: "desc" }, take: 10 },
      },
    });
  }

  const totalConversions = await prisma.affiliateCommission.count({
    where: { affiliateId: profile.id },
  });

  return NextResponse.json({ ...profile, totalConversions });
}

// POST - request payout
export async function POST(req: NextRequest) {
  const session = await requireAuth();
  const { method, details } = (await req.json()) as { method: string; details: string };

  const profile = await prisma.affiliateProfile.findUnique({
    where: { userId: session.user.id },
  });

  if (!profile) return NextResponse.json({ error: "No affiliate profile" }, { status: 404 });
  if (profile.pendingEarnings < 1000) {
    return NextResponse.json({ error: "Minimum payout is $10.00" }, { status: 400 });
  }

  const existing = await prisma.affiliatePayout.findFirst({
    where: { affiliateId: profile.id, status: "PENDING" },
  });
  if (existing) {
    return NextResponse.json({ error: "You already have a pending payout request" }, { status: 400 });
  }

  const payout = await prisma.affiliatePayout.create({
    data: {
      affiliateId: profile.id,
      amountCents: profile.pendingEarnings,
      method,
      details,
    },
  });

  return NextResponse.json(payout);
}
