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
import { MoreHorizontal, ShieldCheck, ShieldOff, Trash2, Loader2 } from "lucide-react";

interface UserActionsProps {
  userId: string;
  userName: string;
  currentRole: string;
  isSelf: boolean;
}

export function UserActions({ userId, userName, currentRole, isSelf }: UserActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleAction(action: string) {
    if (action === "deleteUser" && !confirm(`Delete user "${userName}"? This cannot be undone.`)) {
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, action }),
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

  if (isSelf) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#8b92a8] hover:text-white hover:bg-[#232839] transition-colors">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-[#232839]">
        <DropdownMenuItem
          onClick={() => handleAction("toggleRole")}
        >
          {currentRole === "ADMIN" ? (
            <>
              <ShieldOff className="mr-2 h-4 w-4" />
              Remove Admin
            </>
          ) : (
            <>
              <ShieldCheck className="mr-2 h-4 w-4" />
              Make Admin
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => handleAction("deleteUser")}
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete User
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
