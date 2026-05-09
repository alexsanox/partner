import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, TrendingUp, DollarSign, Receipt } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const stats = [
  { label: "Monthly Revenue", value: "$8,934", icon: DollarSign, color: "text-green-400", bg: "bg-green-400/10" },
  { label: "Active Subscriptions", value: "892", icon: Receipt, color: "text-blue-400", bg: "bg-blue-400/10" },
  { label: "Avg. Revenue/User", value: "$10.02", icon: TrendingUp, color: "text-purple-400", bg: "bg-purple-400/10" },
  { label: "Failed Payments", value: "3", icon: CreditCard, color: "text-red-400", bg: "bg-red-400/10" },
];

const recentPayments = [
  { id: "pay_001", user: "alex@example.com", amount: "$9.99", plan: "Pro", status: "Succeeded", date: "May 9, 2026" },
  { id: "pay_002", user: "sarah@example.com", amount: "$5.99", plan: "Essential", status: "Succeeded", date: "May 9, 2026" },
  { id: "pay_003", user: "mike@example.com", amount: "$19.99", plan: "Enterprise", status: "Failed", date: "May 8, 2026" },
  { id: "pay_004", user: "emma@example.com", amount: "$2.99", plan: "Starter", status: "Succeeded", date: "May 8, 2026" },
  { id: "pay_005", user: "david@example.com", amount: "$9.99", plan: "Pro", status: "Refunded", date: "May 7, 2026" },
];

const paymentStatusConfig: Record<string, string> = {
  Succeeded: "bg-green-500/10 text-green-400 border-green-500/20",
  Failed: "bg-red-500/10 text-red-400 border-red-500/20",
  Refunded: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
};

export default function AdminBillingPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Billing Overview</h1>
        <p className="mt-1 text-sm text-slate-400">Revenue and payment analytics</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
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
          <h2 className="text-lg font-semibold text-white">Recent Payments</h2>
        </CardHeader>
        <CardContent className="p-5">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-slate-400">Payment ID</TableHead>
                <TableHead className="text-slate-400">User</TableHead>
                <TableHead className="text-slate-400">Plan</TableHead>
                <TableHead className="text-slate-400">Amount</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentPayments.map((p) => (
                <TableRow key={p.id} className="border-white/5 hover:bg-white/[0.02]">
                  <TableCell className="font-mono text-xs text-slate-300">{p.id}</TableCell>
                  <TableCell className="text-slate-400">{p.user}</TableCell>
                  <TableCell className="text-white">{p.plan}</TableCell>
                  <TableCell className="font-medium text-white">{p.amount}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={paymentStatusConfig[p.status] ?? ""}>
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-500">{p.date}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
