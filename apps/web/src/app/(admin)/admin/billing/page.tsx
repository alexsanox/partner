import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Receipt, TrendingUp, CreditCard, ShoppingCart } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { OrderActions } from "@/components/admin/order-actions";

const orderStatusConfig: Record<string, { label: string; className: string }> = {
  PAID: { label: "Paid", className: "bg-green-500/10 text-green-400 border-green-500/20" },
  PENDING: { label: "Pending", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  FAILED: { label: "Failed", className: "bg-red-500/10 text-red-400 border-red-500/20" },
  REFUNDED: { label: "Refunded", className: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  CANCELLED: { label: "Cancelled", className: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
};

async function getBillingStats() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [totalOrders, paidOrders, failedOrders, monthlyOrders, revenueAgg] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { status: "PAID" } }),
    prisma.order.count({ where: { status: "FAILED" } }),
    prisma.order.count({ where: { status: "PAID", createdAt: { gte: monthStart } } }),
    prisma.order.aggregate({ where: { status: "PAID" }, _sum: { amountCents: true } }),
  ]);

  const totalRevenue = (revenueAgg._sum.amountCents ?? 0) / 100;

  return { totalOrders, paidOrders, failedOrders, monthlyOrders, totalRevenue };
}

async function getRecentOrders() {
  return prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 20,
    include: {
      user: { select: { email: true, name: true } },
      plan: { select: { name: true } },
      service: { select: { id: true } },
    },
  });
}

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function AdminBillingPage() {
  const [stats, orders] = await Promise.all([getBillingStats(), getRecentOrders()]);

  const statCards = [
    { label: "Total Revenue", value: `$${stats.totalRevenue.toFixed(2)}`, icon: DollarSign, color: "text-green-400", bg: "bg-green-400/10" },
    { label: "Paid Orders", value: stats.paidOrders.toString(), icon: Receipt, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "This Month", value: stats.monthlyOrders.toString(), icon: TrendingUp, color: "text-purple-400", bg: "bg-purple-400/10" },
    { label: "Failed", value: stats.failedOrders.toString(), icon: CreditCard, color: "text-red-400", bg: "bg-red-400/10" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Billing Overview</h1>
        <p className="mt-1 text-sm text-slate-400">
          Revenue and payment analytics ({stats.totalOrders} total orders)
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="border-white/5 bg-white/[0.02]">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-slate-400">{stat.label}</p>
                <p className="text-xl font-bold text-white">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-white/5 bg-white/[0.02]">
        <CardHeader className="p-5 pb-0">
          <h2 className="text-lg font-semibold text-white">Recent Orders</h2>
        </CardHeader>
        <CardContent className="p-5">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-slate-400">Order ID</TableHead>
                <TableHead className="text-slate-400">User</TableHead>
                <TableHead className="text-slate-400">Plan</TableHead>
                <TableHead className="text-slate-400">Cycle</TableHead>
                <TableHead className="text-slate-400">Amount</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Date</TableHead>
                <TableHead className="text-right text-slate-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow className="border-white/5">
                  <TableCell colSpan={8} className="py-12 text-center text-slate-500">
                    <ShoppingCart className="mx-auto mb-3 h-10 w-10 text-slate-600" />
                    No orders yet
                  </TableCell>
                </TableRow>
              ) : (
                orders.map((order) => {
                  const statusCfg = orderStatusConfig[order.status] ?? orderStatusConfig.PENDING;
                  return (
                    <TableRow key={order.id} className="border-white/5 hover:bg-white/[0.02]">
                      <TableCell className="font-mono text-xs text-slate-300">
                        {order.id.slice(0, 12)}...
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm text-white">{order.user.name}</p>
                          <p className="text-xs text-slate-500">{order.user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-white">{order.plan.name}</TableCell>
                      <TableCell className="text-xs text-slate-400">{order.billingCycle}</TableCell>
                      <TableCell className="font-medium text-white">{formatCents(order.amountCents)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusCfg.className}>
                          {statusCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {order.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </TableCell>
                      <TableCell className="text-right">
                        <OrderActions
                          orderId={order.id}
                          currentStatus={order.status}
                          hasService={!!order.service}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
