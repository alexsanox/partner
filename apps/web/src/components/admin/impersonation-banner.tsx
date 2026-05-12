"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { ShieldAlert, X, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ImpersonationBannerProps {
  userName: string;
}

export function ImpersonationBanner({ userName }: ImpersonationBannerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function stopImpersonating() {
    setLoading(true);
    try {
      await authClient.admin.stopImpersonating();
      toast.success("Returned to your admin account");
      router.push("/admin/users");
      router.refresh();
    } catch {
      toast.error("Failed to stop impersonating");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 bg-amber-500/10 border-b border-amber-500/20 px-6 py-2.5">
      <div className="flex items-center gap-2 text-sm text-amber-400">
        <ShieldAlert className="h-4 w-4 shrink-0" />
        <span>
          You are impersonating <strong className="text-amber-300">{userName}</strong> — actions taken here are on their behalf.
        </span>
      </div>
      <button
        onClick={stopImpersonating}
        disabled={loading}
        className="flex items-center gap-1.5 rounded-md bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 px-3 py-1 text-xs font-medium text-amber-300 transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
        Stop impersonating
      </button>
    </div>
  );
}
