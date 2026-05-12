"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Loader2,
  Check,
  Cpu,
  HardDrive,
  MemoryStick,
  Users,
  Database,
  Archive,
  Shield,
  Zap,
  CreditCard,
  Lock,
} from "lucide-react";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

interface Plan {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  ramMb: number;
  cpuPercent: number;
  diskMb: number;
  playerSlots: number;
  backupSlots: number;
  databaseLimit: number;
  priceMonthly: number;
  priceQuarterly: number | null;
  priceAnnual: number | null;
  features: string[];
  sortOrder: number;
}

type BillingCycle = "MONTHLY" | "QUARTERLY" | "ANNUAL";

function formatPrice(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatMemory(mb: number) {
  return mb >= 1024 ? `${(mb / 1024).toFixed(0)} GB` : `${mb} MB`;
}

// ── Embedded Payment Form ────────────────────────────────────────────
function PaymentForm({ plan, billingCycle, getPrice, getSavings, onSuccess }: {
  plan: Plan;
  billingCycle: BillingCycle;
  getPrice: (p: Plan, c: BillingCycle) => number;
  getSavings: (p: Plan, c: BillingCycle) => number;
  onSuccess: () => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [payError, setPayError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setProcessing(true);
    setPayError(null);

    const { error } = await stripe.confirmSetup({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/dashboard/services?checkout=success`,
      },
      redirect: "if_required",
    });

    if (error) {
      setPayError(error.message ?? "Payment failed. Please try again.");
      setProcessing(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Order summary */}
      <div className="rounded-xl border border-white/[0.07] bg-[#1a1e2e] p-5 space-y-3">
        <h4 className="text-sm font-semibold text-[#e2e8f0]">Order Summary</h4>
        <div className="flex justify-between text-sm">
          <span className="text-[#8b92a8]">{plan.name} Server ({billingCycle.toLowerCase()})</span>
          <span className="text-white font-medium">{formatPrice(getPrice(plan, billingCycle))}</span>
        </div>
        {getSavings(plan, billingCycle) > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-green-400">Discount</span>
            <span className="text-green-400 font-medium">-{getSavings(plan, billingCycle)}%</span>
          </div>
        )}
        <div className="border-t border-white/[0.07] pt-3 flex justify-between text-sm">
          <span className="text-white font-semibold">Total due today</span>
          <span className="text-white font-bold text-lg">{formatPrice(getPrice(plan, billingCycle))}</span>
        </div>
      </div>

      {/* Stripe Payment Element */}
      <div className="rounded-xl border border-white/[0.07] bg-[#1a1e2e] p-5">
        <h4 className="text-sm font-semibold text-[#e2e8f0] mb-4 flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-[#5b8cff]" />
          Payment Details
        </h4>
        <PaymentElement
          options={{
            layout: "tabs",
          }}
        />
      </div>

      {payError && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
          {payError}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || processing}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#5b8cff] px-6 py-3 text-sm font-bold text-white hover:bg-[#4a7bef] transition-colors disabled:opacity-40"
      >
        {processing ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing payment...
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" />
            Pay {formatPrice(getPrice(plan, billingCycle))}
          </>
        )}
      </button>

      <p className="text-center text-[11px] text-[#8b92a8] flex items-center justify-center gap-1">
        <Lock className="h-3 w-3" />
        Secured with 256-bit SSL encryption. Cancel anytime.
      </p>
    </form>
  );
}

// ── Main Page ────────────────────────────────────────────────────────
export default function CreateServerPage() {
  const router = useRouter();
  const [step, setStep] = useState<"plan" | "config" | "payment">("plan");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>("MONTHLY");
  const [serverName, setServerName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [creatingSubscription, setCreatingSubscription] = useState(false);

  useEffect(() => {
    fetch("/api/plans")
      .then((r) => r.json())
      .then((data) => {
        setPlans(data);
        setLoadingPlans(false);
      })
      .catch(() => setLoadingPlans(false));
  }, []);

  const getPrice = useCallback((plan: Plan, cycle: BillingCycle) => {
    switch (cycle) {
      case "QUARTERLY": return plan.priceQuarterly ?? plan.priceMonthly * 3;
      case "ANNUAL": return plan.priceAnnual ?? plan.priceMonthly * 12;
      default: return plan.priceMonthly;
    }
  }, []);

  const getMonthlyEquivalent = useCallback((plan: Plan, cycle: BillingCycle) => {
    const total = getPrice(plan, cycle);
    switch (cycle) {
      case "QUARTERLY": return total / 3;
      case "ANNUAL": return total / 12;
      default: return total;
    }
  }, [getPrice]);

  const getSavings = useCallback((plan: Plan, cycle: BillingCycle) => {
    if (cycle === "MONTHLY") return 0;
    const monthlyTotal = cycle === "QUARTERLY" ? plan.priceMonthly * 3 : plan.priceMonthly * 12;
    const actual = getPrice(plan, cycle);
    return Math.round(((monthlyTotal - actual) / monthlyTotal) * 100);
  }, [getPrice]);

  const handleContinueToPayment = async () => {
    if (!selectedPlan || !serverName.trim()) return;
    setCreatingSubscription(true);
    setError(null);

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan.id,
          serverName: serverName.trim(),
          billingCycle,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to prepare payment");
        setCreatingSubscription(false);
        return;
      }

      setClientSecret(data.clientSecret);
      setStep("payment");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setCreatingSubscription(false);
    }
  };

  const handlePaymentSuccess = () => {
    router.push("/dashboard/services?checkout=success");
  };

  const stepLabels = ["Choose Server", "Configure", "Payment"];
  const currentStep = step === "plan" ? 0 : step === "config" ? 1 : 2;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/services"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.07] bg-[#232839] text-[#8b92a8] hover:text-white transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Create Server</h1>
          <p className="text-sm text-slate-400">
            {step === "plan" ? "Choose a server tier" : step === "config" ? "Name your server" : "Complete your payment"}
          </p>
        </div>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3">
        {stepLabels.map((label, i) => (
          <div key={label} className="flex items-center gap-3">
            {i > 0 && <div className="h-px w-6 bg-white/10" />}
            <div
              className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-[13px] font-semibold ${
                i < currentStep
                  ? "bg-green-500/10 text-green-400"
                  : i === currentStep
                    ? "bg-[#5b8cff]/10 text-[#5b8cff]"
                    : "bg-white/5 text-[#8b92a8]"
              }`}
            >
              {i < currentStep ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <span className="text-xs">{i + 1}</span>
              )}
              {label}
            </div>
          </div>
        ))}
      </div>

      {/* Step 1: Plan Selection */}
      {step === "plan" && (
        <div className="space-y-6">
          {/* Billing cycle toggle */}
          <div className="flex items-center justify-center gap-1 rounded-lg bg-[#1a1e2e] p-1 w-fit mx-auto">
            {(["MONTHLY", "QUARTERLY", "ANNUAL"] as BillingCycle[]).map((cycle) => (
              <button
                key={cycle}
                onClick={() => setBillingCycle(cycle)}
                className={`rounded-md px-4 py-2 text-[13px] font-semibold transition-all ${
                  billingCycle === cycle
                    ? "bg-[#5b8cff] text-white shadow-sm"
                    : "text-[#8b92a8] hover:text-white"
                }`}
              >
                {cycle === "MONTHLY" ? "Monthly" : cycle === "QUARTERLY" ? "Quarterly" : "Annual"}
                {cycle !== "MONTHLY" && plans[0] && (
                  <span className="ml-1.5 text-[11px] text-green-400 font-bold">
                    -{getSavings(plans[plans.length - 1] || plans[0], cycle)}%
                  </span>
                )}
              </button>
            ))}
          </div>

          {loadingPlans ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-6 w-6 animate-spin text-[#5b8cff]" />
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan, i) => {
                const isPopular = i === 1;
                const monthlyEq = getMonthlyEquivalent(plan, billingCycle);
                const totalPrice = getPrice(plan, billingCycle);

                return (
                  <div
                    key={plan.id}
                    className={`relative rounded-xl border p-6 transition-all cursor-pointer ${
                      selectedPlan?.id === plan.id
                        ? "border-[#5b8cff] bg-[#5b8cff]/5 ring-1 ring-[#5b8cff]/30"
                        : isPopular
                          ? "border-[#5b8cff]/30 bg-[#232839]"
                          : "border-white/[0.07] bg-white/[0.02] hover:border-white/20"
                    }`}
                    onClick={() => setSelectedPlan(plan)}
                  >
                    {isPopular && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                        <span className="rounded-full bg-[#5b8cff] px-3 py-1 text-[11px] font-bold text-white">
                          BEST VALUE
                        </span>
                      </div>
                    )}

                    {selectedPlan?.id === plan.id && (
                      <div className="absolute top-4 right-4">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#5b8cff]">
                          <Check className="h-3.5 w-3.5 text-white" />
                        </div>
                      </div>
                    )}

                    <h3 className="text-lg font-bold text-white">{plan.name} Server</h3>
                    <p className="mt-1 text-[13px] text-[#8b92a8]">{plan.description}</p>

                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-3xl font-extrabold text-white">
                        {formatPrice(monthlyEq)}
                      </span>
                      <span className="text-sm text-[#8b92a8]">/mo</span>
                    </div>
                    {billingCycle !== "MONTHLY" && (
                      <p className="text-xs text-[#8b92a8] mt-1">
                        {formatPrice(totalPrice)} billed {billingCycle === "QUARTERLY" ? "quarterly" : "annually"}
                        {getSavings(plan, billingCycle) > 0 && (
                          <span className="ml-1 text-green-400 font-semibold">
                            Save {getSavings(plan, billingCycle)}%
                          </span>
                        )}
                      </p>
                    )}

                    <div className="mt-5 space-y-2.5">
                      <div className="flex items-center gap-2 text-sm text-[#e2e8f0]">
                        <MemoryStick className="h-3.5 w-3.5 text-[#5b8cff]" />
                        {formatMemory(plan.ramMb)} RAM
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#e2e8f0]">
                        <HardDrive className="h-3.5 w-3.5 text-[#5b8cff]" />
                        {formatMemory(plan.diskMb)} Disk
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#e2e8f0]">
                        <Cpu className="h-3.5 w-3.5 text-[#5b8cff]" />
                        {plan.cpuPercent}% CPU
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#e2e8f0]">
                        <Users className="h-3.5 w-3.5 text-[#5b8cff]" />
                        {plan.playerSlots} Player Slots
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[#e2e8f0]">
                        <Archive className="h-3.5 w-3.5 text-[#5b8cff]" />
                        {plan.backupSlots} Backup{plan.backupSlots !== 1 ? "s" : ""}
                      </div>
                      {plan.databaseLimit > 0 && (
                        <div className="flex items-center gap-2 text-sm text-[#e2e8f0]">
                          <Database className="h-3.5 w-3.5 text-[#5b8cff]" />
                          {plan.databaseLimit} Database{plan.databaseLimit !== 1 ? "s" : ""}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm text-[#e2e8f0]">
                        <Shield className="h-3.5 w-3.5 text-green-400" />
                        DDoS Protection
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPlan(plan);
                        setStep("config");
                      }}
                      className={`mt-6 w-full rounded-lg py-2.5 text-sm font-bold transition-colors ${
                        isPopular || selectedPlan?.id === plan.id
                          ? "bg-[#5b8cff] text-white hover:bg-[#4a7bef]"
                          : "bg-white/5 text-white hover:bg-white/10"
                      }`}
                    >
                      Get This Server
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Step 2: Configure */}
      {step === "config" && selectedPlan && (
        <div className="max-w-xl space-y-6">
          {/* Selected plan summary */}
          <div className="rounded-xl border border-white/[0.07] bg-[#232839] p-4 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#5b8cff]/10">
              <Zap className="h-5 w-5 text-[#5b8cff]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{selectedPlan.name} Server</p>
              <p className="text-xs text-[#8b92a8]">
                {formatMemory(selectedPlan.ramMb)} RAM · {formatMemory(selectedPlan.diskMb)} Disk · {selectedPlan.playerSlots} Players
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-white">
                {formatPrice(getMonthlyEquivalent(selectedPlan, billingCycle))}/mo
              </p>
              {billingCycle !== "MONTHLY" && (
                <p className="text-[11px] text-green-400">Save {getSavings(selectedPlan, billingCycle)}%</p>
              )}
            </div>
            <button
              onClick={() => setStep("plan")}
              className="text-xs text-[#5b8cff] hover:underline"
            >
              Change
            </button>
          </div>

          {/* Server Name */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#e2e8f0]">Server Name</label>
            <input
              type="text"
              value={serverName}
              onChange={(e) => setServerName(e.target.value)}
              placeholder="My Minecraft Server"
              className="w-full rounded-lg border border-white/[0.07] bg-[#1a1e2e] px-4 py-2.5 text-sm text-white placeholder:text-[#8b92a8]/50 focus:border-[#5b8cff]/40 focus:outline-none focus:ring-1 focus:ring-[#5b8cff]/20"
              autoFocus
            />
          </div>

          {/* Error */}
          {error && (
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setStep("plan")}
              className="rounded-lg border border-white/[0.07] bg-[#232839] px-5 py-2.5 text-sm font-semibold text-[#8b92a8] hover:text-white transition-colors"
            >
              Back
            </button>
            <button
              onClick={handleContinueToPayment}
              disabled={!serverName.trim() || creatingSubscription}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#5b8cff] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#4a7bef] transition-colors disabled:opacity-40"
            >
              {creatingSubscription ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Preparing payment...
                </>
              ) : (
                <>
                  <CreditCard className="h-4 w-4" />
                  Continue to Payment
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Payment */}
      {step === "payment" && selectedPlan && clientSecret && (
        <div className="max-w-xl space-y-6">
          {/* Selected plan + server summary */}
          <div className="rounded-xl border border-white/[0.07] bg-[#232839] p-4 flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#5b8cff]/10">
              <Zap className="h-5 w-5 text-[#5b8cff]" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">{serverName}</p>
              <p className="text-xs text-[#8b92a8]">
                {selectedPlan.name} · {formatMemory(selectedPlan.ramMb)} RAM
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-white">
                {formatPrice(getMonthlyEquivalent(selectedPlan, billingCycle))}/mo
              </p>
            </div>
          </div>

          {/* Stripe Elements */}
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: "night",
                variables: {
                  colorPrimary: "#5b8cff",
                  colorBackground: "#1a1e2e",
                  colorText: "#e2e8f0",
                  colorTextSecondary: "#8b92a8",
                  colorDanger: "#ef4444",
                  fontFamily: "system-ui, -apple-system, sans-serif",
                  borderRadius: "8px",
                  spacingUnit: "4px",
                },
                rules: {
                  ".Input": {
                    border: "1px solid rgba(255, 255, 255, 0.07)",
                    backgroundColor: "#1a1e2e",
                    boxShadow: "none",
                  },
                  ".Input:focus": {
                    border: "1px solid rgba(91, 140, 255, 0.4)",
                    boxShadow: "0 0 0 1px rgba(91, 140, 255, 0.2)",
                  },
                  ".Label": {
                    color: "#e2e8f0",
                    fontWeight: "600",
                    fontSize: "13px",
                  },
                  ".Tab": {
                    border: "1px solid rgba(255, 255, 255, 0.07)",
                    backgroundColor: "#232839",
                  },
                  ".Tab--selected": {
                    border: "1px solid rgba(91, 140, 255, 0.4)",
                    backgroundColor: "rgba(91, 140, 255, 0.05)",
                  },
                },
              },
            }}
          >
            <PaymentForm
              plan={selectedPlan}
              billingCycle={billingCycle}
              getPrice={getPrice}
              getSavings={getSavings}
              onSuccess={handlePaymentSuccess}
            />
          </Elements>

          {/* Back button */}
          <button
            onClick={() => setStep("config")}
            className="text-sm text-[#8b92a8] hover:text-white transition-colors"
          >
            ← Back to configuration
          </button>
        </div>
      )}
    </div>
  );
}
