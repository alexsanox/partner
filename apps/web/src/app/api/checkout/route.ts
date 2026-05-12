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

    // Create a Stripe price
    const price = await stripe.prices.create({
      currency: "usd",
      unit_amount: amountCents,
      recurring: { interval, interval_count: intervalCount },
      product_data: {
        name: `${plan.name} Server - ${serverName}`,
      },
    });

    // Create subscription with incomplete payment so we get clientSecret
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: price.id }],
      payment_behavior: "default_incomplete",
      payment_settings: {
        save_default_payment_method: "on_subscription",
        payment_method_types: ["card"],
      },
      expand: ["latest_invoice", "latest_invoice.payment_intent", "pending_setup_intent"],
      metadata: {
        userId: session.user.id,
        planId: plan.id,
        serverName,
        billingCycle,
      },
    });

    // Extract client secret — try payment_intent first, then pending_setup_intent
    type ExpandedInvoice = { payment_intent?: { client_secret?: string | null } | string | null } | string | null;
    type ExpandedSetupIntent = { client_secret?: string | null } | string | null;

    const invoice = subscription.latest_invoice as ExpandedInvoice;
    const setupIntent = (subscription as unknown as { pending_setup_intent?: ExpandedSetupIntent }).pending_setup_intent;

    let clientSecret: string | null | undefined;

    if (invoice && typeof invoice === "object") {
      const pi = invoice.payment_intent;
      if (pi && typeof pi === "object") {
        clientSecret = pi.client_secret;
      }
    }

    if (!clientSecret && setupIntent && typeof setupIntent === "object") {
      clientSecret = setupIntent.client_secret;
    }

    if (!clientSecret) {
      console.error("[checkout] No client secret. Status:", subscription.status, "invoice:", JSON.stringify(subscription.latest_invoice));
      throw new Error(`Payment setup failed. Please try again.`);
    }

    // Create pending order in DB
    await prisma.order.create({
      data: {
        userId: session.user.id,
        planId: plan.id,
        status: "PENDING",
        billingCycle,
        amountCents,
        stripeSubscriptionId: subscription.id,
      },
    });

    return NextResponse.json({
      clientSecret,
      subscriptionId: subscription.id,
    });
  } catch (err) {
    console.error("[checkout]", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
