import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CreditCard, Receipt, Download } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const mockInvoices = [
  {
    id: "INV-001",
    date: "May 1, 2026",
    description: "Pro Plan — Survival SMP",
    amount: "$9.99",
    status: "Paid",
  },
  {
    id: "INV-002",
    date: "May 1, 2026",
    description: "Essential Plan — Modded Fabric",
    amount: "$5.99",
    status: "Paid",
  },
  {
    id: "INV-003",
    date: "Apr 1, 2026",
    description: "Pro Plan — Survival SMP",
    amount: "$9.99",
    status: "Paid",
  },
  {
    id: "INV-004",
    date: "Apr 1, 2026",
    description: "Essential Plan — Modded Fabric",
    amount: "$5.99",
    status: "Paid",
  },
];

export default function BillingPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Billing</h1>
        <p className="mt-1 text-sm text-slate-400">
          Manage your subscriptions and view invoices
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-white/5 bg-white/[0.02]">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-400/10">
              <CreditCard className="h-5 w-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Monthly Total</p>
              <p className="text-xl font-bold text-white">$15.98</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/5 bg-white/[0.02]">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-400/10">
              <Receipt className="h-5 w-5 text-green-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Active Subscriptions</p>
              <p className="text-xl font-bold text-white">2</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/5 bg-white/[0.02]">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-400/10">
              <CreditCard className="h-5 w-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-slate-400">Payment Method</p>
              <p className="text-sm font-medium text-white">•••• 4242</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices */}
      <Card className="border-white/5 bg-white/[0.02]">
        <CardHeader className="p-5 pb-0">
          <h2 className="text-lg font-semibold text-white">Invoice History</h2>
        </CardHeader>
        <CardContent className="p-5">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-slate-400">Invoice</TableHead>
                <TableHead className="text-slate-400">Date</TableHead>
                <TableHead className="text-slate-400">Description</TableHead>
                <TableHead className="text-slate-400">Amount</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-right text-slate-400">
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockInvoices.map((invoice) => (
                <TableRow
                  key={invoice.id}
                  className="border-white/5 hover:bg-white/[0.02]"
                >
                  <TableCell className="font-medium text-white">
                    {invoice.id}
                  </TableCell>
                  <TableCell className="text-slate-400">
                    {invoice.date}
                  </TableCell>
                  <TableCell className="text-slate-300">
                    {invoice.description}
                  </TableCell>
                  <TableCell className="font-medium text-white">
                    {invoice.amount}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className="bg-green-500/10 text-green-400 border-green-500/20"
                    >
                      {invoice.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-slate-400 hover:text-white"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
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
