import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Server,
  Users,
  CreditCard,
  MessageSquare,
  Activity,
  TrendingUp,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getServers, getNodes, getUsers } from "@/lib/pelican";
import { prisma } from "@/lib/db";

async function getStats() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const [pelicanUsers, pelicanServers, pelicanNodes, dbUsers, activeServices, revenueAgg, openTickets] = await Promise.allSettled([
    getUsers(),
    getServers(),
    getNodes(),
    prisma.user.count(),
    prisma.service.count({ where: { status: "ACTIVE" } }),
    prisma.order.aggregate({ where: { status: "PAID", createdAt: { gte: monthStart } }, _sum: { amountCents: true } }),
    prisma.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
  ]);

  const panelUsers = pelicanUsers.status === "fulfilled" ? pelicanUsers.value.meta.pagination.total : 0;
  const totalServers = pelicanServers.status === "fulfilled" ? pelicanServers.value.meta.pagination.total : 0;
  const totalNodes = pelicanNodes.status === "fulfilled" ? pelicanNodes.value.meta.pagination.total : 0;
  const siteUsers = dbUsers.status === "fulfilled" ? dbUsers.value : 0;
  const dbActiveServices = activeServices.status === "fulfilled" ? activeServices.value : 0;
  const monthlyRevenueCents = revenueAgg.status === "fulfilled" ? (revenueAgg.value._sum.amountCents ?? 0) : 0;
  const tickets = openTickets.status === "fulfilled" ? openTickets.value : 0;

  return { panelUsers, totalServers, totalNodes, siteUsers, dbActiveServices, monthlyRevenueCents, tickets };
}

interface ActivityItem {
  action: string;
  user: string;
  detail: string;
  time: string;
  status: string;
}

async function getRecentActivity(): Promise<ActivityItem[]> {
  const logs = await prisma.provisioningLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { service: { include: { user: true } } },
  });

  return logs.map((log: { action: string; service: { user: { email: string }; name: string }; createdAt: Date; status: string }) => ({
    action: log.action,
    user: log.service.user.email,
    detail: log.service.name,
    time: log.createdAt.toISOString(),
    status: log.status === "COMPLETED" ? "success" : log.status === "FAILED" ? "error" : "info",
  }));
}

const statusColors: Record<string, string> = {
  success: "bg-green-500/10 text-green-400 border-green-500/20",
  warning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  error: "bg-red-500/10 text-red-400 border-red-500/20",
  info: "bg-[#00b07d]/10 text-[#00c98d] border-[#00c98d]/20",
};

export default async function AdminDashboard() {
  const { panelUsers, totalServers, totalNodes, siteUsers, dbActiveServices, monthlyRevenueCents, tickets } = await getStats();
  const recentActivity = await getRecentActivity();
  const monthlyRevenue = (monthlyRevenueCents / 100).toFixed(2);

  const stats = [
    {
      label: "Site Users",
      value: siteUsers.toString(),
      change: `${panelUsers} panel`,
      icon: Users,
      color: "text-[#00c98d]",
      bg: "bg-blue-400/10",
    },
    {
      label: "Active Servers",
      value: (dbActiveServices || totalServers).toString(),
      change: `${totalNodes} nodes`,
      icon: Server,
      color: "text-green-400",
      bg: "bg-green-400/10",
    },
    {
      label: "Monthly Revenue",
      value: `$${monthlyRevenue}`,
      change: "this month",
      icon: CreditCard,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
    },
    {
      label: "Open Tickets",
      value: tickets.toString(),
      change: "need attention",
      icon: MessageSquare,
      color: "text-cyan-400",
      bg: "bg-cyan-400/10",
    },
  ];
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Admin Overview</h1>
        <p className="mt-1 text-sm text-slate-400">
          Platform health and key metrics at a glance
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-white/5 bg-white/[0.02]">
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg}`}
                >
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <div className="flex items-center gap-1 text-xs text-green-400">
                  <TrendingUp className="h-3 w-3" />
                  {stat.change}
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-white">
                {stat.value}
              </p>
              <p className="text-sm text-slate-400">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <Card className="border-white/5 bg-white/[0.02]">
        <CardHeader className="flex flex-row items-center justify-between p-5 pb-0">
          <h2 className="text-lg font-semibold text-white">
            <Activity className="mr-2 inline h-5 w-5 text-slate-400" />
            Recent Activity
          </h2>
        </CardHeader>
        <CardContent className="p-5">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-slate-400">Action</TableHead>
                <TableHead className="text-slate-400">User</TableHead>
                <TableHead className="text-slate-400">Detail</TableHead>
                <TableHead className="text-slate-400">Time</TableHead>
                <TableHead className="text-right text-slate-400">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentActivity.length === 0 ? (
                <TableRow className="border-white/5">
                  <TableCell colSpan={5} className="text-center text-slate-500 py-8">
                    No activity yet. Provisioning logs will appear here.
                  </TableCell>
                </TableRow>
              ) : (
                recentActivity.map((item: ActivityItem, i: number) => (
                  <TableRow
                    key={i}
                    className="border-white/5 hover:bg-white/[0.02]"
                  >
                    <TableCell className="font-medium text-white">
                      {item.action}
                    </TableCell>
                    <TableCell className="text-slate-400">{item.user}</TableCell>
                    <TableCell className="text-slate-300">
                      {item.detail}
                    </TableCell>
                    <TableCell className="text-slate-500">{item.time}</TableCell>
                    <TableCell className="text-right">
                      <Badge
                        variant="outline"
                        className={statusColors[item.status]}
                      >
                        {item.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
