import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { TicketActions } from "@/components/admin/ticket-actions";

const statusConfig: Record<string, { label: string; className: string }> = {
  OPEN: { label: "Open", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  IN_PROGRESS: { label: "In Progress", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  WAITING_REPLY: { label: "Waiting Reply", className: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  RESOLVED: { label: "Resolved", className: "bg-green-500/10 text-green-400 border-green-500/20" },
  CLOSED: { label: "Closed", className: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  LOW: { label: "Low", className: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  MEDIUM: { label: "Medium", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  HIGH: { label: "High", className: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  CRITICAL: { label: "Critical", className: "bg-red-500/10 text-red-400 border-red-500/20" },
};

async function getTicketStats() {
  const [total, open, inProgress, resolved] = await Promise.all([
    prisma.supportTicket.count(),
    prisma.supportTicket.count({ where: { status: "OPEN" } }),
    prisma.supportTicket.count({ where: { status: "IN_PROGRESS" } }),
    prisma.supportTicket.count({ where: { status: "RESOLVED" } }),
  ]);
  return { total, open, inProgress, resolved };
}

async function getTickets() {
  return prisma.supportTicket.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      user: { select: { name: true, email: true } },
      _count: { select: { messages: true } },
    },
  });
}

export default async function AdminTicketsPage() {
  const [stats, tickets] = await Promise.all([getTicketStats(), getTickets()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Support Tickets</h1>
        <p className="mt-1 text-sm text-slate-400">
          Manage customer support tickets ({stats.total} total)
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Total", value: stats.total, color: "text-white" },
          { label: "Open", value: stats.open, color: "text-blue-400" },
          { label: "In Progress", value: stats.inProgress, color: "text-yellow-400" },
          { label: "Resolved", value: stats.resolved, color: "text-green-400" },
        ].map((s) => (
          <Card key={s.label} className="border-white/5 bg-white/[0.02]">
            <CardContent className="p-5">
              <p className="text-sm text-slate-400">{s.label}</p>
              <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-white/5 bg-white/[0.02]">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-slate-400">Subject</TableHead>
                <TableHead className="text-slate-400">User</TableHead>
                <TableHead className="text-slate-400">Priority</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Messages</TableHead>
                <TableHead className="text-slate-400">Created</TableHead>
                <TableHead className="text-right text-slate-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tickets.length === 0 ? (
                <TableRow className="border-white/5">
                  <TableCell colSpan={7} className="py-12 text-center text-slate-500">
                    <MessageSquare className="mx-auto mb-3 h-10 w-10 text-slate-600" />
                    No support tickets yet
                  </TableCell>
                </TableRow>
              ) : (
                tickets.map((ticket) => {
                  const sCfg = statusConfig[ticket.status] ?? statusConfig.OPEN;
                  const pCfg = priorityConfig[ticket.priority] ?? priorityConfig.MEDIUM;
                  return (
                    <TableRow key={ticket.id} className="border-white/5 hover:bg-white/[0.02]">
                      <TableCell>
                        <p className="font-medium text-white">{ticket.subject}</p>
                        <p className="font-mono text-xs text-slate-600">{ticket.id.slice(0, 10)}</p>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm text-white">{ticket.user.name}</p>
                          <p className="text-xs text-slate-500">{ticket.user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={pCfg.className}>
                          {pCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={sCfg.className}>
                          {sCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-400">{ticket._count.messages}</TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {ticket.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </TableCell>
                      <TableCell className="text-right">
                        <TicketActions
                          ticketId={ticket.id}
                          currentStatus={ticket.status}
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
