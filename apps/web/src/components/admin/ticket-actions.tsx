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
import { MoreHorizontal, CheckCircle, XCircle, RotateCcw, Loader2 } from "lucide-react";

interface TicketActionsProps {
  ticketId: string;
  currentStatus: string;
}

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
      if (!res.ok) {
        const data = await res.json();
        alert(data.error || "Action failed");
      }
      router.refresh();
    } catch {
      alert("Action failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#8b92a8] hover:text-white hover:bg-[#232839] transition-colors">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-[#232839]">
        {(currentStatus === "OPEN" || currentStatus === "IN_PROGRESS" || currentStatus === "WAITING_REPLY") && (
          <DropdownMenuItem onClick={() => handleAction("resolve")}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Resolve
          </DropdownMenuItem>
        )}
        {(currentStatus === "CLOSED" || currentStatus === "RESOLVED") && (
          <DropdownMenuItem onClick={() => handleAction("reopen")}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Reopen
          </DropdownMenuItem>
        )}
        {currentStatus !== "CLOSED" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => handleAction("close")}>
              <XCircle className="mr-2 h-4 w-4" />
              Close
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
