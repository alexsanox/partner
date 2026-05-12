"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus, MessageSquare, Loader2, ArrowRight, X,
  AlertCircle, Clock, CheckCircle2, XCircle, Flame, AlertTriangle,
  Minus, LifeBuoy, Send, Info,
} from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

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
  OPEN: { label: "Open", icon: AlertCircle, className: "bg-[#00b07d]/10 text-[#00c98d] border-[#00c98d]/20", dot: "bg-blue-400" },
  IN_PROGRESS: { label: "In Progress", icon: Clock, className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", dot: "bg-yellow-400" },
  WAITING_REPLY: { label: "Waiting Reply", icon: AlertTriangle, className: "bg-orange-500/10 text-orange-400 border-orange-500/20", dot: "bg-orange-400 animate-pulse" },
  RESOLVED: { label: "Resolved", icon: CheckCircle2, className: "bg-green-500/10 text-green-400 border-green-500/20", dot: "bg-green-400" },
  CLOSED: { label: "Closed", icon: XCircle, className: "bg-slate-500/10 text-slate-400 border-slate-500/20", dot: "bg-slate-500" },
};

const priorityConfig: Record<string, { label: string; icon: React.ElementType; className: string; active: string }> = {
  LOW: { label: "Low", icon: Minus, className: "border-slate-500/30 text-slate-400", active: "bg-slate-500/15 border-slate-400/40 text-slate-300 ring-1 ring-slate-400/20" },
  MEDIUM: { label: "Medium", icon: AlertCircle, className: "border-[#00c98d]/30 text-[#00c98d]", active: "bg-[#00b07d]/15 border-[#00c98d]/40 text-[#4dd9ae] ring-1 ring-blue-400/20" },
  HIGH: { label: "High", icon: AlertTriangle, className: "border-orange-500/30 text-orange-400", active: "bg-orange-500/15 border-orange-400/40 text-orange-300 ring-1 ring-orange-400/20" },
  CRITICAL: { label: "Critical", icon: Flame, className: "border-red-500/30 text-red-400", active: "bg-red-500/15 border-red-400/40 text-red-300 ring-1 ring-red-400/20" },
};

