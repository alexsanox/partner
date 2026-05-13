import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-server";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { planId, serverName, billingCycle } = (await req.json()) as {
      planId: string;
      serverName: string;
      billingCycle: "MONTHLY" | "QUARTERLY" | "ANNUAL";
    };

    if (!planId || !serverName) {
      return NextResponse.json({ error: "Missing planId or serverName" }, { status: 400 });
    }

    const plan = await prisma.plan.findUnique({ where: { id: planId } });
    if (!plan || !plan.isActive) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    }

    // Determine price based on billing cycle
    let amountCents: number;
    let interval: "month" | "year";
    let intervalCount: number;

    switch (billingCycle) {
      case "QUARTERLY":
        amountCents = plan.priceQuarterly ?? plan.priceMonthly * 3;
        interval = "month";
        intervalCount = 3;
        break;
      case "ANNUAL":
        amountCents = plan.priceAnnual ?? plan.priceMonthly * 12;
        interval = "year";
        intervalCount = 1;
        break;
      default:
        amountCents = plan.priceMonthly;
        interval = "month";
        intervalCount = 1;
    }

    // Find or create Stripe customer
    const existingCustomers = await stripe.customers.list({
      email: session.user.email,
      limit: 1,
    });

    let customerId: string;
    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id;
    } else {
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: session.user.name,
        metadata: { userId: session.user.id },
      });
      customerId = customer.id;
    }

    // Create a SetupIntent to collect card details, then create subscription after payment
    // This is the correct modern Stripe flow for subscriptions with deferred payment
    const refCode = req.cookies.get("ref")?.value ?? null;

    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      usage: "off_session",
      metadata: {
        userId: session.user.id,
        planId: plan.id,
        serverName,
        billingCycle,
        amountCents: amountCents.toString(),
        interval,
        intervalCount: intervalCount.toString(),
        planName: plan.name,
        ...(refCode ? { refCode } : {}),
      },
    });

    if (!setupIntent.client_secret) {
      throw new Error("Failed to create payment setup");
    }

    // Create pending order in DB (subscriptionId will be filled in by webhook after card confirmed)
    await prisma.order.create({
      data: {
        userId: session.user.id,
        planId: plan.id,
        status: "PENDING",
        billingCycle,
        amountCents,
        stripeSessionId: setupIntent.id,
      },
    });

    return NextResponse.json({
      clientSecret: setupIntent.client_secret,
      setupIntentId: setupIntent.id,
    });
  } catch (err) {
    console.error("[checkout]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
