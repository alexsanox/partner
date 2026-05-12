import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CreditCard, Download, Package, AlertCircle, Clock,
  MemoryStick, HardDrive, Cpu, Users, Archive, Database, Shield,
  CalendarDays, Server, Plus, CheckCircle2,
} from "lucide-react";
import { requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";
import { stripe } from "@/lib/stripe";
import Link from "next/link";
import { CancelButton } from "@/components/billing/subscription-actions";
import { UpdatePaymentMethod } from "@/components/billing/update-payment-method";

function formatDate(date: Date | number) {
  return new Date(typeof date === "number" ? date * 1000 : date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatMemory(mb: number) {
  return mb >= 1024 ? `${(mb / 1024).toFixed(0)} GB` : `${mb} MB`;
}

const statusStyles: Record<string, string> = {
  ACTIVE: "bg-green-500/10 text-green-400 border-green-500/20",
  SUSPENDED: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  CANCELLED: "bg-red-500/10 text-red-400 border-red-500/20",
  PENDING: "bg-[#00b07d]/10 text-[#00c98d] border-[#00c98d]/20",
  FAILED: "bg-red-500/10 text-red-400 border-red-500/20",
};

const invoiceStatusStyles: Record<string, string> = {
  paid: "bg-green-500/10 text-green-400 border-green-500/20",
  open: "bg-[#00b07d]/10 text-[#00c98d] border-[#00c98d]/20",
  draft: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  uncollectible: "bg-red-500/10 text-red-400 border-red-500/20",
  void: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

type SubInfo = {
  cancelling: boolean;
  cancelAt: number | null;
  currentPeriodEnd: number | null;
  currentPeriodStart: number | null;
  status: string;
  created: number | null;
};

export default async function BillingPage() {
  const session = await requireAuth();

  // Fetch services with plans
  const services = await prisma.service.findMany({
    where: { userId: session.user.id, deletedAt: null },
    include: { plan: true },
    orderBy: { createdAt: "desc" },
  });

  const activeServices = services.filter((s: typeof services[number]) => s.status === "ACTIVE");
  const monthlyTotal = activeServices.reduce((sum: number, s: typeof services[number]) => sum + s.plan.priceMonthly, 0);

  // Get full subscription info from Stripe
  const subIds = services
    .map((s: typeof services[number]) => s.stripeSubscriptionId)
    .filter(Boolean) as string[];

  const subInfoMap: Record<string, SubInfo> = {};
  for (const subId of subIds) {
    try {
      const sub = await stripe.subscriptions.retrieve(subId);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const raw = sub as any;
      subInfoMap[subId] = {
        cancelling: raw.cancel_at_period_end ?? false,
        cancelAt: raw.cancel_at ?? null,
        currentPeriodEnd: raw.current_period_end ?? null,
        currentPeriodStart: raw.current_period_start ?? null,
        status: raw.status ?? "unknown",
        created: raw.created ?? null,
      };
    } catch { /* skip */ }
  }

  // Get payment method info
  let paymentMethod: { brand: string; last4: string; expMonth: number; expYear: number } | null = null;
  if (subIds[0]) {
    try {
      const sub = await stripe.subscriptions.retrieve(subIds[0], { expand: ["default_payment_method"] });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pm = (sub as any).default_payment_method;
      if (pm && typeof pm !== "string" && pm.card) {
        paymentMethod = {
          brand: pm.card.brand,
          last4: pm.card.last4,
          expMonth: pm.card.exp_month,
          expYear: pm.card.exp_year,
        };
      }
    } catch { /* skip */ }
  }

  // Get all available plans for comparison
  const allPlans = await prisma.plan.findMany({
    where: { isActive: true },
    orderBy: { sortOrder: "asc" },
  });

  // Get Stripe invoices
  let invoices: { id: string; number: string | null; date: number; description: string; amount: number; status: string; pdfUrl: string | null }[] = [];
  if (subIds.length > 0) {
    try {
      const allInvoiceData: (typeof invoices[number])[] = [];
      for (const subId of subIds) {
        try {
          const res = await stripe.invoices.list({ subscription: subId, limit: 10 });
          for (const inv of res.data) {
            allInvoiceData.push({
              id: inv.id,
              number: inv.number,
              date: inv.created ?? 0,
              description: inv.lines?.data?.[0]?.description ?? "Subscription",
              amount: inv.amount_paid ?? inv.total ?? 0,
              status: inv.status ?? "unknown",
              pdfUrl: inv.invoice_pdf ?? null,
            });
          }
        } catch { /* skip */ }
      }
      allInvoiceData.sort((a, b) => b.date - a.date);
      invoices = allInvoiceData.slice(0, 20);
    } catch { /* skip */ }
  }

  // Find next billing date (earliest period end across all active subs)
  const nextBillingTimestamp = Object.values(subInfoMap)
    .filter((s) => !s.cancelling && s.currentPeriodEnd)
    .map((s) => s.currentPeriodEnd!)
    .sort((a, b) => a - b)[0] ?? null;

  const brandNames: Record<string, string> = {
    visa: "Visa",
    mastercard: "Mastercard",
    amex: "Amex",
    discover: "Discover",
    diners: "Diners Club",
    jcb: "JCB",
    unionpay: "UnionPay",
  };

  return (
    <div className="space-y-6 pb-10">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Billing</h1>
          <p className="mt-1 text-sm text-[#8b92a8]">Manage subscriptions, payment method, and invoices</p>
        </div>
        <Link href="/dashboard/services/create">
          <Button className="bg-[#00c98d] text-white hover:bg-[#00e0a0] hover:text-white gap-2">
            <Plus className="h-4 w-4" /> New Server
          </Button>
        </Link>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Monthly Total", value: formatCents(monthlyTotal), icon: CreditCard, color: "text-[#00c98d]", bg: "bg-[#00c98d]/10" },
          { label: "Active Servers", value: String(activeServices.length), icon: Server, color: "text-[#00c98d]", bg: "bg-[#00c98d]/10" },
          { label: "Next Billing", value: nextBillingTimestamp ? formatDate(nextBillingTimestamp) : "—", icon: CalendarDays, color: "text-purple-400", bg: "bg-purple-400/10" },
          { label: "Total Invoices", value: String(invoices.length), icon: CheckCircle2, color: "text-green-400", bg: "bg-green-400/10" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-xl border border-white/[0.06] bg-[#1e2235] p-4 flex items-center gap-3">
            <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${bg}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] text-[#8b92a8] truncate">{label}</p>
              <p className="text-lg font-bold text-white leading-tight truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Payment Method */}
      <div className="rounded-xl border border-white/[0.06] bg-[#1e2235] p-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[15px] font-semibold text-white">Payment Method</h2>
          {subIds.length > 0 && <UpdatePaymentMethod />}
        </div>
        {paymentMethod ? (
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-20 items-center justify-center rounded-lg border border-white/[0.07] bg-white/5">
              <CreditCard className="h-6 w-6 text-[#8b92a8]" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">
                {brandNames[paymentMethod.brand] ?? paymentMethod.brand.charAt(0).toUpperCase() + paymentMethod.brand.slice(1)}
                <span className="ml-2 text-[#8b92a8] font-normal">•••• {paymentMethod.last4}</span>
              </p>
              <p className="text-xs text-[#8b92a8] mt-0.5">
                Expires {String(paymentMethod.expMonth).padStart(2, "0")}/{paymentMethod.expYear}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 rounded-lg border border-dashed border-white/10 p-4">
            <CreditCard className="h-5 w-5 text-[#8b92a8]/40 shrink-0" />
            <div>
              <p className="text-sm text-[#8b92a8]">No payment method on file</p>
              <p className="text-xs text-[#8b92a8]/60 mt-0.5">Add a card to manage your subscriptions</p>
            </div>
          </div>
        )}
      </div>

      {/* Subscriptions */}
      {services.length > 0 ? (
        <div className="rounded-xl border border-white/[0.06] bg-[#1e2235] overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
            <h2 className="text-[15px] font-semibold text-white">Subscriptions</h2>
            <span className="text-xs text-[#8b92a8]">{services.length} total</span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {services.map((service: typeof services[number]) => {
              const subInfo = service.stripeSubscriptionId ? subInfoMap[service.stripeSubscriptionId] : null;
              const isCancelling = subInfo?.cancelling ?? false;
              const plan = service.plan;
              const periodProgress = subInfo?.currentPeriodStart && subInfo?.currentPeriodEnd
                ? Math.min(100, Math.round(((Date.now() / 1000) - subInfo.currentPeriodStart) / (subInfo.currentPeriodEnd - subInfo.currentPeriodStart) * 100))
                : null;

              return (
                <div key={service.id} className={isCancelling ? "bg-orange-500/[0.02]" : ""}>
                  <div className="flex items-start justify-between gap-4 px-5 py-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#00c98d]/10">
                        <Server className="h-5 w-5 text-[#00c98d]" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-bold text-white truncate">{service.name}</p>
                          <Badge variant="outline" className={isCancelling ? "bg-orange-500/10 text-orange-400 border-orange-500/20 text-[10px]" : (statusStyles[service.status] ?? statusStyles.PENDING) + " text-[10px]"}>
                            {isCancelling ? "Cancelling" : service.status}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-[#8b92a8] mt-0.5">{plan.name} · Since {formatDate(service.createdAt)}</p>
                        {service.ipAddress && service.port && (
                          <code className="text-[10px] font-mono text-[#8b92a8]/70 mt-0.5 block">{service.ipAddress}:{service.port}</code>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-base font-bold text-white">{formatCents(plan.priceMonthly)}<span className="text-[11px] font-normal text-[#8b92a8]">/mo</span></p>
                        {subInfo?.currentPeriodEnd && !isCancelling && (
                          <p className="text-[10px] text-[#8b92a8]">Renews {formatDate(subInfo.currentPeriodEnd)}</p>
                        )}
                      </div>
                      {service.stripeSubscriptionId && service.status === "ACTIVE" && (
                        <CancelButton serviceId={service.id} cancelling={isCancelling} />
                      )}
                    </div>
                  </div>

                  {/* Specs */}
                  <div className="px-5 pb-3 flex flex-wrap gap-x-5 gap-y-1.5">
                    {[
                      [MemoryStick, `${formatMemory(plan.ramMb)} RAM`],
                      [HardDrive, `${formatMemory(plan.diskMb)} Disk`],
                      [Cpu, `${plan.cpuPercent}% CPU`],
                      [Users, `${plan.playerSlots} Players`],
                      [Archive, `${plan.backupSlots} Backup${plan.backupSlots !== 1 ? "s" : ""}`],
                      ...(plan.databaseLimit > 0 ? [[Database, `${plan.databaseLimit} DB`]] : []),
                      [Shield, "DDoS Protected"],
                    ].map(([Icon, label], i) => (
                      <div key={i} className="flex items-center gap-1.5">
                          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        <Icon className="h-3 w-3 text-[#00c98d]" />
                        <span className="text-[11px] text-[#8b92a8]">{label as string}</span>
                      </div>
                    ))}
                  </div>

                  {/* Period progress bar */}
                  {periodProgress !== null && !isCancelling && (
                    <div className="px-5 pb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-[#8b92a8]">Billing period</span>
                        <span className="text-[10px] text-[#8b92a8]">{periodProgress}% used</span>
                      </div>
                      <div className="h-1 w-full rounded-full bg-white/[0.06]">
                        <div className="h-1 rounded-full bg-[#00c98d]" style={{ width: `${periodProgress}%` }} />
                      </div>
                    </div>
                  )}

                  {/* Cancelling banner */}
                  {isCancelling && subInfo?.cancelAt && (
                    <div className="mx-5 mb-4 flex items-center gap-2 rounded-lg border border-orange-500/20 bg-orange-500/5 px-3 py-2">
                      <Clock className="h-3.5 w-3.5 text-orange-400 shrink-0" />
                      <p className="text-xs text-orange-400">Active until <span className="font-semibold">{formatDate(subInfo.cancelAt)}</span>. Reactivate anytime before then.</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-white/10 bg-[#1e2235] flex flex-col items-center justify-center py-16 gap-3">
          <Package className="h-10 w-10 text-[#8b92a8]/30" />
          <p className="text-sm text-[#8b92a8]">No active subscriptions</p>
          <Link href="/dashboard/services/create">
            <Button className="bg-[#00c98d] text-white hover:bg-[#00e0a0] hover:text-white mt-1">Create Server</Button>
          </Link>
        </div>
      )}

      {/* Available Plans */}
      <div className="rounded-xl border border-white/[0.06] bg-[#1e2235] overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.05]">
          <h2 className="text-[15px] font-semibold text-white">Server Tiers</h2>
          <p className="text-xs text-[#8b92a8] mt-0.5">Compare plans — deploy as many servers as you need</p>
        </div>
        <div className="p-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allPlans.map((plan: typeof allPlans[number]) => {
            const userHasPlan = services.some((s: typeof services[number]) => s.planId === plan.id && s.status === "ACTIVE");
            return (
              <div key={plan.id} className={`rounded-xl border p-5 flex flex-col gap-4 transition-colors ${userHasPlan ? "border-[#00c98d]/30 bg-[#00c98d]/[0.03]" : "border-white/[0.06] bg-[#171b29] hover:border-white/10"}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-[15px] font-bold text-white">{plan.name}</h3>
                    {plan.description && <p className="text-[11px] text-[#8b92a8] mt-0.5">{plan.description}</p>}
                  </div>
                  {userHasPlan && (
                    <Badge variant="outline" className="bg-[#00c98d]/10 text-[#00c98d] border-[#00c98d]/20 text-[10px] shrink-0">ACTIVE</Badge>
                  )}
                </div>
                <p className="text-3xl font-extrabold text-white">{formatCents(plan.priceMonthly)}<span className="text-xs font-normal text-[#8b92a8]">/mo</span></p>
                <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                  {[
                    [MemoryStick, `${formatMemory(plan.ramMb)} RAM`],
                    [HardDrive, `${formatMemory(plan.diskMb)} Disk`],
                    [Cpu, `${plan.cpuPercent}% CPU`],
                    [Users, `${plan.playerSlots} Players`],
                    [Archive, `${plan.backupSlots} Backups`],
                    [Shield, "DDoS Protected"],
                    ...(plan.databaseLimit > 0 ? [[Database, `${plan.databaseLimit} DBs`]] : []),
                  ].map(([Icon, label], i) => (
                    <div key={i} className="flex items-center gap-1.5">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                      <Icon className="h-3 w-3 text-[#00c98d]" />
                      <span className="text-[11px] text-[#e2e8f0]">{label as string}</span>
                    </div>
                  ))}
                </div>
                {!userHasPlan && (
                  <Link href="/dashboard/services/create" className="block mt-auto">
                    <button className="w-full rounded-lg border border-white/10 bg-white/5 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-colors">
                      Get Started →
                    </button>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Invoice History */}
      <div className="rounded-xl border border-white/[0.06] bg-[#1e2235] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
          <h2 className="text-[15px] font-semibold text-white">Invoice History</h2>
          <span className="text-xs text-[#8b92a8]">{invoices.length} invoice{invoices.length !== 1 ? "s" : ""}</span>
        </div>
        {invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <AlertCircle className="h-8 w-8 text-[#8b92a8]/30" />
            <p className="text-sm text-[#8b92a8]">No invoices yet</p>
            <p className="text-xs text-[#8b92a8]/60">Invoices appear here after your first payment</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {/* Header */}
            <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 px-5 py-2.5 text-[11px] font-medium text-[#8b92a8] uppercase tracking-wide">
              <span>Invoice</span>
              <span className="w-24">Date</span>
              <span className="w-20 text-right">Amount</span>
              <span className="w-16 text-center">Status</span>
              <span className="w-8" />
            </div>
            {invoices.map((invoice) => (
              <div key={invoice.id} className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 items-center px-5 py-3 hover:bg-white/[0.02] transition-colors">
                <div className="min-w-0">
                  <p className="text-xs font-mono text-white truncate">{invoice.number ?? invoice.id.slice(0, 16)}</p>
                  <p className="text-[11px] text-[#8b92a8] truncate mt-0.5">{invoice.description}</p>
                </div>
                <span className="text-xs text-[#8b92a8] w-24 shrink-0">{formatDate(invoice.date)}</span>
                <span className="text-sm font-semibold text-white w-20 text-right shrink-0">{formatCents(invoice.amount)}</span>
                <div className="w-16 flex justify-center shrink-0">
                  <Badge variant="outline" className={invoiceStatusStyles[invoice.status] ?? invoiceStatusStyles.draft}>
                    {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                  </Badge>
                </div>
                <div className="w-8 flex justify-end shrink-0">
                  {invoice.pdfUrl && (
                    <a href={invoice.pdfUrl} target="_blank" rel="noopener noreferrer">
                      <button className="rounded p-1.5 text-[#8b92a8] hover:text-white hover:bg-white/5 transition-colors">
                        <Download className="h-3.5 w-3.5" />
                      </button>
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
