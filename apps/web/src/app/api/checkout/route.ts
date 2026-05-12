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

    // Create subscription in incomplete state
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: price.id }],
      payment_behavior: "default_incomplete",
      payment_settings: {
        save_default_payment_method: "on_subscription",
        payment_method_types: ["card"],
      },
      metadata: {
        userId: session.user.id,
        planId: plan.id,
        serverName,
        billingCycle,
      },
    });

    // Retrieve the invoice with payment_intent expanded
    // (Stripe no longer embeds payment_intent on subscription create response)
    const invoiceId = typeof subscription.latest_invoice === "string"
      ? subscription.latest_invoice
      : (subscription.latest_invoice as { id: string } | null)?.id;

    if (!invoiceId) {
      throw new Error("No invoice created for subscription");
    }

    const invoice = await stripe.invoices.retrieve(invoiceId, {
      expand: ["payment_intent"],
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const pi = (invoice as any).payment_intent as { client_secret?: string | null } | string | null;
    const clientSecret = pi && typeof pi === "object" ? pi.client_secret : null;

    if (!clientSecret) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.error("[checkout] No client secret. Invoice status:", invoice.status, "PI:", JSON.stringify((invoice as any).payment_intent));
      throw new Error("Payment setup failed. Please try again.");
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
