import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuth();
    const sessionId = req.nextUrl.searchParams.get("session");
    if (!sessionId) return NextResponse.json({ error: "Missing session" }, { status: 400 });

    // stripeSessionId on Order holds the setupIntentId
    const order = await prisma.order.findFirst({
      where: { stripeSessionId: sessionId, userId: session.user.id },
      include: { service: { select: { name: true } } },
    });

    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

    return NextResponse.json({
      orderId: order.id,
      serverName: order.service?.name ?? null,
      status: order.status,
    });
  } catch (err) {
    console.error("[setup-order]", err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
