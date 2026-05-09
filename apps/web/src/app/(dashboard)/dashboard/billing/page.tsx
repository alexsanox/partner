import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CreditCard, Receipt, Download, Package, AlertCircle, Clock,
  MemoryStick, HardDrive, Cpu, Users, Archive, Database, Shield,
  CalendarDays, Server, Plus,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  PENDING: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  FAILED: "bg-red-500/10 text-red-400 border-red-500/20",
};

const invoiceStatusStyles: Record<string, string> = {
  paid: "bg-green-500/10 text-green-400 border-green-500/20",
  open: "bg-blue-500/10 text-blue-400 border-blue-500/20",
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

  const activeServices = services.filter((s) => s.status === "ACTIVE");
  const monthlyTotal = activeServices.reduce((sum, s) => sum + s.plan.priceMonthly, 0);

  // Get full subscription info from Stripe
  const subIds = services
    .map((s) => s.stripeSubscriptionId)
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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Billing</h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage your subscriptions, payment method, and view invoices
          </p>
        </div>
        <Link href="/dashboard/services/create">
          <Button className="bg-[#5b8cff] text-white hover:bg-[#4a7bef]">
            <Plus className="mr-2 h-4 w-4" />
            New Server
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-white/5 bg-white/[0.02]">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-400/10">
              <CreditCard className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Monthly Total</p>
              <p className="text-xl font-bold text-white">{formatCents(monthlyTotal)}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/5 bg-white/[0.02]">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-400/10">
              <Receipt className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Active Subscriptions</p>
              <p className="text-xl font-bold text-white">{activeServices.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/5 bg-white/[0.02]">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-400/10">
              <CalendarDays className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Next Billing</p>
              <p className="text-lg font-bold text-white">
                {nextBillingTimestamp ? formatDate(nextBillingTimestamp) : "—"}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/5 bg-white/[0.02]">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#5b8cff]/10">
              <Server className="h-5 w-5 text-[#5b8cff]" />
            </div>
            <div>
              <p className="text-xs text-slate-400">Total Servers</p>
              <p className="text-xl font-bold text-white">{services.length}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Method */}
      <Card className="border-white/5 bg-white/[0.02]">
        <CardHeader className="p-5 pb-0">
          <h2 className="text-lg font-semibold text-white">Payment Method</h2>
        </CardHeader>
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            {paymentMethod ? (
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 border border-white/[0.07]">
                  <CreditCard className="h-6 w-6 text-[#8b92a8]" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">
                    {brandNames[paymentMethod.brand] ?? paymentMethod.brand.charAt(0).toUpperCase() + paymentMethod.brand.slice(1)} •••• {paymentMethod.last4}
                  </p>
                  <p className="text-xs text-slate-400">
                    Expires {String(paymentMethod.expMonth).padStart(2, "0")}/{paymentMethod.expYear}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-white/5 border border-white/[0.07]">
                  <CreditCard className="h-6 w-6 text-[#8b92a8]/40" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">No payment method on file</p>
                  <p className="text-xs text-slate-500">Add a card to manage your subscriptions</p>
                </div>
              </div>
            )}
            {subIds.length > 0 && <UpdatePaymentMethod />}
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions — Full Detail */}
      {services.length > 0 && (
        <Card className="border-white/5 bg-white/[0.02]">
          <CardHeader className="p-5 pb-0">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Subscriptions</h2>
              <span className="text-xs text-[#8b92a8]">{services.length} total</span>
            </div>
          </CardHeader>
          <CardContent className="p-5">
            <div className="space-y-4">
              {services.map((service) => {
                const subInfo = service.stripeSubscriptionId
                  ? subInfoMap[service.stripeSubscriptionId]
                  : null;
                const isCancelling = subInfo?.cancelling ?? false;
                const plan = service.plan;

                return (
                  <div
                    key={service.id}
                    className={`rounded-xl border overflow-hidden ${
                      isCancelling
                        ? "border-orange-500/20"
                        : "border-white/[0.05]"
                    }`}
                  >
                    {/* Header row */}
                    <div className={`flex items-center justify-between px-5 py-4 ${
                      isCancelling ? "bg-orange-500/[0.02]" : "bg-white/[0.02]"
                    }`}>
                      <div className="flex items-center gap-4">
                        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#5b8cff]/10">
                          <Server className="h-5 w-5 text-[#5b8cff]" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-[15px] font-bold text-white">{service.name}</p>
                            <Badge variant="outline" className={isCancelling ? "bg-orange-500/10 text-orange-400 border-orange-500/20" : (statusStyles[service.status] ?? statusStyles.PENDING)}>
                              {isCancelling ? "Cancelling" : service.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {plan.name} Tier · Created {formatDate(service.createdAt)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-lg font-bold text-white">{formatCents(plan.priceMonthly)}<span className="text-xs font-normal text-[#8b92a8]">/mo</span></p>
                          {subInfo?.currentPeriodEnd && !isCancelling && (
                            <p className="text-[11px] text-[#8b92a8]">
                              Renews {formatDate(subInfo.currentPeriodEnd)}
                            </p>
                          )}
                        </div>
                        {service.stripeSubscriptionId && service.status === "ACTIVE" && (
                          <CancelButton serviceId={service.id} cancelling={isCancelling} />
                        )}
                      </div>
                    </div>

                    {/* Plan specs */}
                    <div className="border-t border-white/[0.04] px-5 py-3">
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                        <div className="flex items-center gap-2">
                          <MemoryStick className="h-3.5 w-3.5 text-[#5b8cff]" />
                          <span className="text-xs text-[#e2e8f0]">{formatMemory(plan.ramMb)} RAM</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <HardDrive className="h-3.5 w-3.5 text-[#5b8cff]" />
                          <span className="text-xs text-[#e2e8f0]">{formatMemory(plan.diskMb)} Disk</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Cpu className="h-3.5 w-3.5 text-[#5b8cff]" />
                          <span className="text-xs text-[#e2e8f0]">{plan.cpuPercent}% CPU</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-3.5 w-3.5 text-[#5b8cff]" />
                          <span className="text-xs text-[#e2e8f0]">{plan.playerSlots} Players</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Archive className="h-3.5 w-3.5 text-[#5b8cff]" />
                          <span className="text-xs text-[#e2e8f0]">{plan.backupSlots} Backup{plan.backupSlots !== 1 ? "s" : ""}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Shield className="h-3.5 w-3.5 text-green-400" />
                          <span className="text-xs text-[#e2e8f0]">DDoS Protected</span>
                        </div>
                      </div>
                      {plan.databaseLimit > 0 && (
                        <div className="flex items-center gap-2 mt-2">
                          <Database className="h-3.5 w-3.5 text-[#5b8cff]" />
                          <span className="text-xs text-[#e2e8f0]">{plan.databaseLimit} Database{plan.databaseLimit !== 1 ? "s" : ""}</span>
                        </div>
                      )}
                    </div>

                    {/* Cancellation banner */}
                    {isCancelling && subInfo?.cancelAt && (
                      <div className="border-t border-orange-500/10 bg-orange-500/[0.03] px-5 py-3 flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-orange-400" />
                        <p className="text-xs text-orange-400">
                          Your subscription is active until <span className="font-semibold">{formatDate(subInfo.cancelAt)}</span>. Reactivate anytime before then.
                        </p>
                      </div>
                    )}

                    {/* Connection info */}
                    {service.ipAddress && service.port && (
                      <div className="border-t border-white/[0.04] px-5 py-2.5 flex items-center gap-2">
                        <span className="text-[11px] text-[#8b92a8]">Server Address:</span>
                        <code className="rounded bg-white/5 px-2 py-0.5 text-[11px] font-mono text-[#e2e8f0]">
                          {service.ipAddress}:{service.port}
                        </code>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <Card className="border-white/5 bg-white/[0.02]">
        <CardHeader className="p-5 pb-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Server Tiers</h2>
              <p className="text-xs text-slate-400 mt-0.5">Compare tiers — buy as many servers as you want</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {allPlans.map((plan) => {
              const userHasPlan = services.some((s) => s.planId === plan.id && s.status === "ACTIVE");
              return (
                <div
                  key={plan.id}
                  className={`rounded-xl border p-5 ${
                    userHasPlan
                      ? "border-[#5b8cff]/30 bg-[#5b8cff]/[0.03]"
                      : "border-white/[0.05] bg-white/[0.02]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[15px] font-bold text-white">{plan.name}</h3>
                    {userHasPlan && (
                      <Badge variant="outline" className="bg-[#5b8cff]/10 text-[#5b8cff] border-[#5b8cff]/20 text-[10px]">
                        ACTIVE
                      </Badge>
                    )}
                  </div>
                  {plan.description && (
                    <p className="text-xs text-[#8b92a8] mb-3">{plan.description}</p>
                  )}
                  <p className="text-2xl font-extrabold text-white mb-4">
                    {formatCents(plan.priceMonthly)}<span className="text-xs font-normal text-[#8b92a8]">/mo</span>
                  </p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-[#e2e8f0]">
                      <MemoryStick className="h-3 w-3 text-[#5b8cff]" /> {formatMemory(plan.ramMb)} RAM
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#e2e8f0]">
                      <HardDrive className="h-3 w-3 text-[#5b8cff]" /> {formatMemory(plan.diskMb)} Disk
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#e2e8f0]">
                      <Cpu className="h-3 w-3 text-[#5b8cff]" /> {plan.cpuPercent}% CPU
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#e2e8f0]">
                      <Users className="h-3 w-3 text-[#5b8cff]" /> {plan.playerSlots} Players
                    </div>
                    <div className="flex items-center gap-2 text-xs text-[#e2e8f0]">
                      <Archive className="h-3 w-3 text-[#5b8cff]" /> {plan.backupSlots} Backup{plan.backupSlots !== 1 ? "s" : ""}
                    </div>
                    {plan.databaseLimit > 0 && (
                      <div className="flex items-center gap-2 text-xs text-[#e2e8f0]">
                        <Database className="h-3 w-3 text-[#5b8cff]" /> {plan.databaseLimit} Database{plan.databaseLimit !== 1 ? "s" : ""}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-xs text-[#e2e8f0]">
                      <Shield className="h-3 w-3 text-green-400" /> DDoS Protection
                    </div>
                  </div>
                  {!userHasPlan && (
                    <Link href="/dashboard/services/create" className="block mt-4">
                      <button className="w-full rounded-lg bg-white/5 py-2 text-xs font-semibold text-white hover:bg-white/10 transition-colors">
                        Get This Server
                      </button>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Invoice History */}
      <Card className="border-white/5 bg-white/[0.02]">
        <CardHeader className="p-5 pb-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Invoice History</h2>
            <span className="text-xs text-[#8b92a8]">{invoices.length} invoice{invoices.length !== 1 ? "s" : ""}</span>
          </div>
        </CardHeader>
        <CardContent className="p-5">
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="mb-3 h-8 w-8 text-slate-600" />
              <p className="text-sm text-slate-400">No invoices yet</p>
              <p className="text-xs text-slate-500 mt-1">Invoices will appear here after your first payment</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="text-slate-400">Invoice</TableHead>
                  <TableHead className="text-slate-400">Date</TableHead>
                  <TableHead className="text-slate-400">Description</TableHead>
                  <TableHead className="text-slate-400">Amount</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-right text-slate-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id} className="border-white/5 hover:bg-white/[0.02]">
                    <TableCell className="font-medium text-white font-mono text-xs">
                      {invoice.number ?? invoice.id.slice(0, 12)}
                    </TableCell>
                    <TableCell className="text-slate-400 text-xs">
                      {formatDate(invoice.date)}
                    </TableCell>
                    <TableCell className="text-slate-300 max-w-[200px] truncate text-xs">
                      {invoice.description}
                    </TableCell>
                    <TableCell className="font-medium text-white">
                      {formatCents(invoice.amount)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={invoiceStatusStyles[invoice.status] ?? invoiceStatusStyles.draft}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {invoice.pdfUrl && (
                        <a href={invoice.pdfUrl} download>
                          <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                            <Download className="h-4 w-4" />
                          </Button>
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* No subscriptions CTA */}
      {services.length === 0 && (
        <Card className="border-white/5 bg-white/[0.02]">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Package className="mb-4 h-12 w-12 text-slate-600" />
            <p className="text-lg font-medium text-slate-400">No active subscriptions</p>
            <p className="mt-1 text-sm text-slate-500">Create a server to get started</p>
            <Link href="/dashboard/services/create" className="mt-4">
              <Button className="bg-[#5b8cff] text-white hover:bg-[#4a7bef]">
                Create Server
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
