import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-server";
import { updateServerBuild } from "@/lib/pelican";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { serviceId, newPlanId } = (await req.json()) as { serviceId: string; newPlanId: string };

    const service = await prisma.service.findFirst({
      where: { id: serviceId, userId: session.user.id },
      include: { plan: true },
    });

    if (!service || !service.stripeSubscriptionId) {
      return NextResponse.json({ error: "Service not found or no active subscription" }, { status: 404 });
    }

    if (service.status !== "ACTIVE") {
      return NextResponse.json({ error: "Service must be active to upgrade" }, { status: 400 });
    }

    const newPlan = await prisma.plan.findUnique({ where: { id: newPlanId, isActive: true } });
    if (!newPlan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    if (newPlan.priceMonthly <= service.plan.priceMonthly) {
      return NextResponse.json({ error: "New plan must be higher than current plan" }, { status: 400 });
    }

    // Get the current subscription and its item
    const sub = await stripe.subscriptions.retrieve(service.stripeSubscriptionId);
    const itemId = sub.items.data[0]?.id;
    if (!itemId) {
      return NextResponse.json({ error: "Subscription item not found" }, { status: 500 });
    }

    // Create a new price for the new plan
    const newPrice = await stripe.prices.create({
      currency: "usd",
      unit_amount: newPlan.priceMonthly,
      recurring: { interval: "month" },
      product_data: { name: `${newPlan.name} - ${service.name}` },
    });

    // Swap the subscription item — prorate immediately
    await stripe.subscriptions.update(service.stripeSubscriptionId, {
      items: [{ id: itemId, price: newPrice.id }],
      proration_behavior: "create_prorations",
      metadata: { planId: newPlan.id, planName: newPlan.name },
    });

    // Update DB
    await prisma.service.update({
      where: { id: service.id },
      data: { planId: newPlan.id },
    });

    // Update Pelican server resources
    if (service.externalServerId) {
      await updateServerBuild(Number(service.externalServerId), {
        memory: newPlan.ramMb,
        cpu: newPlan.cpuPercent,
        disk: newPlan.diskMb,
        backup_limit: newPlan.backupSlots,
      }).catch((e) => console.error("[billing/upgrade] Pelican update failed:", e));
    }

    return NextResponse.json({ success: true, newPlan: { name: newPlan.name, priceMonthly: newPlan.priceMonthly } });
  } catch (err) {
    console.error("[billing/upgrade]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Upgrade failed" },
      { status: 500 }
    );
  }
}
