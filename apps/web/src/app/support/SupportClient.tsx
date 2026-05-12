"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";
import {
  Plus, MessageSquare, Loader2, ArrowRight, X,
  AlertCircle, Clock, CheckCircle2, XCircle, Flame, AlertTriangle,
  Minus, LifeBuoy, Send, Info, LogIn, BookOpen, Mail, Zap,
} from "lucide-react";
import { toast } from "sonner";

interface Ticket {
  id: string;
  subject: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  _count: { messages: number };
}

const statusConfig: Record<string, { label: string; icon: React.ElementType; className: string; dot: string }> = {
  OPEN:          { label: "Open",         icon: AlertCircle,  className: "bg-[#00b07d]/10 text-[#00c98d] border-[#00c98d]/20",     dot: "bg-blue-400" },
  IN_PROGRESS:   { label: "In Progress",  icon: Clock,        className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",  dot: "bg-yellow-400" },
  WAITING_REPLY: { label: "Waiting Reply",icon: AlertTriangle,className: "bg-orange-500/10 text-orange-400 border-orange-500/20", dot: "bg-orange-400 animate-pulse" },
  RESOLVED:      { label: "Resolved",     icon: CheckCircle2, className: "bg-green-500/10 text-green-400 border-green-500/20",     dot: "bg-green-400" },
  CLOSED:        { label: "Closed",       icon: XCircle,      className: "bg-slate-500/10 text-slate-400 border-slate-500/20",     dot: "bg-slate-500" },
};

const priorityConfig: Record<string, { label: string; icon: React.ElementType; className: string; active: string }> = {
  LOW:      { label: "Low",      icon: Minus,         className: "border-slate-500/30 text-slate-400",     active: "bg-slate-500/15 border-slate-400/40 text-slate-300 ring-1 ring-slate-400/20" },
  MEDIUM:   { label: "Medium",   icon: AlertCircle,   className: "border-[#00c98d]/30 text-[#00c98d]",     active: "bg-[#00b07d]/15 border-[#00c98d]/40 text-[#4dd9ae] ring-1 ring-[#00c98d]/20" },
  HIGH:     { label: "High",     icon: AlertTriangle, className: "border-orange-500/30 text-orange-400",   active: "bg-orange-500/15 border-orange-400/40 text-orange-300 ring-1 ring-orange-400/20" },
  CRITICAL: { label: "Critical", icon: Flame,         className: "border-red-500/30 text-red-400",         active: "bg-red-500/15 border-red-400/40 text-red-300 ring-1 ring-red-400/20" },
};

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

/* ─── Unauthenticated view ─────────────────────────────────────────── */
function GuestView() {
  return (
    <div className="space-y-10">
      {/* Contact cards */}
      <div className="grid gap-5 sm:grid-cols-3">
        {[
          {
            icon: MessageSquare,
            title: "Live Chat",
            desc: "Get an answer in minutes from our support team. Available around the clock.",
            action: "Start Chat",
            href: "#",
            primary: true,
          },
          {
            icon: Mail,
            title: "Email Support",
            desc: "Send us an email and we'll respond within 2 hours on average.",
            action: "Send Email",
            href: "mailto:support@pobble.host",
            primary: false,
          },
          {
            icon: BookOpen,
            title: "Documentation",
            desc: "Step-by-step guides for setup, mods, plugins, backups, and more.",
            action: "Browse Docs",
            href: "#",
            primary: false,
          },
        ].map((c) => (
          <div key={c.title} className="flex flex-col rounded-xl border border-white/[0.07] bg-[#131720] p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#00c98d]/10">
              <c.icon className="h-5 w-5 text-[#00c98d]" />
            </div>
            <h3 className="mt-4 text-base font-bold text-white">{c.title}</h3>
            <p className="mt-2 flex-1 text-sm text-[#a8b0c4] leading-relaxed">{c.desc}</p>
            <a
              href={c.href}
              className={`mt-5 inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-bold transition-colors ${
                c.primary
                  ? "bg-[#00c98d] text-white hover:bg-[#00e0a0]"
                  : "border border-white/[0.1] text-white hover:bg-white/[0.05]"
              }`}
            >
              <Zap className="mr-1.5 h-3.5 w-3.5" /> {c.action}
            </a>
          </div>
        ))}
      </div>

      {/* Sign-in prompt for ticket system */}
      <div className="flex flex-col items-center gap-5 rounded-2xl border border-[#00c98d]/15 bg-[#131720] px-8 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#00c98d]/10">
          <LifeBuoy className="h-7 w-7 text-[#00c98d]" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Submit a Support Ticket</h2>
          <p className="mt-2 text-sm text-[#a8b0c4] max-w-md mx-auto">
            Sign in to open and track support tickets directly with our team. We typically respond within a few hours.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 rounded-xl bg-[#00c98d] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#00e0a0] transition-colors"
          >
            <LogIn className="h-4 w-4" /> Sign In to Open Ticket
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl border border-white/[0.1] bg-white/[0.04] px-6 py-2.5 text-sm font-semibold text-white hover:bg-white/[0.08] transition-colors"
          >
            Create Account
          </Link>
        </div>
      </div>
    </div>
  );
}

/* ─── Authenticated ticket portal ──────────────────────────────────── */
function TicketPortal() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [tab, setTab] = useState<"open" | "closed">("open");

  const fetchTickets = useCallback(async () => {
    try {
      const res = await fetch("/api/tickets");
      if (res.ok) setTickets(await res.json());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  async function handleCreate() {
    if (!subject.trim() || !message.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message, priority }),
      });
      if (res.ok) {
        toast.success("Ticket submitted! We'll get back to you shortly.");
        setSubject(""); setMessage(""); setPriority("MEDIUM");
        setShowForm(false);
        await fetchTickets();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create ticket");
      }
    } catch { toast.error("Failed to create ticket"); }
    setCreating(false);
  }

  const openTickets   = tickets.filter((t) => !["RESOLVED", "CLOSED"].includes(t.status));
  const closedTickets = tickets.filter((t) =>  ["RESOLVED", "CLOSED"].includes(t.status));
  const displayTickets = tab === "open" ? openTickets : closedTickets;
  const waitingReply  = openTickets.filter((t) => t.status === "WAITING_REPLY").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Your Tickets</h2>
          <p className="mt-0.5 text-sm text-[#8b92a8]">We typically respond within a few hours</p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="inline-flex items-center gap-2 rounded-xl bg-[#00c98d] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#00e0a0] transition-colors"
        >
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? "Cancel" : "New Ticket"}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total",          value: tickets.length,    color: "text-white" },
          { label: "Open",           value: openTickets.length,color: "text-[#00c98d]" },
          { label: "Awaiting Reply", value: waitingReply,      color: waitingReply > 0 ? "text-orange-400" : "text-[#8b92a8]" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/[0.07] bg-[#131720] p-4">
            <p className="text-xs text-[#8b92a8]">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* New ticket form */}
      {showForm && (
        <div className="overflow-hidden rounded-xl border border-[#00c98d]/20 bg-[#00c98d]/[0.03]">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <div className="flex items-center gap-2">
              <LifeBuoy className="h-4 w-4 text-[#00c98d]" />
              <span className="text-sm font-semibold text-white">Open a New Ticket</span>
            </div>
            <button onClick={() => setShowForm(false)} className="rounded-md p-1 text-[#8b92a8] hover:text-white transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-4 p-5">
            <div className="flex items-start gap-2 rounded-lg border border-[#00c98d]/20 bg-[#00b07d]/[0.06] p-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#00c98d]" />
              <p className="text-xs text-[#4dd9ae]/90">Provide as much detail as possible — screenshots, error messages, and steps to reproduce help us resolve issues faster.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Subject <span className="text-red-400">*</span></label>
                <input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. Server won't start after restart"
                  className="w-full rounded-lg border border-white/[0.07] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-[#8b92a8]/60 outline-none focus:border-[#00c98d]/50 transition-colors"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-300">Priority</label>
                <div className="flex gap-1.5">
                  {(["LOW","MEDIUM","HIGH","CRITICAL"] as const).map((p) => {
                    const cfg = priorityConfig[p];
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={p}
                        onClick={() => setPriority(p)}
                        className={`flex flex-1 items-center justify-center gap-1 rounded-lg border px-2 py-2 text-xs font-medium transition-all ${
                          priority === p ? cfg.active : "border-white/[0.07] text-[#8b92a8] hover:border-white/20 hover:text-white"
                        }`}
                      >
                        <Icon className="h-3 w-3" />
                        <span className="hidden sm:inline">{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Description <span className="text-red-400">*</span></label>
              <textarea
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleCreate(); }}
                placeholder="Describe your issue in detail. Include any relevant server names, error messages, or steps you've already tried..."
                className="w-full resize-none rounded-lg border border-white/[0.07] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-[#8b92a8]/60 outline-none focus:border-[#00c98d]/50 transition-colors"
              />
              <p className="text-right text-[11px] text-[#8b92a8]">{message.length} chars · Ctrl+Enter to submit</p>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowForm(false)} className="rounded-lg px-4 py-2 text-sm text-[#8b92a8] hover:text-white transition-colors">
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating || !subject.trim() || !message.trim()}
                className="inline-flex items-center gap-2 rounded-lg bg-[#00c98d] px-5 py-2 text-sm font-bold text-white hover:bg-[#00e0a0] transition-colors disabled:opacity-40"
              >
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Submit Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket list */}
      <div className="overflow-hidden rounded-xl border border-white/[0.07] bg-[#131720]">
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
          <div className="flex gap-1 rounded-lg bg-white/[0.04] p-1">
            {(["open","closed"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-md px-4 py-1.5 text-xs font-medium transition-all ${
                  tab === t ? "bg-[#1e2333] text-white shadow-sm" : "text-[#8b92a8] hover:text-white"
                }`}
              >
                {t === "open" ? "Active" : "Closed"}
                {(t === "open" ? openTickets : closedTickets).length > 0 && (
                  <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    tab === t ? "bg-[#00c98d]/20 text-[#00c98d]" : "bg-white/[0.06] text-[#8b92a8]"
                  }`}>{(t === "open" ? openTickets : closedTickets).length}</span>
                )}
              </button>
            ))}
          </div>
          <span className="text-xs text-[#8b92a8]">{displayTickets.length} ticket{displayTickets.length !== 1 ? "s" : ""}</span>
        </div>

        <div className="divide-y divide-white/[0.04]">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 animate-spin text-[#8b92a8]" />
            </div>
          ) : displayTickets.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/[0.07] bg-white/[0.03]">
                <MessageSquare className="h-6 w-6 text-[#8b92a8]" />
              </div>
              <p className="text-sm font-medium text-white">
                {tab === "open" ? "No active tickets" : "No closed tickets"}
              </p>
              <p className="mt-1 text-xs text-[#8b92a8]">
                {tab === "open" ? "Need help? Open a new ticket above." : "Resolved tickets will appear here."}
              </p>
            </div>
          ) : displayTickets.map((ticket) => {
            const sCfg = statusConfig[ticket.status] ?? statusConfig.OPEN;
            const pCfg = priorityConfig[ticket.priority] ?? priorityConfig.MEDIUM;
            const StatusIcon = sCfg.icon;
            const isWaiting = ticket.status === "WAITING_REPLY";
            return (
              <Link
                key={ticket.id}
                href={`/dashboard/support/${ticket.id}`}
                className={`group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.025] ${isWaiting ? "border-l-2 border-orange-400/60" : ""}`}
              >
                <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${isWaiting ? "bg-orange-500/10" : "bg-white/[0.04]"}`}>
                  <StatusIcon className={`h-4 w-4 ${isWaiting ? "text-orange-400" : "text-[#8b92a8]"}`} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-white group-hover:text-[#00c98d] transition-colors">{ticket.subject}</p>
                    {isWaiting && <span className="shrink-0 rounded-full bg-orange-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-orange-400 border border-orange-500/20">Reply</span>}
                  </div>
                  <p className="mt-0.5 text-xs text-[#8b92a8]">
                    {ticket._count.messages} {ticket._count.messages === 1 ? "message" : "messages"} · Updated {timeAgo(ticket.updatedAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${pCfg.className}`}>{pCfg.label}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${sCfg.className}`}>
                    <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${sCfg.dot}`} />
                    {sCfg.label}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-[#8b92a8] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      <p className="text-center text-xs text-[#8b92a8]">
        Tickets are also available in your{" "}
        <Link href="/dashboard/support" className="text-[#00c98d] hover:underline">dashboard</Link>.
      </p>
    </div>
  );
}

/* ─── Root export ───────────────────────────────────────────────────── */
export function SupportClient() {
  const { data: session, isPending } = useSession();

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[#8b92a8]" />
      </div>
    );
  }

  return session ? <TicketPortal /> : <GuestView />;
}