export default function SupportPage() {
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
        setSubject("");
        setMessage("");
        setPriority("MEDIUM");
        setShowForm(false);
        await fetchTickets();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to create ticket");
      }
    } catch {
      toast.error("Failed to create ticket");
    }
    setCreating(false);
  }

  const openTickets = tickets.filter((t) => !["RESOLVED", "CLOSED"].includes(t.status));
  const closedTickets = tickets.filter((t) => ["RESOLVED", "CLOSED"].includes(t.status));
  const displayTickets = tab === "open" ? openTickets : closedTickets;
  const waitingReply = openTickets.filter((t) => t.status === "WAITING_REPLY").length;

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Support</h1>
          <p className="mt-1 text-sm text-[#8b92a8]">Get help from our team — we typically respond within a few hours</p>
        </div>
        <Button
          onClick={() => setShowForm((v) => !v)}
          className="bg-[#00c98d] text-white hover:bg-[#4a7aee] shrink-0"
        >
          {showForm ? <X className="mr-2 h-4 w-4" /> : <Plus className="mr-2 h-4 w-4" />}
          {showForm ? "Cancel" : "New Ticket"}
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Tickets", value: tickets.length, color: "text-white" },
          { label: "Open", value: openTickets.length, color: "text-[#00c98d]" },
          { label: "Awaiting Reply", value: waitingReply, color: waitingReply > 0 ? "text-orange-400" : "text-[#8b92a8]" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
            <p className="text-xs text-[#8b92a8]">{s.label}</p>
            <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* New Ticket Form */}
      {showForm && (
        <div className="overflow-hidden rounded-xl border border-[#00c98d]/20 bg-[#00c98d]/[0.03]">
          <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
            <div className="flex items-center gap-2">
              <LifeBuoy className="h-4 w-4 text-[#00c98d]" />
              <h2 className="text-sm font-semibold text-white">Open a New Ticket</h2>
            </div>
            <button onClick={() => setShowForm(false)} className="rounded-md p-1 text-[#8b92a8] hover:text-white transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-4 p-5">
            <div className="rounded-lg border border-[#00c98d]/20 bg-[#00b07d]/[0.06] p-3">
              <div className="flex items-start gap-2">
                <Info className="mt-0.5 h-4 w-4 shrink-0 text-[#00c98d]" />
                <p className="text-xs text-[#4dd9ae]/90">Provide as much detail as possible — screenshots, error messages, and steps to reproduce help us resolve issues faster.</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-sm text-slate-300">Subject <span className="text-red-400">*</span></Label>
                <Input
                  placeholder="e.g. Server won't start after restart"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="border-white/[0.07] bg-white/[0.04] text-white placeholder:text-[#8b92a8] focus:border-[#00c98d]/50"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-slate-300">Priority</Label>
                <div className="flex gap-1.5">
                  {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((p) => {
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
              <Label className="text-sm text-slate-300">Description <span className="text-red-400">*</span></Label>
              <Textarea
                placeholder="Describe your issue in detail. Include any relevant server names, error messages, or steps you've already tried..."
                rows={5}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleCreate(); }}
                className="border-white/[0.07] bg-white/[0.04] text-white placeholder:text-[#8b92a8] resize-none focus:border-[#00c98d]/50"
              />
              <p className="text-right text-[11px] text-[#8b92a8]">{message.length} chars · Ctrl+Enter to submit</p>
            </div>

            <div className="flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={() => setShowForm(false)} className="text-[#8b92a8] hover:text-white">
                Cancel
              </Button>
              <Button
                onClick={handleCreate}
                disabled={creating || !subject.trim() || !message.trim()}
                className="bg-[#00c98d] text-white hover:bg-[#4a7aee] disabled:opacity-50"
              >
                {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Submit Ticket
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tickets List */}
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.02]">
        {/* Tabs */}
        <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
          <div className="flex gap-1 rounded-lg bg-white/[0.04] p-1">
            <button
              onClick={() => setTab("open")}
              className={`relative rounded-md px-4 py-1.5 text-xs font-medium transition-all ${
                tab === "open" ? "bg-[#1e2333] text-white shadow-sm" : "text-[#8b92a8] hover:text-white"
              }`}
            >
              Active
              {openTickets.length > 0 && (
                <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  tab === "open" ? "bg-[#00c98d]/20 text-[#00c98d]" : "bg-white/[0.06] text-[#8b92a8]"
                }`}>{openTickets.length}</span>
              )}
            </button>
            <button
              onClick={() => setTab("closed")}
              className={`rounded-md px-4 py-1.5 text-xs font-medium transition-all ${
                tab === "closed" ? "bg-[#1e2333] text-white shadow-sm" : "text-[#8b92a8] hover:text-white"
              }`}
            >
              Closed
              {closedTickets.length > 0 && (
                <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                  tab === "closed" ? "bg-white/10 text-white" : "bg-white/[0.06] text-[#8b92a8]"
                }`}>{closedTickets.length}</span>
              )}
            </button>
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
          ) : (
            displayTickets.map((ticket) => {
              const sCfg = statusConfig[ticket.status] ?? statusConfig.OPEN;
              const pCfg = priorityConfig[ticket.priority] ?? priorityConfig.MEDIUM;
              const StatusIcon = sCfg.icon;
              const isWaiting = ticket.status === "WAITING_REPLY";
              return (
                <Link
                  key={ticket.id}
                  href={`/dashboard/support/${ticket.id}`}
                  className={`group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-white/[0.025] ${
                    isWaiting ? "border-l-2 border-orange-400/60" : ""
                  }`}
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                    isWaiting ? "bg-orange-500/10" : "bg-white/[0.04]"
                  }`}>
                    <StatusIcon className={`h-4 w-4 ${isWaiting ? "text-orange-400" : "text-[#8b92a8]"}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-white group-hover:text-[#00c98d] transition-colors">
                        {ticket.subject}
                      </p>
                      {isWaiting && (
                        <span className="shrink-0 rounded-full bg-orange-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-orange-400 border border-orange-500/20">Reply</span>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-[#8b92a8]">
                      {ticket._count.messages} {ticket._count.messages === 1 ? "message" : "messages"} · Updated {timeAgo(ticket.updatedAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="outline" className={`text-[11px] ${pCfg.className}`}>{pCfg.label}</Badge>
                    <Badge variant="outline" className={`text-[11px] ${sCfg.className}`}>
                      <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${sCfg.dot}`} />
                      {sCfg.label}
                    </Badge>
                    <ArrowRight className="h-3.5 w-3.5 text-[#8b92a8] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
