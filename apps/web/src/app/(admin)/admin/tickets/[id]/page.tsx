"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, Loader2, Send, User, Headphones,
  CheckCircle, XCircle, RotateCcw,
  Mail, Shield, Calendar, Server, CreditCard, ExternalLink, MessageSquare, Hash,
} from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

interface Message {
  id: string;
  authorId: string;
  content: string;
  isStaff: boolean;
  createdAt: string;
}

interface TicketDetail {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string; email: string };
  messages: Message[];
}

interface UserService {
  id: string;
  name: string;
  status: string;
  ipAddress: string | null;
  port: number | null;
  createdAt: string;
  expiresAt: string | null;
  plan: { name: string; priceMonthly: number };
}

interface UserOrder {
  id: string;
  status: string;
  amountCents: number;
  currency: string;
  billingCycle: string;
  createdAt: string;
  plan: { name: string };
}

interface UserTicket {
  id: string;
  subject: string;
  status: string;
  createdAt: string;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  services: UserService[];
  orders: UserOrder[];
  tickets: UserTicket[];
}

const statusConfig: Record<string, { label: string; className: string; dot: string }> = {
  OPEN:          { label: "Open",          className: "bg-[#00b07d]/10 text-[#00c98d] border-[#00c98d]/20",     dot: "bg-blue-400" },
  IN_PROGRESS:   { label: "In Progress",   className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", dot: "bg-yellow-400" },
  WAITING_REPLY: { label: "Waiting Reply", className: "bg-orange-500/10 text-orange-400 border-orange-500/20", dot: "bg-orange-400 animate-pulse" },
  RESOLVED:      { label: "Resolved",      className: "bg-green-500/10 text-green-400 border-green-500/20",   dot: "bg-green-400" },
  CLOSED:        { label: "Closed",        className: "bg-slate-500/10 text-slate-400 border-slate-500/20",   dot: "bg-slate-500" },
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  LOW:      { label: "Low",      className: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  MEDIUM:   { label: "Medium",   className: "bg-[#00b07d]/10 text-[#00c98d] border-[#00c98d]/20" },
  HIGH:     { label: "High",     className: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  CRITICAL: { label: "Critical", className: "bg-red-500/10 text-red-400 border-red-500/20" },
};

const serviceStatusConfig: Record<string, { label: string; className: string }> = {
  ACTIVE:    { label: "Active",    className: "bg-green-500/10 text-green-400 border-green-500/20" },
  SUSPENDED: { label: "Suspended", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  CANCELLED: { label: "Cancelled", className: "bg-red-500/10 text-red-400 border-red-500/20" },
  PENDING:   { label: "Pending",   className: "bg-[#00b07d]/10 text-[#00c98d] border-[#00c98d]/20" },
};

const orderStatusConfig: Record<string, { label: string; color: string }> = {
  PAID:      { label: "Paid",      color: "text-green-400" },
  PENDING:   { label: "Pending",   color: "text-yellow-400" },
  FAILED:    { label: "Failed",    color: "text-red-400" },
  REFUNDED:  { label: "Refunded",  color: "text-purple-400" },
  CANCELLED: { label: "Cancelled", color: "text-slate-400" },
};

export default function AdminTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const messagesEnd = useRef<HTMLDivElement>(null);

  const fetchTicket = useCallback(async () => {
    try {
      const res = await fetch(`/api/tickets/${id}`);
      if (res.ok) {
        const data = await res.json();
        setTicket(data);
        const userRes = await fetch(`/api/admin/users/${data.user.id}`);
        if (userRes.ok) setUserProfile(await userRes.json());
      } else {
        router.push("/admin/tickets");
      }
    } catch {
      router.push("/admin/tickets");
    }
    setLoading(false);
  }, [id, router]);

  useEffect(() => { fetchTicket(); }, [fetchTicket]);
  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages.length]);

  async function handleReply(andResolve = false) {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const res = await fetch(`/api/tickets/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: reply }),
      });
      if (res.ok) {
        setReply("");
        if (andResolve) {
          await fetch("/api/admin/tickets", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ticketId: id, action: "resolve" }),
          });
          toast.success("Reply sent and ticket resolved.");
        } else {
          toast.success("Reply sent.");
        }
        await fetchTicket();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to send reply");
      }
    } catch {
      toast.error("Failed to send reply");
    }
    setSending(false);
  }

  async function handleStatusAction(action: string) {
    setActionLoading(true);
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId: id, action }),
      });
      if (res.ok) {
        const labels: Record<string, string> = { resolve: "Ticket resolved", close: "Ticket closed", reopen: "Ticket reopened" };
        toast.success(labels[action] ?? "Done");
        await fetchTicket();
      } else {
        const data = await res.json();
        toast.error(data.error || "Action failed");
      }
    } catch {
      toast.error("Action failed");
    }
    setActionLoading(false);
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin text-[#8b92a8]" />
      </div>
    );
  }

  if (!ticket) return null;

  const sCfg = statusConfig[ticket.status] ?? statusConfig.OPEN;
  const pCfg = priorityConfig[ticket.priority] ?? priorityConfig.MEDIUM;
  const isClosed = ticket.status === "CLOSED" || ticket.status === "RESOLVED";

  function formatDate(date: string) {
    return new Date(date).toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit",
    });
  }

  function formatShort(date: string) {
    const d = new Date(date);
    const diff = Date.now() - d.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  const activeServices = userProfile?.services.filter((s) => s.status === "ACTIVE") ?? [];
  const otherTickets = userProfile?.tickets.filter((t) => t.id !== ticket.id).slice(0, 5) ?? [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link
          href="/admin/tickets"
          className="mt-1 shrink-0 rounded-lg p-1.5 text-[#8b92a8] hover:bg-white/[0.05] hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-white">{ticket.subject}</h1>
            <Badge variant="outline" className={`text-[11px] ${pCfg.className}`}>{pCfg.label}</Badge>
            <Badge variant="outline" className={`text-[11px] ${sCfg.className}`}>
              <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${sCfg.dot}`} />
              {sCfg.label}
            </Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#8b92a8]">
            <span className="flex items-center gap-1"><Hash className="h-3 w-3" />{ticket.id.slice(0, 10)}</span>
            <span>{ticket.user.name} · {ticket.user.email}</span>
            <span>Opened {formatDate(ticket.createdAt)}</span>
          </div>
        </div>
        {/* Status actions */}
        <div className="flex shrink-0 items-center gap-2">
          {!isClosed && (
            <>
              <Button size="sm" variant="outline" onClick={() => handleStatusAction("resolve")} disabled={actionLoading}
                className="border-green-500/20 text-green-400 hover:bg-green-500/10">
                <CheckCircle className="mr-1.5 h-3.5 w-3.5" /> Resolve
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleStatusAction("close")} disabled={actionLoading}
                className="border-slate-500/20 text-slate-400 hover:bg-slate-500/10">
                <XCircle className="mr-1.5 h-3.5 w-3.5" /> Close
              </Button>
            </>
          )}
          {isClosed && (
            <Button size="sm" variant="outline" onClick={() => handleStatusAction("reopen")} disabled={actionLoading}
              className="border-[#00c98d]/20 text-[#00c98d] hover:bg-[#00e0a0]/10">
              <RotateCcw className="mr-1.5 h-3.5 w-3.5" /> Reopen
            </Button>
          )}
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1fr_300px]">
        {/* Messages + Reply */}
        <div className="space-y-3 min-w-0">
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.015] divide-y divide-white/[0.04] overflow-hidden">
            {ticket.messages.map((msg) => (
              <div key={msg.id} className={`flex gap-4 px-5 py-5 ${msg.isStaff ? "bg-[#00c98d]/[0.03]" : ""}`}>
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  msg.isStaff ? "bg-gradient-to-br from-[#00c98d]/30 to-[#7c3aed]/20" : "bg-white/[0.08]"
                }`}>
                  {msg.isStaff ? (
                    <Headphones className="h-3.5 w-3.5 text-[#00c98d]" />
                  ) : (
                    <User className="h-3.5 w-3.5 text-[#8b92a8]" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-2 flex items-center gap-2">
                    <span className={`text-xs font-semibold ${msg.isStaff ? "text-[#00c98d]" : "text-white"}`}>
                      {msg.isStaff ? "Staff" : ticket.user.name}
                    </span>
                    {msg.isStaff && (
                      <span className="rounded-full border border-[#00c98d]/20 bg-[#00c98d]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#00c98d]">Admin</span>
                    )}
                    <span className="ml-auto text-xs text-[#8b92a8]" title={formatDate(msg.createdAt)}>{formatShort(msg.createdAt)}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#c8cdd8]">{msg.content}</p>
                </div>
              </div>
            ))}
            <div ref={messagesEnd} />
          </div>

          {/* Reply box */}
          {isClosed ? (
            <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4">
              <XCircle className="h-4 w-4 shrink-0 text-slate-400" />
              <p className="text-sm text-[#8b92a8]">
                {ticket.status === "RESOLVED" ? "Ticket is resolved." : "Ticket is closed."} Reopen to continue the conversation.
              </p>
              <Button size="sm" variant="outline" onClick={() => handleStatusAction("reopen")} disabled={actionLoading}
                className="ml-auto shrink-0 border-[#00c98d]/20 text-[#00c98d] hover:bg-[#00e0a0]/10 text-xs">
                <RotateCcw className="mr-1.5 h-3 w-3" /> Reopen
              </Button>
            </div>
          ) : (
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <Textarea
                placeholder="Write a staff reply... The user will receive an email notification."
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={4}
                className="border-white/[0.07] bg-white/[0.04] text-white placeholder:text-[#8b92a8] resize-none focus:border-[#00c98d]/40"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleReply(false);
                }}
              />
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-[#8b92a8]">
                  <kbd className="rounded border border-white/10 bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10px]">Ctrl+Enter</kbd>
                  <span className="ml-1.5">to send</span>
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => handleReply(true)}
                    disabled={sending || !reply.trim()}
                    variant="outline"
                    className="border-green-500/20 text-green-400 hover:bg-green-500/10 disabled:opacity-50 text-xs"
                  >
                    {sending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="mr-1.5 h-3.5 w-3.5" />}
                    Reply & Resolve
                  </Button>
                  <Button
                    onClick={() => handleReply(false)}
                    disabled={sending || !reply.trim()}
                    className="bg-[#00c98d] text-white hover:bg-[#4a7aee] disabled:opacity-50"
                  >
                    {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Send Reply
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Sidebar */}
        <div className="space-y-3">
          {/* User Info */}
          <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00c98d]/15 border border-[#00c98d]/20">
                <User className="h-5 w-5 text-[#00c98d]" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-white">{ticket.user.name}</p>
                <p className="truncate text-xs text-[#8b92a8]">{ticket.user.email}</p>
              </div>
            </div>
            {userProfile && (
              <div className="space-y-2 border-t border-white/[0.07] pt-3">
                <SidebarRow icon={Shield} label="Role" value={userProfile.role} />
                <SidebarRow icon={Mail} label="Verified" value={userProfile.emailVerified ? "Yes" : "No"}
                  valueColor={userProfile.emailVerified ? "text-green-400" : "text-yellow-400"} />
                <SidebarRow icon={Calendar} label="Joined"
                  value={new Date(userProfile.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} />
                <SidebarRow icon={Server} label="Services" value={String(userProfile.services.length)} />
                <SidebarRow icon={CreditCard} label="Orders" value={String(userProfile.orders.length)} />
                <SidebarRow icon={MessageSquare} label="Tickets" value={String(userProfile.tickets.length)} />
              </div>
            )}
          </div>

          {/* Active Services */}
          {activeServices.length > 0 && (
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#8b92a8]">
                <Server className="h-3.5 w-3.5" /> Services ({activeServices.length})
              </h3>
              <div className="space-y-2">
                {activeServices.map((svc) => {
                  const svcCfg = serviceStatusConfig[svc.status] ?? serviceStatusConfig.PENDING;
                  return (
                    <div key={svc.id} className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="truncate text-xs font-medium text-white">{svc.name}</span>
                        <Badge variant="outline" className={`text-[10px] py-0 px-1.5 ${svcCfg.className}`}>{svcCfg.label}</Badge>
                      </div>
                      <div className="space-y-0.5 text-[11px] text-[#8b92a8]">
                        <p>{svc.plan.name} · ${(svc.plan.priceMonthly / 100).toFixed(2)}/mo</p>
                        {svc.ipAddress && svc.port && (
                          <p className="font-mono text-[#00c98d]">{svc.ipAddress}:{svc.port}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recent Orders */}
          {userProfile && userProfile.orders.length > 0 && (
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#8b92a8]">
                <CreditCard className="h-3.5 w-3.5" /> Recent Orders
              </h3>
              <div className="space-y-1.5">
                {userProfile.orders.slice(0, 4).map((order) => {
                  const oCfg = orderStatusConfig[order.status] ?? orderStatusConfig.PENDING;
                  return (
                    <div key={order.id} className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2">
                      <div className="min-w-0">
                        <p className="truncate text-xs text-white">{order.plan.name}</p>
                        <p className="text-[11px] text-[#8b92a8]">
                          {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-xs font-medium text-white">${(order.amountCents / 100).toFixed(2)}</p>
                        <p className={`text-[11px] font-medium ${oCfg.color}`}>{oCfg.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Other Tickets */}
          {otherTickets.length > 0 && (
            <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#8b92a8]">
                <MessageSquare className="h-3.5 w-3.5" /> Other Tickets
              </h3>
              <div className="space-y-1">
                {otherTickets.map((t) => {
                  const tCfg = statusConfig[t.status] ?? statusConfig.OPEN;
                  return (
                    <Link
                      key={t.id}
                      href={`/admin/tickets/${t.id}`}
                      className="group flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2 transition-colors hover:bg-white/[0.04]"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs text-white group-hover:text-[#00c98d] transition-colors">{t.subject}</p>
                        <p className="text-[11px] text-[#8b92a8]">
                          {new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                      <div className="ml-2 flex shrink-0 items-center gap-1">
                        <Badge variant="outline" className={`text-[10px] py-0 px-1.5 ${tCfg.className}`}>{tCfg.label}</Badge>
                        <ExternalLink className="h-3 w-3 text-[#8b92a8] opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SidebarRow({
  icon: Icon, label, value, valueColor,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-xs text-[#8b92a8]">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className={`text-xs font-medium ${valueColor ?? "text-white"}`}>{value}</span>
    </div>
  );
}
