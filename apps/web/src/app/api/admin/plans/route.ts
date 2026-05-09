import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") return null;
  return session;
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json();
  const { planId, action, data } = body;

  if (!planId) {
    return NextResponse.json({ error: "Missing planId" }, { status: 400 });
  }

  try {
    switch (action) {
      case "toggleActive": {
        const plan = await prisma.plan.findUnique({ where: { id: planId } });
        if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });
        await prisma.plan.update({ where: { id: planId }, data: { isActive: !plan.isActive } });
        return NextResponse.json({ success: true, isActive: !plan.isActive });
      }
      case "update": {
        if (!data) return NextResponse.json({ error: "Missing data" }, { status: 400 });
        const allowed: Record<string, boolean> = {
          name: true, description: true, ramMb: true, cpuPercent: true,
          diskMb: true, playerSlots: true, backupSlots: true, databaseLimit: true,
          priceMonthly: true, priceQuarterly: true, priceAnnual: true,
          features: true, sortOrder: true, isActive: true,
        };
        const updateData: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(data)) {
          if (allowed[key]) updateData[key] = value;
        }
        await prisma.plan.update({ where: { id: planId }, data: updateData });
        return NextResponse.json({ success: true });
      }
      case "delete": {
        const plan = await prisma.plan.findUnique({
          where: { id: planId },
          include: { _count: { select: { services: true } } },
        });
        if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });
        if (plan._count.services > 0) {
          return NextResponse.json({ error: "Cannot delete plan with active services" }, { status: 400 });
        }
        await prisma.plan.delete({ where: { id: planId } });
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Admin plan action failed:", error);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
