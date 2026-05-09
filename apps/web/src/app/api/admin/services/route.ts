import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

async function requireAdmin() {
  const session = await getSession();
  if (!session || session.user.role !== "ADMIN") {
    return null;
  }
  return session;
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 403 });

  const body = await req.json();
  const { serviceId, action } = body;

  if (!serviceId || !action) {
    return NextResponse.json({ error: "Missing serviceId or action" }, { status: 400 });
  }

  try {
    switch (action) {
      case "suspend": {
        await prisma.service.update({
          where: { id: serviceId },
          data: { status: "SUSPENDED", suspendedAt: new Date() },
        });
        return NextResponse.json({ success: true });
      }
      case "unsuspend": {
        await prisma.service.update({
          where: { id: serviceId },
          data: { status: "ACTIVE", suspendedAt: null },
        });
        return NextResponse.json({ success: true });
      }
      case "cancel": {
        await prisma.service.update({
          where: { id: serviceId },
          data: { status: "CANCELLED", cancelledAt: new Date() },
        });
        return NextResponse.json({ success: true });
      }
      case "delete": {
        await prisma.service.update({
          where: { id: serviceId },
          data: { deletedAt: new Date(), status: "CANCELLED" },
        });
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Admin service action failed:", error);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
