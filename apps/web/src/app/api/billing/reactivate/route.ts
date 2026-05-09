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

    // Remove the scheduled cancellation
    await stripe.subscriptions.update(service.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[billing/reactivate]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to reactivate" },
      { status: 500 }
    );
  }
}
