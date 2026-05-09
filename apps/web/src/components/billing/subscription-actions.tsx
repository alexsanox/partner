"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, XCircle, RotateCcw } from "lucide-react";

export function CancelButton({ serviceId, cancelling: initialCancelling }: { serviceId: string; cancelling: boolean }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (initialCancelling) {
    return <ReactivateButton serviceId={serviceId} />;
  }

  if (showConfirm) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#8b92a8]">Cancel at period end?</span>
        <button
          onClick={async () => {
            setLoading(true);
            try {
              const res = await fetch("/api/billing/cancel", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ serviceId }),
              });
              if (res.ok) router.refresh();
            } finally {
              setLoading(false);
              setShowConfirm(false);
            }
          }}
          disabled={loading}
          className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Yes, Cancel"}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="rounded-lg bg-white/5 px-3 py-1.5 text-xs font-semibold text-[#8b92a8] hover:text-white transition-colors"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-[#8b92a8] hover:text-red-400 hover:bg-red-500/5 transition-colors"
    >
      <XCircle className="h-3 w-3" />
      Cancel
    </button>
  );
}

function ReactivateButton({ serviceId }: { serviceId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <button
      onClick={async () => {
        setLoading(true);
        try {
          const res = await fetch("/api/billing/reactivate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ serviceId }),
          });
          if (res.ok) router.refresh();
        } finally {
          setLoading(false);
        }
      }}
      disabled={loading}
      className="flex items-center gap-1.5 rounded-lg bg-green-500/10 border border-green-500/20 px-3 py-1.5 text-xs font-semibold text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RotateCcw className="h-3 w-3" />}
      Reactivate
    </button>
  );
}
