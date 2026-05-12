"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft, Loader2, Send, User, Headphones,
  AlertCircle, Clock, CheckCircle2, XCircle, AlertTriangle, Lock,
  Hash, Flame, Minus,
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

const statusConfig: Record<string, { label: string; icon: React.ElementType; className: string; dot: string; banner?: string }> = {
  OPEN: { label: "Open", icon: AlertCircle, className: "bg-blue-500/10 text-blue-400 border-blue-500/20", dot: "bg-blue-400" },
  IN_PROGRESS: { label: "In Progress", icon: Clock, className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20", dot: "bg-yellow-400" },
  WAITING_REPLY: { label: "Waiting Reply", icon: AlertTriangle, className: "bg-orange-500/10 text-orange-400 border-orange-500/20", dot: "bg-orange-400 animate-pulse", banner: "Our team has replied and is waiting for your response." },
  RESOLVED: { label: "Resolved", icon: CheckCircle2, className: "bg-green-500/10 text-green-400 border-green-500/20", dot: "bg-green-400" },
  CLOSED: { label: "Closed", icon: XCircle, className: "bg-slate-500/10 text-slate-400 border-slate-500/20", dot: "bg-slate-500" },
};

const priorityConfig: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  LOW: { label: "Low", icon: Minus, className: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  MEDIUM: { label: "Medium", icon: AlertCircle, className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  HIGH: { label: "High", icon: AlertTriangle, className: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  CRITICAL: { label: "Critical", icon: Flame, className: "bg-red-500/10 text-red-400 border-red-500/20" },
};

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [ticket, setTicket] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEnd = useRef<HTMLDivElement>(null);

  const fetchTicket = useCallback(async () => {
    try {
      const res = await fetch(`/api/tickets/${id}`);
      if (res.ok) {
        setTicket(await res.json());
      } else {
        router.push("/dashboard/support");
      }
    } catch {
      router.push("/dashboard/support");
    }
    setLoading(false);
  }, [id, router]);

  useEffect(() => { fetchTicket(); }, [fetchTicket]);
  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "smooth" });
  }, [ticket?.messages.length]);

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
        toast.success("Reply sent.");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to send reply");
      }
    } catch {
      toast.error("Failed to send reply");
    }
    setSending(false);
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
  const PriorityIcon = pCfg.icon;
  const StatusIcon = sCfg.icon;
  const isClosed = ticket.status === "CLOSED" || ticket.status === "RESOLVED";
  const isWaiting = ticket.status === "WAITING_REPLY";

  function formatDate(date: string) {
    return new Date(date).toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric",
      hour: "numeric", minute: "2-digit",
    });
  }

  function formatShort(date: string) {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link
          href="/dashboard/support"
          className="mt-1 shrink-0 rounded-lg p-1.5 text-[#8b92a8] hover:bg-white/[0.05] hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-lg font-bold text-white">{ticket.subject}</h1>
            <Badge variant="outline" className={`text-[11px] ${pCfg.className}`}>
              <PriorityIcon className="mr-1 h-3 w-3" />
              {pCfg.label}
            </Badge>
            <Badge variant="outline" className={`text-[11px] ${sCfg.className}`}>
              <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${sCfg.dot}`} />
              {sCfg.label}
            </Badge>
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-[#8b92a8]">
            <span className="flex items-center gap-1"><Hash className="h-3 w-3" />{ticket.id.slice(0, 10)}</span>
            <span>Opened {formatDate(ticket.createdAt)}</span>
            <span>{ticket.messages.length} {ticket.messages.length === 1 ? "message" : "messages"}</span>
          </div>
        </div>
      </div>

      {/* Waiting reply banner */}
      {isWaiting && (
        <div className="flex items-start gap-3 rounded-xl border border-orange-500/20 bg-orange-500/[0.07] px-4 py-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
          <p className="text-sm text-orange-300">{sCfg.banner}</p>
        </div>
      )}

      {/* Messages thread */}
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.015] divide-y divide-white/[0.04]">
        {ticket.messages.map((msg, idx) => (
          <div
            key={msg.id}
            className={`flex gap-4 px-5 py-5 ${msg.isStaff ? "bg-[#5b8cff]/[0.03]" : ""}`}
          >
            <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
              msg.isStaff
                ? "bg-gradient-to-br from-[#5b8cff]/30 to-[#7c3aed]/20 text-[#5b8cff]"
                : "bg-white/[0.08] text-white"
            }`}>
              {msg.isStaff ? <Headphones className="h-3.5 w-3.5" /> : <User className="h-3.5 w-3.5" />}
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex items-center gap-2">
                <span className={`text-xs font-semibold ${msg.isStaff ? "text-[#5b8cff]" : "text-white"}`}>
                  {msg.isStaff ? "Support Team" : "You"}
                </span>
                {msg.isStaff && (
                  <span className="rounded-full border border-[#5b8cff]/20 bg-[#5b8cff]/10 px-1.5 py-0.5 text-[10px] font-medium text-[#5b8cff]">Staff</span>
                )}
                <span className="ml-auto text-xs text-[#8b92a8]" title={formatDate(msg.createdAt)}>{formatShort(msg.createdAt)}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#c8cdd8]">{msg.content}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEnd} />
      </div>

      {/* Reply / closed state */}
      {isClosed ? (
        <div className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-5 py-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-500/10">
            <Lock className="h-4 w-4 text-slate-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-300">
              {ticket.status === "RESOLVED" ? "Ticket resolved" : "Ticket closed"}
            </p>
            <p className="text-xs text-[#8b92a8]">
              {ticket.status === "RESOLVED"
                ? "This issue has been resolved. Open a new ticket if you need further help."
                : "This ticket is closed. Open a new ticket if you need further assistance."}
            </p>
          </div>
          <Link href="/dashboard/support" className="ml-auto shrink-0">
            <Button size="sm" variant="outline" className="border-white/[0.07] text-[#8b92a8] hover:text-white text-xs">
              New Ticket
            </Button>
          </Link>
        </div>
      ) : (
        <div className="rounded-xl border border-white/[0.07] bg-white/[0.02] p-4">
          <Textarea
            placeholder="Type your reply... Be as detailed as possible."
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            rows={4}
            className="border-white/[0.07] bg-white/[0.04] text-white placeholder:text-[#8b92a8] resize-none focus:border-[#5b8cff]/40"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleReply();
            }}
          />
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-[#8b92a8]">
              <kbd className="rounded border border-white/10 bg-white/[0.05] px-1.5 py-0.5 font-mono text-[10px]">Ctrl+Enter</kbd>
              <span className="ml-1.5">to send</span>
            </p>
            <Button
              onClick={handleReply}
              disabled={sending || !reply.trim()}
              className="bg-[#5b8cff] text-white hover:bg-[#4a7aee] disabled:opacity-50"
            >
              {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
              Send Reply
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
