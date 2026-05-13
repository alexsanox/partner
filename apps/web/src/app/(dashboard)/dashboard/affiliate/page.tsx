"use client";

import { useState, useEffect, useCallback } from "react";
import { Copy, Check, ChevronDown, ChevronUp, RefreshCw, ArrowDownToLine, Loader2, CircleDollarSign, Clock } from "lucide-react";
import { toast } from "sonner";

interface Commission {
  id: string;
  amountCents: number;
  paid: boolean;
  createdAt: string;
  orderId: string;
}

interface Payout {
  id: string;
  amountCents: number;
  status: string;
  method: string;
  details: string | null;
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

const STATUS_BADGE: Record<string, string> = {
  PENDING: "text-yellow-400 bg-yellow-400/10 border border-yellow-400/20",
  APPROVED: "text-blue-400 bg-blue-400/10 border border-blue-400/20",
  PAID: "text-green-400 bg-green-400/10 border border-green-400/20",
  REJECTED: "text-red-400 bg-red-400/10 border border-red-400/20",
};

export default function AffiliatePage() {
  const [data, setData] = useState<AffiliateData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [howOpen, setHowOpen] = useState(false);
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

  const referralUrl = data ? `${typeof window !== "undefined" ? window.location.origin : "https://novally.tech"}/?ref=${data.code}` : "";

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

  const rewardPerReferral = Math.round(data.commissionPct * 10); // visual hint
  const allHistory = [...data.commissions, ...data.payouts].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  return (
    <div className="max-w-5xl mx-auto space-y-5 pb-10">

      {/* ── Hero Banner ── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#1a2540] via-[#1e2d50] to-[#1a2c4e] border border-white/[0.06] p-8">
        <div>
          <h1 className="text-2xl font-extrabold text-white">
            Earn <span className="text-[#00c98d]">${rewardPerReferral}</span> Each!
          </h1>
          <p className="text-[#8b92a8] text-sm mt-2">
            Invite friends, and you&apos;ll <span className="text-[#00c98d] font-medium">both receive ${rewardPerReferral} USD</span>. It&apos;s quick and easy!
          </p>
        </div>
        {/* Coin stack illustration */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 text-6xl select-none pointer-events-none hidden sm:block">
          🪙
        </div>
      </div>

      {/* ── Two-column grid ── */}
      <div className="grid gap-5 lg:grid-cols-2">

        {/* Left col: Invite + How it works + Rewards */}
        <div className="space-y-5">

          {/* Invite a Friend */}
          <div className="rounded-2xl border border-white/[0.06] bg-[#1a1e2e] p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-bold text-white">Invite a Friend</h2>
              <a href="/legal/terms" className="text-xs text-[#00c98d] hover:underline">Terms</a>
            </div>
            <p className="text-xs text-[#8b92a8] mb-2">Copy your invite link</p>
            <div className="flex gap-2">
              <input
                readOnly
                value={referralUrl}
                className="flex-1 min-w-0 rounded-lg border border-white/[0.08] bg-[#111520] px-3 py-2.5 text-xs text-[#8b92a8] font-mono outline-none truncate"
              />
              <button
                onClick={copyLink}
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 px-4 py-2.5 text-xs font-bold text-white transition-colors"
              >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied!" : "Copy"}
              </button>
            </div>

            {/* How does it work accordion */}
            <button
              onClick={() => setHowOpen(!howOpen)}
              className="mt-4 flex w-full items-center justify-between text-xs text-[#8b92a8] hover:text-white transition-colors py-1"
            >
              <span className="font-semibold tracking-wide uppercase text-[10px]">How does it work?</span>
              {howOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
            {howOpen && (
              <ol className="mt-3 space-y-2 border-t border-white/[0.05] pt-3">
                {[
                  `Share your unique referral link with friends.`,
                  `They sign up and subscribe to any hosting plan.`,
                  `You earn ${data.commissionPct}% commission on their first payment.`,
                  `Request a payout once you reach $10.00 in earnings.`,
                ].map((step, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#00c98d]/15 text-[10px] font-bold text-[#00c98d]">{i + 1}</span>
                    <span className="text-xs text-[#8b92a8] leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          {/* Your Rewards */}
          <div className="rounded-2xl border border-white/[0.06] bg-[#1a1e2e] p-6">
            <h2 className="text-[15px] font-bold text-white mb-4">Your Rewards</h2>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl bg-[#111520] border border-white/[0.05] p-4 text-center">
                <p className="text-2xl font-extrabold text-white">{fmt(data.totalEarnings - data.pendingEarnings)}</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <CircleDollarSign className="h-3 w-3 text-[#8b92a8]" />
                  <span className="text-[11px] text-[#8b92a8]">Available</span>
                </div>
              </div>
              <div className="rounded-xl bg-[#111520] border border-white/[0.05] p-4 text-center">
                <p className="text-2xl font-extrabold text-white">{fmt(data.pendingEarnings)}</p>
                <div className="flex items-center justify-center gap-1 mt-1">
                  <Clock className="h-3 w-3 text-[#8b92a8]" />
                  <span className="text-[11px] text-[#8b92a8]">Pending</span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-[#8b92a8] leading-relaxed">
              Credits are added to your account after a successful referral. They will be applicable for future services once your referral&apos;s purchase has been confirmed.
            </p>

            {/* Withdraw button */}
            <button
              onClick={() => setPayoutOpen(!payoutOpen)}
              disabled={data.pendingEarnings < 1000}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-[#00c98d] py-2.5 text-sm font-bold text-white hover:bg-[#00b07d] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowDownToLine className="h-4 w-4" />
              Withdraw {fmt(data.pendingEarnings)}
            </button>

            {payoutOpen && (
              <div className="mt-4 space-y-3 border-t border-white/[0.06] pt-4">
                <div className="flex gap-2">
                  {["paypal", "bank", "crypto"].map((m) => (
                    <button
                      key={m}
                      onClick={() => setPayoutMethod(m)}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors ${
                        payoutMethod === m ? "bg-[#00c98d] text-white" : "bg-white/[0.05] text-[#8b92a8] hover:text-white"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
                <input
                  value={payoutDetails}
                  onChange={(e) => setPayoutDetails(e.target.value)}
                  placeholder={
                    payoutMethod === "paypal" ? "PayPal email address" :
                    payoutMethod === "bank" ? "Bank account details" : "Wallet address"
                  }
                  className="w-full rounded-lg border border-white/[0.08] bg-[#111520] px-3 py-2.5 text-sm text-white placeholder:text-[#8b92a8] outline-none focus:border-[#00c98d]/40"
                />
                <button
                  onClick={requestPayout}
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-lg bg-[#00c98d] px-4 py-2 text-sm font-bold text-white hover:bg-[#00b07d] transition-colors disabled:opacity-60"
                >
                  {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Submit Request
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Right col: Referral History */}
        <div className="rounded-2xl border border-white/[0.06] bg-[#1a1e2e] overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.05]">
            <h2 className="text-[15px] font-bold text-white">Referral History</h2>
            <button onClick={load} className="text-[#8b92a8] hover:text-white transition-colors">
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>

          {allHistory.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center py-16 gap-2">
              <p className="text-sm font-semibold text-white">No referrals sent</p>
              <p className="text-xs text-[#8b92a8]">Invite a friend now to get free rewards!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/[0.05]">
                    <th className="px-6 py-3 text-left text-[10px] uppercase tracking-wider text-[#8b92a8] font-semibold">Date</th>
                    <th className="px-4 py-3 text-left text-[10px] uppercase tracking-wider text-[#8b92a8] font-semibold">Status</th>
                    <th className="px-4 py-3 text-right text-[10px] uppercase tracking-wider text-[#8b92a8] font-semibold">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {data.commissions.map((c) => (
                    <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-3 text-[#8b92a8]">{new Date(c.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          c.paid ? STATUS_BADGE.PAID : STATUS_BADGE.PENDING
                        }`}>
                          {c.paid ? "Paid" : "Pending"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-green-400">+{fmt(c.amountCents)}</td>
                    </tr>
                  ))}
                  {data.payouts.map((p) => (
                    <tr key={p.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-3 text-[#8b92a8]">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_BADGE[p.status] ?? "text-[#8b92a8]"}`}>
                          Payout · {p.status.charAt(0) + p.status.slice(1).toLowerCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-white">{fmt(p.amountCents)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
