"use client";

import { useState, useEffect, useCallback } from "react";
import { DollarSign, MousePointerClick, Users, Check, X, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";

interface AffiliateRow {
  id: string;
  code: string;
  commissionPct: number;
  totalClicks: number;
  totalEarnings: number;
  pendingEarnings: number;
  isActive: boolean;
  user: { name: string; email: string };
  payouts: { id: string; amountCents: number }[];
  _count: { commissions: number; clicks: number };
}

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function AdminAffiliatesPage() {
  const [affiliates, setAffiliates] = useState<AffiliateRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/affiliates");
    if (res.ok) setAffiliates(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function action(payload: Record<string, unknown>, key: string) {
    setActioning(key);
    const res = await fetch("/api/admin/affiliates", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) toast.error(json.error || "Failed");
    else { toast.success("Updated"); load(); }
    setActioning(null);
  }

  const totalEarnings = affiliates.reduce((s, a) => s + a.totalEarnings, 0);
  const totalPending = affiliates.reduce((s, a) => s + a.pendingEarnings, 0);
  const pendingPayouts = affiliates.flatMap((a) => a.payouts.map((p) => ({ ...p, affiliate: a })));

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold text-white">Affiliates</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Affiliates", value: affiliates.length, icon: Users },
          { label: "Total Paid Out", value: fmt(totalEarnings - totalPending), icon: DollarSign },
          { label: "Pending Payouts", value: fmt(totalPending), icon: DollarSign },
          { label: "Pending Requests", value: pendingPayouts.length, icon: MousePointerClick },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/[0.06] bg-[#1a1e2e] p-5">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className="h-4 w-4 text-[#00c98d]" />
              <span className="text-xs text-[#8b92a8]">{s.label}</span>
            </div>
            <p className="text-xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Pending Payout Requests */}
      {pendingPayouts.length > 0 && (
        <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-5">
          <h2 className="text-sm font-semibold text-yellow-400 mb-3">Pending Payout Requests</h2>
          <div className="space-y-2">
            {pendingPayouts.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg bg-white/[0.03] px-4 py-3">
                <div>
                  <p className="text-sm text-white font-semibold">{p.affiliate.user.name}</p>
                  <p className="text-xs text-[#8b92a8]">{p.affiliate.user.email}</p>
                </div>
                <span className="text-sm font-mono font-bold text-white">{fmt(p.amountCents)}</span>
                <div className="flex gap-2">
                  <button
                    onClick={() => action({ action: "mark-paid", payoutId: p.id }, `paid-${p.id}`)}
                    disabled={actioning === `paid-${p.id}`}
                    className="flex items-center gap-1 rounded-lg bg-green-500/15 px-3 py-1.5 text-xs font-semibold text-green-400 hover:bg-green-500/25 transition-colors"
                  >
                    {actioning === `paid-${p.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                    Mark Paid
                  </button>
                  <button
                    onClick={() => action({ action: "reject-payout", payoutId: p.id }, `rej-${p.id}`)}
                    disabled={actioning === `rej-${p.id}`}
                    className="flex items-center gap-1 rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-400 hover:bg-red-500/25 transition-colors"
                  >
                    {actioning === `rej-${p.id}` ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Affiliate List */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-[#00c98d]" /></div>
      ) : (
        <div className="rounded-xl border border-white/[0.06] bg-[#1a1e2e] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-[#8b92a8] text-xs">
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-right">Commission</th>
                <th className="px-4 py-3 text-right">Clicks</th>
                <th className="px-4 py-3 text-right">Conversions</th>
                <th className="px-4 py-3 text-right">Earnings</th>
                <th className="px-4 py-3 text-right">Pending</th>
                <th className="px-4 py-3 text-right">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {affiliates.map((a) => (
                <>
                  <tr key={a.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <p className="text-white font-medium">{a.user.name}</p>
                      <p className="text-xs text-[#8b92a8]">{a.user.email}</p>
                    </td>
                    <td className="px-4 py-3 font-mono text-[#00c98d] text-xs">{a.code}</td>
                    <td className="px-4 py-3 text-right text-white">{a.commissionPct}%</td>
                    <td className="px-4 py-3 text-right text-[#8b92a8]">{a.totalClicks}</td>
                    <td className="px-4 py-3 text-right text-[#8b92a8]">{a._count.commissions}</td>
                    <td className="px-4 py-3 text-right text-green-400 font-mono">{fmt(a.totalEarnings)}</td>
                    <td className="px-4 py-3 text-right text-yellow-400 font-mono">{fmt(a.pendingEarnings)}</td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => action({ action: "toggle-active", affiliateId: a.id }, `toggle-${a.id}`)}
                        disabled={actioning === `toggle-${a.id}`}
                        className={`text-xs font-semibold px-2 py-0.5 rounded-full transition-colors ${a.isActive ? "bg-green-500/10 text-green-400 hover:bg-red-500/10 hover:text-red-400" : "bg-red-500/10 text-red-400 hover:bg-green-500/10 hover:text-green-400"}`}
                      >
                        {a.isActive ? "Active" : "Disabled"}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setExpanded(expanded === a.id ? null : a.id)}
                        className="text-[#8b92a8] hover:text-white"
                      >
                        {expanded === a.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      </button>
                    </td>
                  </tr>
                  {expanded === a.id && (
                    <tr key={`${a.id}-exp`}>
                      <td colSpan={9} className="px-4 pb-4 pt-0">
                        <div className="rounded-lg bg-white/[0.03] p-4 flex items-center gap-4">
                          <span className="text-xs text-[#8b92a8]">Commission %</span>
                          <input
                            type="number"
                            defaultValue={a.commissionPct}
                            min={1}
                            max={100}
                            id={`comm-${a.id}`}
                            className="w-20 rounded-lg border border-white/[0.08] bg-[#171b29] px-3 py-1.5 text-sm text-white outline-none"
                          />
                          <button
                            onClick={() => {
                              const val = (document.getElementById(`comm-${a.id}`) as HTMLInputElement)?.value;
                              action({ action: "set-commission", affiliateId: a.id, commissionPct: val }, `comm-${a.id}`);
                            }}
                            className="rounded-lg bg-[#00c98d]/15 px-3 py-1.5 text-xs font-semibold text-[#00c98d] hover:bg-[#00c98d]/25"
                          >
                            Save
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
