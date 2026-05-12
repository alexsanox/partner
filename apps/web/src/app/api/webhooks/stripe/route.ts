import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import {
  sendPaymentSuccessEmail,
  sendPaymentFailedEmail,
  sendSubscriptionCancelledEmail,
  sendUpcomingRenewalEmail,
  sendInvoiceEmail,
} from "@/lib/email";
import Stripe from "stripe";

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatDate(ts: number) {
  return new Date(ts * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}


// ── Handle successful payment for a subscription ─────────────────────
async function handleSubscriptionPaid(subscriptionId: string) {
  // Check if we already provisioned for this subscription
  const existing = await prisma.service.findFirst({
    where: { stripeSubscriptionId: subscriptionId },
  });
  if (existing) return; // Already provisioned

  // Get subscription metadata
  const sub = await stripe.subscriptions.retrieve(subscriptionId);
  const { userId, planId, serverName } = sub.metadata ?? {};
  if (!userId || !planId || !serverName) return;

  // Update order — required for service creation
  const order = await prisma.order.findFirst({
    where: { stripeSubscriptionId: subscriptionId, status: "PENDING" },
  });
  if (!order) return; // Can't create service without an order

  await prisma.order.update({
    where: { id: order.id },
    data: { status: "PAID" },
  });

  // Get plan and user
  const plan = await prisma.plan.findUnique({ where: { id: planId } });
  if (!plan) return;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { email: true } });

  // Send payment success email
  if (user?.email) {
    sendPaymentSuccessEmail(user.email, {
      serverName,
      planName: plan.name,
      amount: formatCents(plan.priceMonthly),
    }).catch((e) => console.error("[stripe-webhook] Payment email failed:", e));
  }

  // Create a PENDING stub service — actual provisioning happens in the setup wizard
  await prisma.service.create({
    data: {
      userId,
      planId,
      orderId: order.id,
      name: serverName,
      status: "PENDING",
      stripeSubscriptionId: subscriptionId,
    },
  });
}

