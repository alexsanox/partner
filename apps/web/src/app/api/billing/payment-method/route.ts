import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/auth-server";

// Get a SetupIntent client secret for updating payment method
export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth();

    // Find any active service to get the Stripe customer ID
    const service = await prisma.service.findFirst({
      where: { userId: session.user.id, stripeSubscriptionId: { not: null } },
    });

    if (!service?.stripeSubscriptionId) {
      return NextResponse.json({ error: "No active subscription found" }, { status: 404 });
    }

    const sub = await stripe.subscriptions.retrieve(service.stripeSubscriptionId);
    const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

    // Create a SetupIntent for the customer
    const setupIntent = await stripe.setupIntents.create({
      customer: customerId,
      payment_method_types: ["card"],
      metadata: { userId: session.user.id },
    });

    return NextResponse.json({ clientSecret: setupIntent.client_secret });
  } catch (err) {
    console.error("[billing/payment-method]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to create setup intent" },
      { status: 500 }
    );
  }
}

// Confirm and set as default payment method for all subscriptions
export async function PUT(req: NextRequest) {
  try {
    const session = await requireAuth();
    const { paymentMethodId } = (await req.json()) as { paymentMethodId: string };

    // Get all user subscriptions
    const services = await prisma.service.findMany({
      where: { userId: session.user.id, stripeSubscriptionId: { not: null } },
    });

    for (const service of services) {
      if (!service.stripeSubscriptionId) continue;

      const sub = await stripe.subscriptions.retrieve(service.stripeSubscriptionId);
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id;

      // Set as default on customer
      await stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
      });

      // Update subscription default payment method
      await stripe.subscriptions.update(service.stripeSubscriptionId, {
        default_payment_method: paymentMethodId,
      });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[billing/payment-method]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to update payment method" },
      { status: 500 }
    );
  }
}
