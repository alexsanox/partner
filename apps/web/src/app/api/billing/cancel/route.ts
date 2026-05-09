import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-server";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { serviceId } = (await req.json()) as { serviceId: string };

    const service = await prisma.service.findFirst({
      where: { id: serviceId, userId: session.user.id },
    });

    if (!service || !service.stripeSubscriptionId) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Cancel at end of billing period
    await stripe.subscriptions.update(service.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[billing/cancel]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to cancel" },
      { status: 500 }
    );
  }
}