// ── Webhook handler ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature")!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error("[stripe-webhook] Signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  console.log("[stripe-webhook] Received event:", event.type);

  try {
    switch (event.type) {
      // Embedded payment flow: subscription's first invoice is paid
      case "invoice.paid": {
        const invoice = event.data.object as Stripe.Invoice & { subscription: string | null };
        const subscriptionId = invoice.subscription;
        if (!subscriptionId) break;

        await handleSubscriptionPaid(subscriptionId);
        break;
      }

      // SetupIntent succeeded — create subscription and provision server
      case "setup_intent.succeeded": {
        const setupIntent = event.data.object as Stripe.SetupIntent;
        const { userId, planId, serverName, billingCycle, amountCents, interval, intervalCount, planName } = setupIntent.metadata ?? {};
        if (!userId || !planId || !serverName) break;

        const paymentMethodId = typeof setupIntent.payment_method === "string"
          ? setupIntent.payment_method
          : setupIntent.payment_method?.id;
        if (!paymentMethodId) break;

        const customerId = typeof setupIntent.customer === "string"
          ? setupIntent.customer
          : setupIntent.customer?.id;
        if (!customerId) break;

        // Set as default payment method
        await stripe.customers.update(customerId, {
          invoice_settings: { default_payment_method: paymentMethodId },
        });

        // Create the price
        const price = await stripe.prices.create({
          currency: "usd",
          unit_amount: parseInt(amountCents ?? "0"),
          recurring: {
            interval: (interval ?? "month") as "month" | "year",
            interval_count: parseInt(intervalCount ?? "1"),
          },
          product_data: { name: `${planName ?? "Server"} - ${serverName}` },
        });

        // Create the subscription
        const subscription = await stripe.subscriptions.create({
          customer: customerId,
          items: [{ price: price.id }],
          default_payment_method: paymentMethodId,
          metadata: { userId, planId, serverName, billingCycle: billingCycle ?? "MONTHLY" },
        });

        // Update the pending order with the subscription ID
        const order = await prisma.order.findFirst({
          where: { stripeSessionId: setupIntent.id, status: "PENDING" },
        });
        if (order) {
          await prisma.order.update({
            where: { id: order.id },
            data: { stripeSubscriptionId: subscription.id },
          });
        }

        // Provision server (invoice.paid will fire and handle provisioning)
        break;
      }

      // Checkout session flow (backward compat)
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId = session.subscription as string;
        if (!subscriptionId) break;

        await handleSubscriptionPaid(subscriptionId);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice & { subscription: string | null };
        const subscriptionId = invoice.subscription;
        if (!subscriptionId) break;

        const service = await prisma.service.findFirst({
          where: { stripeSubscriptionId: subscriptionId },
          include: { plan: true, user: { select: { email: true } } },
        });
        if (service) {
          await prisma.service.update({
            where: { id: service.id },
            data: { status: "SUSPENDED", suspendedAt: new Date() },
          });
          if (service.user.email) {
            sendPaymentFailedEmail(service.user.email, {
              serverName: service.name,
              planName: service.plan.name,
              amount: formatCents(invoice.amount_due ?? 0),
            }).catch((e) => console.error("[stripe-webhook] Payment failed email error:", e));
          }
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        const service = await prisma.service.findFirst({
          where: { stripeSubscriptionId: subscription.id },
          include: { plan: true, user: { select: { email: true } } },
        });
        if (service) {
          await prisma.service.update({
            where: { id: service.id },
            data: { status: "CANCELLED", cancelledAt: new Date() },
          });
          if (service.user.email) {
            sendSubscriptionCancelledEmail(service.user.email, {
              serverName: service.name,
              planName: service.plan.name,
            }).catch((e) => console.error("[stripe-webhook] Cancelled email error:", e));
          }
        }
        break;
      }

      // Upcoming renewal reminder (Stripe sends this ~3 days before)
      case "invoice.upcoming": {
        const invoice = event.data.object as Stripe.Invoice & { subscription: string | null };
        const subscriptionId = invoice.subscription;
        if (!subscriptionId) break;

        const service = await prisma.service.findFirst({
          where: { stripeSubscriptionId: subscriptionId, status: "ACTIVE" },
          include: { plan: true, user: { select: { email: true } } },
        });
        if (service?.user.email) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const raw = invoice as any;
          const periodEnd = raw.period_end ?? raw.next_payment_attempt;
          sendUpcomingRenewalEmail(service.user.email, {
            serverName: service.name,
            planName: service.plan.name,
            amount: formatCents(invoice.amount_due ?? service.plan.priceMonthly),
            renewalDate: periodEnd ? formatDate(periodEnd) : "soon",
          }).catch((e) => console.error("[stripe-webhook] Renewal email error:", e));
        }
        break;
      }

      // Invoice finalized & paid (recurring payments — send invoice receipt)
      case "invoice.finalized": {
        const invoice = event.data.object as Stripe.Invoice & { subscription: string | null };
        const subscriptionId = invoice.subscription;
        if (!subscriptionId) break;

        const service = await prisma.service.findFirst({
          where: { stripeSubscriptionId: subscriptionId },
          include: { plan: true, user: { select: { email: true } } },
        });
        if (service?.user.email) {
          sendInvoiceEmail(service.user.email, {
            invoiceNumber: invoice.number ?? invoice.id.slice(0, 12),
            serverName: service.name,
            amount: formatCents(invoice.amount_paid ?? invoice.total ?? 0),
            date: formatDate(invoice.created ?? Math.floor(Date.now() / 1000)),
            pdfUrl: invoice.invoice_pdf ?? null,
          }).catch((e) => console.error("[stripe-webhook] Invoice email error:", e));
        }
        break;
      }
    }
  } catch (err) {
    console.error("[stripe-webhook] Error handling event:", err);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
