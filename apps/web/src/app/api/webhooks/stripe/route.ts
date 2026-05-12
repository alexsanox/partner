import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import { createServer, getNodes, getNodeAllocations, createAllocation, getEgg } from "@/lib/pelican";
import {
  sendPaymentSuccessEmail,
  sendServerReadyEmail,
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

// ── Provision server on Pelican ──────────────────────────────────────
async function provisionServer(
  serverName: string,
  plan: { eggId: number | null; ramMb: number; diskMb: number; cpuPercent: number; databaseLimit: number; backupSlots: number },
) {
  const eggId = plan.eggId ?? 1; // Fall back to egg 1 (Minecraft) if not set
  const egg = await getEgg(eggId);
  const dockerImages = Object.values(egg.docker_images);
  const dockerImage = dockerImages[dockerImages.length - 1] || dockerImages[0];

  const environment: Record<string, string> = {};
  if (egg.relationships?.variables?.data) {
    for (const v of egg.relationships.variables.data) {
      environment[v.attributes.env_variable] = v.attributes.default_value;
    }
  }

  const nodesRes = await getNodes();
  const nodes = nodesRes.data.map((n) => n.attributes);
  const node = nodes.find((n) => !n.maintenance_mode);
  if (!node) throw new Error("No available node");

  const allocRes = await getNodeAllocations(node.id);
  const allAllocs = allocRes.data.map((a) => a.attributes);
  const nodeIp = allAllocs[0]?.ip || "0.0.0.0";
  const usedPorts = allAllocs.map((a) => a.port);
  const nextPort = usedPorts.length > 0 ? Math.max(...usedPorts) + 1 : 25565;

  await createAllocation(node.id, nodeIp, [String(nextPort)]);

  const updatedAllocRes = await getNodeAllocations(node.id);
  const newAlloc = updatedAllocRes.data.find(
    (a) => a.attributes.port === nextPort && !a.attributes.assigned
  );
  if (!newAlloc) throw new Error("Allocation not found after creation");

  const result = await createServer({
    name: serverName,
    user: 1,
    egg: eggId,
    docker_image: dockerImage,
    startup: egg.startup,
    environment,
    limits: {
      memory: plan.ramMb,
      swap: 0,
      disk: plan.diskMb,
      io: 500,
      cpu: plan.cpuPercent,
    },
    feature_limits: {
      databases: plan.databaseLimit,
      backups: plan.backupSlots,
    },
    allocation: { default: newAlloc.attributes.id },
  });

  return {
    externalServerId: result.attributes.identifier,
    externalServerUuid: result.attributes.uuid,
    ipAddress: nodeIp,
    port: nextPort,
  };
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

  // Provision server
  let serverData: Awaited<ReturnType<typeof provisionServer>> | null = null;
  try {
    serverData = await provisionServer(serverName, plan);
  } catch (err) {
    console.error("[stripe-webhook] Provisioning failed:", err);
  }

  // Create service record
  await prisma.service.create({
    data: {
      userId,
      planId,
      orderId: order.id,
      name: serverName,
      status: serverData ? "ACTIVE" : "FAILED",
      externalServerId: serverData?.externalServerId ?? null,
      externalServerUuid: serverData?.externalServerUuid ?? null,
      ipAddress: serverData?.ipAddress ?? null,
      port: serverData?.port ?? null,
      stripeSubscriptionId: subscriptionId,
    },
  });

  // Send server ready email
  if (user?.email && serverData) {
    sendServerReadyEmail(user.email, {
      serverName,
      planName: plan.name,
      ip: serverData.ipAddress,
      port: serverData.port,
    }).catch((e) => console.error("[stripe-webhook] Server ready email failed:", e));
  }
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
