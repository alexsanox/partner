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
  const { orderId, action } = body;

  if (!orderId || !action) {
    return NextResponse.json({ error: "Missing orderId or action" }, { status: 400 });
  }

  try {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    switch (action) {
      case "markPaid": {
        if (order.status === "PAID") {
          return NextResponse.json({ error: "Order already paid" }, { status: 400 });
        }
        await prisma.order.update({ where: { id: orderId }, data: { status: "PAID" } });
        return NextResponse.json({ success: true });
      }
      case "refund": {
        if (order.status !== "PAID") {
          return NextResponse.json({ error: "Can only refund paid orders" }, { status: 400 });
        }
        await prisma.order.update({ where: { id: orderId }, data: { status: "REFUNDED" } });
        return NextResponse.json({ success: true });
      }
      case "cancel": {
        if (order.status === "CANCELLED" || order.status === "REFUNDED") {
          return NextResponse.json({ error: "Order already cancelled/refunded" }, { status: 400 });
        }
        await prisma.order.update({ where: { id: orderId }, data: { status: "CANCELLED" } });
        return NextResponse.json({ success: true });
      }
      case "delete": {
        // Check if order has a service linked
        const service = await prisma.service.findUnique({ where: { orderId } });
        if (service) {
          return NextResponse.json({ error: "Cannot delete order with linked service" }, { status: 400 });
        }
        await prisma.order.delete({ where: { id: orderId } });
        return NextResponse.json({ success: true });
      }
      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("Admin order action failed:", error);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
