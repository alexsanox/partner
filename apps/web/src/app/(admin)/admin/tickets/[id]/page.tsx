"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, Loader2, Send, User, Headphones,
  CheckCircle, XCircle, RotateCcw,
  Mail, Shield, Calendar, Server, CreditCard, Clock, ExternalLink, MessageSquare,
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

const statusConfig: Record<string, { label: string; className: string }> = {
  OPEN: { label: "Open", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  IN_PROGRESS: { label: "In Progress", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  WAITING_REPLY: { label: "Waiting Reply", className: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  RESOLVED: { label: "Resolved", className: "bg-green-500/10 text-green-400 border-green-500/20" },
  CLOSED: { label: "Closed", className: "bg-slate-500/10 text-slate-500 border-slate-500/20" },
};

const priorityConfig: Record<string, { label: string; className: string }> = {
  LOW: { label: "Low", className: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  MEDIUM: { label: "Medium", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  HIGH: { label: "High", className: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  CRITICAL: { label: "Critical", className: "bg-red-500/10 text-red-400 border-red-500/20" },
};

const serviceStatusConfig: Record<string, { label: string; color: string }> = {
  ACTIVE: { label: "Active", color: "text-green-400 bg-green-500/10 border-green-500/20" },
  SUSPENDED: { label: "Suspended", color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20" },
  CANCELLED: { label: "Cancelled", color: "text-red-400 bg-red-500/10 border-red-500/20" },
  PENDING: { label: "Pending", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
};

const orderStatusConfig: Record<string, { label: string; color: string }> = {
  PAID: { label: "Paid", color: "text-green-400" },
  PENDING: { label: "Pending", color: "text-yellow-400" },
  FAILED: { label: "Failed", color: "text-red-400" },
  REFUNDED: { label: "Refunded", color: "text-purple-400" },
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
        // Fetch user profile for the sidebar
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
  useEffect(() => { messagesEnd.current?.scrollIntoView({ behavior: "smooth" }); }, [ticket?.messages.length]);

  async function handleReply() {
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
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#8b92a8]" />
      </div>
    );
  }

  if (!ticket) return null;

  const sCfg = statusConfig[ticket.status] ?? statusConfig.OPEN;
  const pCfg = priorityConfig[ticket.priority] ?? priorityConfig.MEDIUM;
  const isClosed = ticket.status === "CLOSED";

  function formatDate(date: string) {
    return new Date(date).toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit",
    });
  }

  const activeServices = userProfile?.services.filter((s) => s.status === "ACTIVE") ?? [];
  const otherTickets = userProfile?.tickets.filter((t) => t.id !== ticket.id).slice(0, 5) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Link
            href="/admin/tickets"
            className="mt-1 rounded-md p-1.5 text-[#8b92a8] hover:bg-white/[0.04] hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">{ticket.subject}</h1>
            <p className="mt-0.5 text-xs text-[#8b92a8]">
              {ticket.user.name} ({ticket.user.email}) · Opened {formatDate(ticket.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={pCfg.className}>{pCfg.label}</Badge>
          <Badge variant="outline" className={sCfg.className}>{sCfg.label}</Badge>
        </div>
      </div>

      {/* Status actions */}
      <div className="flex items-center gap-2">
        {ticket.status !== "RESOLVED" && ticket.status !== "CLOSED" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleStatusAction("resolve")}
            disabled={actionLoading}
            className="border-green-500/20 text-green-400 hover:bg-green-500/10"
          >
            <CheckCircle className="mr-1.5 h-3.5 w-3.5" />
            Resolve
          </Button>
        )}
        {ticket.status !== "CLOSED" && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleStatusAction("close")}
            disabled={actionLoading}
            className="border-slate-500/20 text-slate-400 hover:bg-slate-500/10"
          >
            <XCircle className="mr-1.5 h-3.5 w-3.5" />
            Close
          </Button>
        )}
        {(ticket.status === "RESOLVED" || ticket.status === "CLOSED") && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleStatusAction("reopen")}
            disabled={actionLoading}
            className="border-blue-500/20 text-blue-400 hover:bg-blue-500/10"
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Reopen
          </Button>
        )}
      </div>

      {/* Two-column layout: Messages + User Sidebar */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        {/* Left: Messages + Reply */}
        <div className="space-y-4 min-w-0">
          {ticket.messages.map((msg) => (
            <div key={msg.id} className="flex gap-3">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                msg.isStaff ? "bg-[#5b8cff]/20" : "bg-white/[0.06]"
              }`}>
                {msg.isStaff ? (
                  <Headphones className="h-4 w-4 text-[#5b8cff]" />
                ) : (
                  <User className="h-4 w-4 text-[#8b92a8]" />
                )}
              </div>
              <Card className={`flex-1 border-white/5 ${msg.isStaff ? "bg-[#5b8cff]/[0.04]" : "bg-white/[0.02]"}`}>
                <CardContent className="p-4">
                  <div className="mb-2 flex items-center justify-between">
                    <span className={`text-xs font-medium ${msg.isStaff ? "text-[#5b8cff]" : "text-white"}`}>
                      {msg.isStaff ? "Staff" : ticket.user.name}
                    </span>
                    <span className="text-xs text-[#8b92a8]">{formatDate(msg.createdAt)}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#c8cdd8]">{msg.content}</p>
                </CardContent>
              </Card>
            </div>
          ))}
          <div ref={messagesEnd} />

          {/* Reply box */}
          {!isClosed ? (
            <Card className="border-white/5 bg-white/[0.02]">
              <CardContent className="p-4">
                <Textarea
                  placeholder="Type your staff reply..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={3}
                  className="border-white/[0.07] bg-white/[0.04] text-white placeholder:text-[#8b92a8] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleReply();
                  }}
                />
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-xs text-[#8b92a8]">Ctrl+Enter to send · Reply will be visible to the user</p>
                  <Button
                    onClick={handleReply}
                    disabled={sending || !reply.trim()}
                    className="bg-[#5b8cff] text-white hover:bg-[#4a7aee] disabled:opacity-50"
                  >
                    {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    Send Reply
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-white/5 bg-white/[0.02]">
              <CardContent className="p-4 text-center">
                <p className="text-sm text-[#8b92a8]">This ticket is closed. Reopen it to continue the conversation.</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: User Sidebar */}
        <div className="space-y-4">
          {/* User Info */}
          <div className="rounded-xl border border-white/[0.07] bg-[#232839] p-4">
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#5b8cff]/20">
                <User className="h-5 w-5 text-[#5b8cff]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate">{ticket.user.name}</p>
                <p className="text-xs text-[#8b92a8] truncate">{ticket.user.email}</p>
              </div>
            </div>
            {userProfile && (
              <div className="space-y-2 border-t border-white/[0.07] pt-3">
                <SidebarRow icon={Shield} label="Role" value={userProfile.role} />
                <SidebarRow icon={Mail} label="Verified" value={userProfile.emailVerified ? "Yes" : "No"} valueColor={userProfile.emailVerified ? "text-green-400" : "text-yellow-400"} />
                <SidebarRow icon={Calendar} label="Joined" value={new Date(userProfile.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} />
                <SidebarRow icon={Server} label="Services" value={String(userProfile.services.length)} />
                <SidebarRow icon={CreditCard} label="Orders" value={String(userProfile.orders.length)} />
                <SidebarRow icon={MessageSquare} label="Tickets" value={String(userProfile.tickets.length)} />
              </div>
            )}
          </div>

          {/* Active Services */}
          <div className="rounded-xl border border-white/[0.07] bg-[#232839] p-4">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8b92a8]">
              <Server className="h-3.5 w-3.5" />
              Active Services ({activeServices.length})
            </h3>
            {activeServices.length === 0 ? (
              <p className="text-xs text-[#8b92a8]/60">No active services</p>
            ) : (
              <div className="space-y-2">
                {activeServices.map((svc) => {
                  const sCfgSvc = serviceStatusConfig[svc.status] ?? serviceStatusConfig.PENDING;
                  return (
                    <div key={svc.id} className="rounded-lg border border-white/[0.05] bg-white/[0.02] p-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-medium text-white truncate">{svc.name}</span>
                        <Badge variant="outline" className={`text-[10px] py-0 px-1.5 ${sCfgSvc.color}`}>{sCfgSvc.label}</Badge>
                      </div>
                      <div className="text-[11px] text-[#8b92a8] space-y-0.5">
                        <p>{svc.plan.name} · ${(svc.plan.priceMonthly / 100).toFixed(2)}/mo</p>
                        {svc.ipAddress && svc.port && (
                          <p className="font-mono text-[#5b8cff]">{svc.ipAddress}:{svc.port}</p>
                        )}
                        {svc.expiresAt && (
                          <p className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Expires {new Date(svc.expiresAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Recent Orders */}
          {userProfile && userProfile.orders.length > 0 && (
            <div className="rounded-xl border border-white/[0.07] bg-[#232839] p-4">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8b92a8]">
                <CreditCard className="h-3.5 w-3.5" />
                Recent Orders
              </h3>
              <div className="space-y-1.5">
                {userProfile.orders.slice(0, 5).map((order) => {
                  const oCfg = orderStatusConfig[order.status] ?? orderStatusConfig.PENDING;
                  return (
                    <div key={order.id} className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-xs text-white truncate">{order.plan.name}</p>
                        <p className="text-[11px] text-[#8b92a8]">
                          {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
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
            <div className="rounded-xl border border-white/[0.07] bg-[#232839] p-4">
              <h3 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8b92a8]">
                <MessageSquare className="h-3.5 w-3.5" />
                Other Tickets
              </h3>
              <div className="space-y-1.5">
                {otherTickets.map((t) => {
                  const tCfg = statusConfig[t.status] ?? statusConfig.OPEN;
                  return (
                    <Link
                      key={t.id}
                      href={`/admin/tickets/${t.id}`}
                      className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2 transition-colors hover:bg-white/[0.04] group"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-white truncate group-hover:text-[#5b8cff] transition-colors">{t.subject}</p>
                        <p className="text-[11px] text-[#8b92a8]">
                          {new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
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

function SidebarRow({ icon: Icon, label, value, valueColor }: { icon: React.ComponentType<{ className?: string }>; label: string; value: string; valueColor?: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-xs text-[#8b92a8]">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span className={`text-xs font-medium ${valueColor || "text-white"}`}>{value}</span>
    </div>
  );
}
