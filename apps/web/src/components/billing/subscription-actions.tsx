"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, XCircle, RotateCcw, ArrowUpCircle, Check, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface Plan {
  id: string;
  name: string;
  priceMonthly: number;
  ramMb: number;
  cpuPercent: number;
  diskMb: number;
}

function fmtMb(mb: number) {
  return mb >= 1024 ? `${(mb / 1024).toFixed(0)} GB` : `${mb} MB`;
}

export function UpgradeButton({ serviceId, currentPlanId, currentPriceMonthly, availablePlans }: {
  serviceId: string;
  currentPlanId: string;
  currentPriceMonthly: number;
  availablePlans: Plan[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const upgradablePlans = availablePlans.filter((p) => p.priceMonthly > currentPriceMonthly);
  if (upgradablePlans.length === 0) return null;

  async function upgrade(planId: string) {
    setLoading(planId);
    try {
      const res = await fetch("/api/billing/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId, newPlanId: planId }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Upgrade failed");
      } else {
        toast.success(`Upgraded to ${data.newPlan.name}! Prorated charge applied.`);
        setOpen(false);
        router.refresh();
      }
    } catch {
      toast.error("Upgrade failed");
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 rounded-lg bg-[#00c98d]/10 border border-[#00c98d]/20 px-3 py-1.5 text-xs font-semibold text-[#00c98d] hover:bg-[#00c98d]/20 transition-colors"
      >
        <ArrowUpCircle className="h-3 w-3" />
        Upgrade
        {open ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-2 z-50 w-72 rounded-xl border border-white/[0.08] bg-[#1a1e2e] shadow-2xl p-3 space-y-2">
          <p className="text-[11px] text-[#8b92a8] px-1 pb-1">Select a new plan — difference is prorated immediately</p>
          {upgradablePlans.map((plan) => (
            <button
              key={plan.id}
              disabled={loading === plan.id}
              onClick={() => upgrade(plan.id)}
              className={`w-full flex items-center justify-between rounded-lg border px-3 py-2.5 text-left transition-colors ${plan.id === currentPlanId ? "border-[#00c98d]/30 bg-[#00c98d]/5" : "border-white/[0.06] bg-white/[0.02] hover:border-[#00c98d]/30 hover:bg-[#00c98d]/5"}`}
            >
              <div>
                <p className="text-sm font-semibold text-white">{plan.name}</p>
                <p className="text-[10px] text-[#8b92a8] mt-0.5">
                  {fmtMb(plan.ramMb)} RAM · {fmtMb(plan.diskMb)} Disk · {plan.cpuPercent}% CPU
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-bold text-white">${(plan.priceMonthly / 100).toFixed(0)}<span className="text-[10px] font-normal text-[#8b92a8]">/mo</span></span>
                {loading === plan.id
                  ? <Loader2 className="h-3.5 w-3.5 animate-spin text-[#00c98d]" />
                  : <Check className="h-3.5 w-3.5 text-[#00c98d] opacity-0 group-hover:opacity-100" />
                }
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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
