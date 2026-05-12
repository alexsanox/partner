import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/db";
import { TicketActions } from "@/components/admin/ticket-actions";
import Link from "next/link";

const statusConfig: Record<string, { label: string; className: string; dot: string }> = {
  OPEN:          { label: "Open",          className: "bg-blue-500/10 text-blue-400 border-blue-500/20",     dot: "bg-blue-400" },
  IN_PROGRESS:   { label: "In Progress",   className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", dot: "bg-yellow-400" },
  WAITING_REPLY: { label: "Waiting Reply", className: "bg-orange-500/10 text-orange-400 border-orange-500/20", dot: "bg-orange-400 animate-pulse" },
  RESOLVED:      { label: "Resolved",      className: "bg-green-500/10 text-green-400 border-green-500/20",   dot: "bg-green-400" },
  CLOSED:        { label: "Closed",        className: "bg-slate-500/10 text-slate-400 border-slate-500/20",   dot: "bg-slate-500" },
};

const priorityConfig: Record<string, { label: string; className: string; bar: string }> = {
  LOW:      { label: "Low",      className: "bg-slate-500/10 text-slate-400 border-slate-500/20", bar: "bg-slate-500" },
  MEDIUM:   { label: "Medium",   className: "bg-blue-500/10 text-blue-400 border-blue-500/20",   bar: "bg-blue-400" },
  HIGH:     { label: "High",     className: "bg-orange-500/10 text-orange-400 border-orange-500/20", bar: "bg-orange-400" },
  CRITICAL: { label: "Critical", className: "bg-red-500/10 text-red-400 border-red-500/20",       bar: "bg-red-500" },
};

async function getTicketStats() {
  const [total, open, waitingReply, inProgress, resolved, closed] = await Promise.all([
    prisma.supportTicket.count(),
    prisma.supportTicket.count({ where: { status: "OPEN" } }),
    prisma.supportTicket.count({ where: { status: "WAITING_REPLY" } }),
    prisma.supportTicket.count({ where: { status: "IN_PROGRESS" } }),
    prisma.supportTicket.count({ where: { status: "RESOLVED" } }),
    prisma.supportTicket.count({ where: { status: "CLOSED" } }),
  ]);
  return { total, open, waitingReply, inProgress, resolved, closed };
}

async function getTickets() {
  return prisma.supportTicket.findMany({
    orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
    include: {
      user: { select: { name: true, email: true } },
      _count: { select: { messages: true } },
    },
  });
}

export default async function AdminTicketsPage() {
  const [stats, tickets] = await Promise.all([getTicketStats(), getTickets()]);

  type Ticket = (typeof tickets)[number];
  const needsAttention = tickets.filter((t: Ticket) =>
    t.status === "OPEN" || t.status === "WAITING_REPLY"
  );
  const inProgress = tickets.filter((t: Ticket) => t.status === "IN_PROGRESS");
  const closed = tickets.filter((t: Ticket) => t.status === "RESOLVED" || t.status === "CLOSED");

  function timeAgo(date: Date) {
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  function TicketRow({ ticket }: { ticket: (typeof tickets)[0] }) {
    const sCfg = statusConfig[ticket.status] ?? statusConfig.OPEN;
    const pCfg = priorityConfig[ticket.priority] ?? priorityConfig.MEDIUM;
    const isUrgent = ticket.status === "WAITING_REPLY" || ticket.priority === "CRITICAL";
    return (
      <div className={`group relative flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.025] ${
        isUrgent ? "border-l-2 border-orange-400/50" : ticket.status === "OPEN" ? "border-l-2 border-blue-400/30" : "border-l-2 border-transparent"
      }`}>
        <div className={`h-2 w-2 shrink-0 rounded-full ${sCfg.dot}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <Link
              href={`/admin/tickets/${ticket.id}`}
              className="truncate text-sm font-medium text-white group-hover:text-[#5b8cff] transition-colors"
            >
              {ticket.subject}
            </Link>
            {isUrgent && ticket.status === "WAITING_REPLY" && (
              <span className="shrink-0 rounded-full bg-orange-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-orange-400 border border-orange-500/20">Needs Reply</span>
            )}
            {ticket.priority === "CRITICAL" && ticket.status !== "WAITING_REPLY" && (
              <span className="shrink-0 rounded-full bg-red-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-red-400 border border-red-500/20">Critical</span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-[#6b7490]">
            {ticket.user.name} · {ticket.user.email} · {ticket._count.messages} {ticket._count.messages === 1 ? "msg" : "msgs"} · {timeAgo(ticket.updatedAt)}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Badge variant="outline" className={`text-[11px] ${pCfg.className}`}>{pCfg.label}</Badge>
          <Badge variant="outline" className={`text-[11px] ${sCfg.className}`}>
            <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${sCfg.dot}`} />
            {sCfg.label}
          </Badge>
          <TicketActions ticketId={ticket.id} currentStatus={ticket.status} />
        </div>
      </div>
    );
  }

  function Section({ title, items, emptyText }: { title: string; items: typeof tickets; emptyText: string }) {
    return (
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
          <h2 className="text-sm font-semibold text-white">{title}</h2>
          <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[11px] font-medium text-[#8b92a8]">{items.length}</span>
        </div>
        <div className="divide-y divide-white/[0.04]">
          {items.length === 0 ? (
            <div className="flex items-center justify-center py-10">
              <p className="text-sm text-[#8b92a8]">{emptyText}</p>
            </div>
          ) : (
            items.map((t: Ticket) => <TicketRow key={t.id} ticket={t} />)
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Support Tickets</h1>
        <p className="mt-1 text-sm text-[#8b92a8]">Manage and respond to customer support requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {[
          { label: "Total",         value: stats.total,        color: "text-white",        dot: "bg-white/30" },
          { label: "Open",          value: stats.open,         color: "text-blue-400",     dot: "bg-blue-400" },
          { label: "Waiting Reply", value: stats.waitingReply, color: "text-orange-400",   dot: "bg-orange-400" },
          { label: "In Progress",   value: stats.inProgress,   color: "text-yellow-400",   dot: "bg-yellow-400" },
          { label: "Resolved",      value: stats.resolved,     color: "text-green-400",    dot: "bg-green-400" },
          { label: "Closed",        value: stats.closed,       color: "text-slate-400",    dot: "bg-slate-500" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <div className="flex items-center gap-1.5">
              <span className={`h-2 w-2 rounded-full ${s.dot}`} />
              <p className="text-xs text-[#8b92a8]">{s.label}</p>
            </div>
            <p className={`mt-1.5 text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Ticket sections */}
      <Section title="Needs Attention" items={needsAttention} emptyText="No tickets need attention right now 🎉" />
      <Section title="In Progress" items={inProgress} emptyText="No tickets in progress" />
      <Section title="Resolved & Closed" items={closed} emptyText="No closed tickets" />
    </div>
  );
}
