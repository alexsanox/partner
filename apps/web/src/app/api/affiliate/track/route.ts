import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("ref");
  const redirect = req.nextUrl.searchParams.get("to") ?? "/";

  if (code) {
    const affiliate = await prisma.affiliateProfile.findUnique({
      where: { code, isActive: true },
    });

    if (affiliate) {
      await prisma.affiliateClick.create({
        data: {
          affiliateId: affiliate.id,
          ip: req.headers.get("cf-connecting-ip") ?? req.headers.get("x-real-ip") ?? null,
          userAgent: req.headers.get("user-agent") ?? null,
          referrer: req.headers.get("referer") ?? null,
        },
      });
      await prisma.affiliateProfile.update({
        where: { id: affiliate.id },
        data: { totalClicks: { increment: 1 } },
      });
    }
  }

  const res = NextResponse.redirect(new URL(redirect, req.nextUrl.origin));
  if (code) {
    res.cookies.set("ref", code, { maxAge: 60 * 60 * 24 * 30, path: "/" }); // 30 days
  }
  return res;
}
