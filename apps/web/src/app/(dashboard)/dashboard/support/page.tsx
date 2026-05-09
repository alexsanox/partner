"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Info, Plus, MessageSquare, Loader2, ArrowRight } from "lucide-react";
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

export default function SupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
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
        setSubject("");
        setMessage("");
        setPriority("MEDIUM");
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

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Support</h1>
        <p className="mt-1 text-sm text-slate-400">
          Create a ticket or check the status of existing requests
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Create Ticket */}
        <div className="lg:col-span-2">
          <Card className="border-white/5 bg-white/[0.02]">
            <CardHeader className="p-5 pb-0">
              <h2 className="text-lg font-semibold text-white">Open a Ticket</h2>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
                <div className="flex items-start gap-2">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                  <p className="text-xs text-blue-300">
                    Provide as much detail as possible for a faster response.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Subject</Label>
                <Input
                  placeholder="Brief description of your issue"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="border-white/[0.07] bg-white/[0.04] text-white placeholder:text-[#8b92a8]"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Priority</Label>
                <div className="flex gap-2">
                  {(["LOW", "MEDIUM", "HIGH", "CRITICAL"] as const).map((p) => {
                    const cfg = priorityConfig[p];
                    return (
                      <button
                        key={p}
                        onClick={() => setPriority(p)}
                        className={`rounded-md border px-3 py-1.5 text-xs font-medium transition-all ${
                          priority === p
                            ? cfg.className + " ring-1 ring-white/20"
                            : "border-white/[0.07] text-[#8b92a8] hover:border-white/20"
                        }`}
                      >
                        {cfg.label}
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-300">Description</Label>
                <Textarea
                  placeholder="Describe your issue in detail..."
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="border-white/[0.07] bg-white/[0.04] text-white placeholder:text-[#8b92a8] resize-none"
                />
              </div>
              <Button
                onClick={handleCreate}
                disabled={creating || !subject.trim() || !message.trim()}
                className="w-full bg-[#5b8cff] text-white hover:bg-[#4a7aee] disabled:opacity-50"
              >
                {creating ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Submit Ticket
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Tickets List */}
        <div className="lg:col-span-3">
          <Card className="border-white/5 bg-white/[0.02]">
            <CardHeader className="flex flex-row items-center justify-between p-5 pb-0">
              <h2 className="text-lg font-semibold text-white">My Tickets</h2>
              <span className="text-xs text-[#8b92a8]">{tickets.length} total</span>
            </CardHeader>
            <CardContent className="p-5">
              {/* Tabs */}
              <div className="flex gap-1 rounded-lg bg-white/[0.04] p-1">
                <button
                  onClick={() => setTab("open")}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                    tab === "open" ? "bg-[#232839] text-white" : "text-[#8b92a8] hover:text-white"
                  }`}
                >
                  Open ({openTickets.length})
                </button>
                <button
                  onClick={() => setTab("closed")}
                  className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-all ${
                    tab === "closed" ? "bg-[#232839] text-white" : "text-[#8b92a8] hover:text-white"
                  }`}
                >
                  Closed ({closedTickets.length})
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-[#8b92a8]" />
                  </div>
                ) : displayTickets.length === 0 ? (
                  <div className="flex flex-col items-center py-12 text-center">
                    <MessageSquare className="mb-3 h-10 w-10 text-slate-600" />
                    <p className="text-sm text-[#8b92a8]">
                      {tab === "open" ? "No open tickets" : "No closed tickets"}
                    </p>
                  </div>
                ) : (
                  displayTickets.map((ticket) => {
                    const sCfg = statusConfig[ticket.status] ?? statusConfig.OPEN;
                    return (
                      <Link
                        key={ticket.id}
                        href={`/dashboard/support/${ticket.id}`}
                        className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-4 transition-colors hover:border-white/10 hover:bg-white/[0.04]"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-[#5b8cff]" />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-white">
                              {ticket.subject}
                            </p>
                            <p className="mt-0.5 text-xs text-[#8b92a8]">
                              {ticket._count.messages} messages · Updated {timeAgo(ticket.updatedAt)}
                            </p>
                          </div>
                        </div>
                        <div className="ml-3 flex shrink-0 items-center gap-2">
                          <Badge variant="outline" className={sCfg.className}>
                            {sCfg.label}
                          </Badge>
                          <ArrowRight className="h-3.5 w-3.5 text-[#8b92a8]" />
                        </div>
                      </Link>
                    );
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
