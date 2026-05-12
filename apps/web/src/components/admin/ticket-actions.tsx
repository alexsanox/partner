"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal, CheckCircle, XCircle, RotateCcw, Loader2,
  Clock, ExternalLink,
} from "lucide-react";
import { toast } from "sonner";

interface TicketActionsProps {
  ticketId: string;
  currentStatus: string;
}

const actionLabels: Record<string, string> = {
  resolve:     "Ticket resolved",
  close:       "Ticket closed",
  reopen:      "Ticket reopened",
  in_progress: "Marked as in progress",
};

export function TicketActions({ ticketId, currentStatus }: TicketActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleAction(action: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tickets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, action }),
      });
      if (res.ok) {
        toast.success(actionLabels[action] ?? "Done");
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Action failed");
      }
    } catch {
      toast.error("Action failed");
    } finally {
      setLoading(false);
    }
  }

  const isActive = !["RESOLVED", "CLOSED"].includes(currentStatus);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={loading}
        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-[#8b92a8] hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <MoreHorizontal className="h-3.5 w-3.5" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44 border-white/[0.08] bg-[#1a1f2e] shadow-xl">
        <DropdownMenuItem
          onClick={() => router.push(`/admin/tickets/${ticketId}`)}
          className="text-xs"
        >
          <ExternalLink className="mr-2 h-3.5 w-3.5" />
          View Ticket
        </DropdownMenuItem>

        <DropdownMenuSeparator className="bg-white/[0.06]" />

        {isActive && currentStatus !== "IN_PROGRESS" && (
          <DropdownMenuItem
            onClick={() => handleAction("in_progress")}
            className="text-xs text-yellow-400 focus:text-yellow-300 focus:bg-yellow-500/10"
          >
            <Clock className="mr-2 h-3.5 w-3.5" />
            Mark In Progress
          </DropdownMenuItem>
        )}

        {isActive && (
          <DropdownMenuItem
            onClick={() => handleAction("resolve")}
            className="text-xs text-green-400 focus:text-green-300 focus:bg-green-500/10"
          >
            <CheckCircle className="mr-2 h-3.5 w-3.5" />
            Resolve
          </DropdownMenuItem>
        )}

        {!isActive && (
          <DropdownMenuItem
            onClick={() => handleAction("reopen")}
            className="text-xs text-[#00c98d] focus:text-[#4dd9ae] focus:bg-[#00b07d]/10"
          >
            <RotateCcw className="mr-2 h-3.5 w-3.5" />
            Reopen
          </DropdownMenuItem>
        )}

        {isActive && (
          <>
            <DropdownMenuSeparator className="bg-white/[0.06]" />
            <DropdownMenuItem
              onClick={() => handleAction("close")}
              className="text-xs text-red-400 focus:text-red-300 focus:bg-red-500/10"
            >
              <XCircle className="mr-2 h-3.5 w-3.5" />
              Close Ticket
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
