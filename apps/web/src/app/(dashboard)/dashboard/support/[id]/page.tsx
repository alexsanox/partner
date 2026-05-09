"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Loader2, Send, User, Headphones } from "lucide-react";
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <Link
            href="/dashboard/support"
            className="mt-1 rounded-md p-1.5 text-[#8b92a8] hover:bg-white/[0.04] hover:text-white transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">{ticket.subject}</h1>
            <p className="mt-0.5 text-xs text-[#8b92a8]">
              Opened {formatDate(ticket.createdAt)}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={pCfg.className}>{pCfg.label}</Badge>
          <Badge variant="outline" className={sCfg.className}>{sCfg.label}</Badge>
        </div>
      </div>

      {/* Messages */}
      <div className="space-y-4">
        {ticket.messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.isStaff ? "" : ""}`}
          >
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
                    {msg.isStaff ? "Support Team" : "You"}
                  </span>
                  <span className="text-xs text-[#8b92a8]">{formatDate(msg.createdAt)}</span>
                </div>
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#c8cdd8]">{msg.content}</p>
              </CardContent>
            </Card>
          </div>
        ))}
        <div ref={messagesEnd} />
      </div>

      {/* Reply box */}
      {!isClosed ? (
        <Card className="border-white/5 bg-white/[0.02]">
          <CardContent className="p-4">
            <Textarea
              placeholder="Type your reply..."
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={3}
              className="border-white/[0.07] bg-white/[0.04] text-white placeholder:text-[#8b92a8] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleReply();
              }}
            />
            <div className="mt-3 flex items-center justify-between">
              <p className="text-xs text-[#8b92a8]">Press Ctrl+Enter to send</p>
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
            <p className="text-sm text-[#8b92a8]">This ticket is closed. Open a new ticket if you need further assistance.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
