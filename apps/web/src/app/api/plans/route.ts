import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const type = req.nextUrl.searchParams.get("type");
    const where: Record<string, unknown> = { isActive: true };
    if (type) where.type = type;

    const plans = await prisma.plan.findMany({
      where,
      orderBy: { sortOrder: "asc" },
    });
    return NextResponse.json(plans);
  } catch (err) {
    console.error("[plans]", err);
    return NextResponse.json({ error: "Failed to fetch plans" }, { status: 500 });
  }
}
