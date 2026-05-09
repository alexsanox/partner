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
import { MoreHorizontal, Pause, Play, XCircle, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm-dialog";

interface ServiceActionsProps {
  serviceId: string;
  serviceName: string;
  currentStatus: string;
}

export function ServiceActions({ serviceId, serviceName, currentStatus }: ServiceActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { confirm } = useConfirm();

  async function handleAction(action: string) {
    if (action === "delete" || action === "cancel") {
      const label = action === "delete" ? "Delete" : "Cancel";
      const ok = await confirm({ title: `${label} Service`, description: `${label} service "${serviceName}"?`, confirmLabel: label, variant: "destructive" });
      if (!ok) return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/services", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId, action }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Action failed");
      }
      router.refresh();
    } catch {
      toast.error("Action failed");
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
        {currentStatus === "ACTIVE" && (
          <DropdownMenuItem onClick={() => handleAction("suspend")}>
            <Pause className="mr-2 h-4 w-4" />
            Suspend
          </DropdownMenuItem>
        )}
        {currentStatus === "SUSPENDED" && (
          <DropdownMenuItem onClick={() => handleAction("unsuspend")}>
            <Play className="mr-2 h-4 w-4" />
            Unsuspend
          </DropdownMenuItem>
        )}
        {currentStatus !== "CANCELLED" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => handleAction("cancel")}>
              <XCircle className="mr-2 h-4 w-4" />
              Cancel
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuItem variant="destructive" onClick={() => handleAction("delete")}>
          <Trash2 className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
