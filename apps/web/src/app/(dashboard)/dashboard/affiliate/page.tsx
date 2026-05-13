"use client";

import { useState, useEffect, useCallback } from "react";
import { Copy, Check, DollarSign, MousePointerClick, Users, TrendingUp, ArrowDownToLine, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Commission {
  id: string;
  amountCents: number;
  paid: boolean;
  createdAt: string;
}

interface Payout {
  id: string;
  amountCents: number;
  status: string;
  method: string;
  createdAt: string;
}

interface AffiliateData {
  id: string;
  code: string;
  commissionPct: number;
  totalClicks: number;
  totalEarnings: number;
  pendingEarnings: number;
  totalConversions: number;
  commissions: Commission[];
  payouts: Payout[];
}

function fmt(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "text-yellow-400 bg-yellow-400/10",
  APPROVED: "text-blue-400 bg-blue-400/10",
  PAID: "text-green-400 bg-green-400/10",
  REJECTED: "text-red-400 bg-red-400/10",
};

export default function AffiliatePage() {
  const [data, setData] = useState<AffiliateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [payoutOpen, setPayoutOpen] = useState(false);
  const [payoutMethod, setPayoutMethod] = useState("paypal");
  const [payoutDetails, setPayoutDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/affiliate");
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const referralUrl = data ? `${window.location.origin}/?ref=${data.code}` : "";

  function copyLink() {
    navigator.clipboard.writeText(referralUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Referral link copied!");
  }

  async function requestPayout() {
    if (!payoutDetails.trim()) { toast.error("Enter your payout details"); return; }
    setSubmitting(true);
    const res = await fetch("/api/affiliate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ method: payoutMethod, details: payoutDetails }),
    });
    const json = await res.json();
    if (!res.ok) { toast.error(json.error || "Failed"); }
    else { toast.success("Payout request submitted!"); setPayoutOpen(false); load(); }
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-6 w-6 animate-spin text-[#00c98d]" />
      </div>
    );
  }

  if (!data) return null;

  const conversionRate = data.totalClicks > 0
    ? ((data.totalConversions / data.totalClicks) * 100).toFixed(1)
    : "0.0";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Affiliate Program</h1>
        <p className="text-[#8b92a8] text-sm mt-1">Earn {data.commissionPct}% commission on every referral that subscribes.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Earnings", value: fmt(data.totalEarnings), icon: DollarSign, color: "text-green-400" },
          { label: "Pending Balance", value: fmt(data.pendingEarnings), icon: TrendingUp, color: "text-yellow-400" },
          { label: "Total Clicks", value: data.totalClicks.toLocaleString(), icon: MousePointerClick, color: "text-blue-400" },
          { label: "Conversions", value: `${data.totalConversions} (${conversionRate}%)`, icon: Users, color: "text-[#00c98d]" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-white/[0.06] bg-[#1a1e2e] p-5">
            <div className="flex items-center gap-2 mb-3">
              <s.icon className={`h-4 w-4 ${s.color}`} />
              <span className="text-xs text-[#8b92a8]">{s.label}</span>
            </div>
            <p className="text-xl font-bold text-white">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Referral Link */}
      <div className="rounded-xl border border-white/[0.06] bg-[#1a1e2e] p-5">
        <h2 className="text-sm font-semibold text-white mb-3">Your Referral Link</h2>
        <div className="flex gap-2">
          <input
            readOnly
            value={referralUrl}
            className="flex-1 rounded-lg border border-white/[0.08] bg-[#171b29] px-4 py-2.5 text-sm text-white font-mono outline-none truncate"
          />
          <button
            onClick={copyLink}
            className="flex items-center gap-2 rounded-lg bg-[#00c98d]/15 px-4 py-2.5 text-sm font-semibold text-[#00c98d] hover:bg-[#00c98d]/25 transition-colors"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
        <p className="text-xs text-[#8b92a8] mt-2">
          Share this link. When someone signs up and pays, you earn <span className="text-white font-semibold">{data.commissionPct}%</span> commission.
        </p>
      </div>

      {/* Payout */}
      <div className="rounded-xl border border-white/[0.06] bg-[#1a1e2e] p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-sm font-semibold text-white">Request Payout</h2>
            <p className="text-xs text-[#8b92a8] mt-0.5">Minimum withdrawal: $10.00</p>
          </div>
          <button
            onClick={() => setPayoutOpen(!payoutOpen)}
            disabled={data.pendingEarnings < 1000}
            className="flex items-center gap-2 rounded-lg bg-[#00c98d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00b07d] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ArrowDownToLine className="h-4 w-4" />
            Withdraw {fmt(data.pendingEarnings)}
          </button>
        </div>

        {payoutOpen && (
          <div className="space-y-3 pt-4 border-t border-white/[0.06]">
            <div className="flex gap-2">
              {["paypal", "bank", "crypto"].map((m) => (
                <button
                  key={m}
                  onClick={() => setPayoutMethod(m)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${payoutMethod === m ? "bg-[#00c98d] text-white" : "bg-white/[0.05] text-[#8b92a8] hover:text-white"}`}
                >
                  {m}
                </button>
              ))}
            </div>
            <input
              value={payoutDetails}
              onChange={(e) => setPayoutDetails(e.target.value)}
              placeholder={payoutMethod === "paypal" ? "PayPal email address" : payoutMethod === "bank" ? "Bank account details" : "Wallet address"}
              className="w-full rounded-lg border border-white/[0.08] bg-[#171b29] px-4 py-2.5 text-sm text-white placeholder:text-[#8b92a8] outline-none focus:border-[#00c98d]/40"
            />
            <button
              onClick={requestPayout}
              disabled={submitting}
              className="flex items-center gap-2 rounded-lg bg-[#00c98d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#00b07d] transition-colors disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Submit Request
            </button>
          </div>
        )}
      </div>

      {/* Recent Commissions */}
      {data.commissions.length > 0 && (
        <div className="rounded-xl border border-white/[0.06] bg-[#1a1e2e] p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Recent Commissions</h2>
          <div className="space-y-2">
            {data.commissions.map((c) => (
              <div key={c.id} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                <span className="text-xs text-[#8b92a8]">{new Date(c.createdAt).toLocaleDateString()}</span>
                <span className={`text-xs font-mono font-bold ${c.paid ? "text-green-400" : "text-yellow-400"}`}>
                  +{fmt(c.amountCents)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Payouts History */}
      {data.payouts.length > 0 && (
        <div className="rounded-xl border border-white/[0.06] bg-[#1a1e2e] p-5">
          <h2 className="text-sm font-semibold text-white mb-4">Payout History</h2>
          <div className="space-y-2">
            {data.payouts.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2 border-b border-white/[0.04] last:border-0">
                <div>
                  <span className="text-sm text-white font-mono">{fmt(p.amountCents)}</span>
                  <span className="text-xs text-[#8b92a8] ml-2 capitalize">{p.method}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-[#8b92a8]">{new Date(p.createdAt).toLocaleDateString()}</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[p.status] ?? "text-[#8b92a8]"}`}>
                    {p.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
