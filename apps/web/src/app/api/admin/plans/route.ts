import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import type { PlanType } from "@prisma/client";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.user.role !== "admin") return null;
  return session;
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

const VALID_PLAN_TYPES: PlanType[] = ["MINECRAFT", "DISCORD_BOT", "CUSTOM"];

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  try {
    const body = await req.json();
    const {
      name, type, eggId, description, ramMb, cpuPercent, diskMb,
      playerSlots, backupSlots, databaseLimit, priceMonthly, features, sortOrder,
    } = body;

    if (!name || !priceMonthly || !ramMb || !cpuPercent || !diskMb) {
      return NextResponse.json({ error: "Name, price, RAM, CPU, and Disk are required" }, { status: 400 });
    }

    if (type && !VALID_PLAN_TYPES.includes(type)) {
      return NextResponse.json({ error: `Invalid type. Must be one of: ${VALID_PLAN_TYPES.join(", ")}` }, { status: 400 });
    }

    // Generate unique slug
    let slug = slugify(name);
    const existing = await prisma.plan.findUnique({ where: { slug } });
    if (existing) slug = `${slug}-${Date.now()}`;

    const plan = await prisma.plan.create({
      data: {
        name,
        slug,
        type: type || "MINECRAFT",
        eggId: eggId ? Number(eggId) : null,
        description: description || null,
        ramMb: Number(ramMb),
        cpuPercent: Number(cpuPercent),
        diskMb: Number(diskMb),
        playerSlots: Number(playerSlots || 0),
        backupSlots: Number(backupSlots || 1),
        databaseLimit: Number(databaseLimit || 0),
        priceMonthly: Number(priceMonthly),
        features: features || [],
        sortOrder: Number(sortOrder || 0),
      },
    });

    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error("Admin plan create failed:", error);
    return NextResponse.json({ error: "Failed to create plan" }, { status: 500 });
  }
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
          name: true, description: true, type: true, eggId: true,
          ramMb: true, cpuPercent: true,
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
