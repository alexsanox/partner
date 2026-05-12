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
import { MoreHorizontal, ShieldCheck, ShieldOff, Trash2, Loader2, UserRound } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm-dialog";
import { authClient } from "@/lib/auth-client";

interface UserActionsProps {
  userId: string;
  userName: string;
  currentRole: string;
  isSelf: boolean;
}

export function UserActions({ userId, userName, currentRole, isSelf }: UserActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { confirm } = useConfirm();

  async function handleAction(action: string) {
    if (action === "deleteUser") {
      const ok = await confirm({ title: "Delete User", description: `Delete user "${userName}"? This cannot be undone.`, confirmLabel: "Delete", variant: "destructive" });
      if (!ok) return;
    }

    if (action === "impersonate") {
      const ok = await confirm({
        title: `Impersonate ${userName}?`,
        description: "You will be signed in as this user. You can stop impersonating from the dashboard.",
        confirmLabel: "Impersonate",
        variant: "default",
      });
      if (!ok) return;

      setLoading(true);
      try {
        const { error } = await authClient.admin.impersonateUser({ userId });
        if (error) {
          toast.error(error.message ?? "Impersonation failed");
          return;
        }
        toast.success(`Now impersonating ${userName}`);
        router.push("/dashboard");
      } catch {
        toast.error("Impersonation failed");
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
      });
      if (res.ok) {
        toast.success(action === "deleteUser" ? "User deleted" : "Role updated");
      } else {
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

  if (isSelf) return null;

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
          onClick={() => handleAction("impersonate")}
          className="text-xs text-blue-400 focus:text-blue-300 focus:bg-blue-500/10"
        >
          <UserRound className="mr-2 h-3.5 w-3.5" />
          Impersonate
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/[0.06]" />
        <DropdownMenuItem
          onClick={() => handleAction("toggleRole")}
          className="text-xs"
        >
          {currentRole === "ADMIN" ? (
            <><ShieldOff className="mr-2 h-3.5 w-3.5" />Remove Admin</>
          ) : (
            <><ShieldCheck className="mr-2 h-3.5 w-3.5" />Make Admin</>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator className="bg-white/[0.06]" />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => handleAction("deleteUser")}
          className="text-xs"
        >
          <Trash2 className="mr-2 h-3.5 w-3.5" />
          Delete User
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
