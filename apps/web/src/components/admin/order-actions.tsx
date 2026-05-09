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
import { MoreHorizontal, CheckCircle, RotateCcw, XCircle, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm-dialog";

interface OrderActionsProps {
  orderId: string;
  currentStatus: string;
  hasService: boolean;
}

export function OrderActions({ orderId, currentStatus, hasService }: OrderActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { confirm } = useConfirm();

  async function handleAction(action: string) {
    if (action === "delete") {
      const ok = await confirm({ title: "Delete Order", description: "Delete this order? This cannot be undone.", confirmLabel: "Delete", variant: "destructive" });
      if (!ok) return;
    }
    if (action === "refund") {
      const ok = await confirm({ title: "Refund Order", description: "Mark this order as refunded?", confirmLabel: "Refund", variant: "destructive" });
      if (!ok) return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/orders", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, action }),
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
        {currentStatus !== "PAID" && currentStatus !== "REFUNDED" && currentStatus !== "CANCELLED" && (
          <DropdownMenuItem onClick={() => handleAction("markPaid")}>
            <CheckCircle className="mr-2 h-4 w-4" />
            Mark as Paid
          </DropdownMenuItem>
        )}
        {currentStatus === "PAID" && (
          <DropdownMenuItem onClick={() => handleAction("refund")}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Refund
          </DropdownMenuItem>
        )}
        {currentStatus !== "CANCELLED" && currentStatus !== "REFUNDED" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" onClick={() => handleAction("cancel")}>
              <XCircle className="mr-2 h-4 w-4" />
              Cancel Order
            </DropdownMenuItem>
          </>
        )}
        {!hasService && (
          <DropdownMenuItem variant="destructive" onClick={() => handleAction("delete")}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Order
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
