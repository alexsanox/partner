import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Server,
  Users,
  CreditCard,
  HardDrive,
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

const stats = [
  {
    label: "Total Users",
    value: "1,247",
    change: "+12%",
    icon: Users,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    label: "Active Services",
    value: "892",
    change: "+8%",
    icon: Server,
    color: "text-green-400",
    bg: "bg-green-400/10",
  },
  {
    label: "Monthly Revenue",
    value: "$8,934",
    change: "+15%",
    icon: CreditCard,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
  {
    label: "Active Nodes",
    value: "6",
    change: "Healthy",
    icon: HardDrive,
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
  },
];

const recentActivity = [
  {
    action: "Server Created",
    user: "alex@example.com",
    detail: "Survival SMP — Pro Plan",
    time: "2 min ago",
    status: "success",
  },
  {
    action: "Payment Received",
    user: "sarah@example.com",
    detail: "$9.99 — Enterprise Plan",
    time: "15 min ago",
    status: "success",
  },
  {
    action: "Server Suspended",
    user: "mike@example.com",
    detail: "Modded Server — Payment overdue",
    time: "1 hour ago",
    status: "warning",
  },
  {
    action: "Provisioning Failed",
    user: "emma@example.com",
    detail: "No available allocations on node-3",
    time: "2 hours ago",
    status: "error",
  },
  {
    action: "New User Registered",
    user: "david@example.com",
    detail: "Email verified",
    time: "3 hours ago",
    status: "info",
  },
];

const statusColors: Record<string, string> = {
  success: "bg-green-500/10 text-green-400 border-green-500/20",
  warning: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  error: "bg-red-500/10 text-red-400 border-red-500/20",
  info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
};

export default function AdminDashboard() {
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
              {recentActivity.map((item, i) => (
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
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
