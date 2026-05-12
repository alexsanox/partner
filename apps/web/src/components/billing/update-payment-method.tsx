"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CreditCard, Loader2, Lock, Check, X } from "lucide-react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const STRIPE_APPEARANCE = {
  theme: "night" as const,
  variables: {
    colorPrimary: "#00c98d",
    colorBackground: "#1e2235",
    colorText: "#e2e8f0",
    colorTextSecondary: "#8b92a8",
    colorDanger: "#ef4444",
    fontFamily: "system-ui, -apple-system, sans-serif",
    borderRadius: "8px",
    spacingUnit: "4px",
  },
  rules: {
    ".Input": {
      border: "1px solid rgba(255,255,255,0.08)",
      backgroundColor: "#171b29",
      boxShadow: "none",
      color: "#e2e8f0",
    },
    ".Input:focus": {
      border: "1px solid rgba(0,201,141,0.5)",
      boxShadow: "0 0 0 2px rgba(0,201,141,0.15)",
    },
    ".Label": {
      color: "#8b92a8",
      fontWeight: "500",
      fontSize: "12px",
      textTransform: "uppercase",
      letterSpacing: "0.05em",
    },
    ".Tab": {
      border: "1px solid rgba(255,255,255,0.07)",
      backgroundColor: "#171b29",
      color: "#8b92a8",
    },
    ".Tab--selected": {
      border: "1px solid rgba(0,201,141,0.4)",
      backgroundColor: "rgba(0,201,141,0.05)",
      color: "#e2e8f0",
    },
    ".Tab:hover": {
      border: "1px solid rgba(255,255,255,0.12)",
      color: "#e2e8f0",
    },
  },
};

function UpdateForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);
    setError(null);

    const { error: submitError, setupIntent } = await stripe.confirmSetup({
      elements,
      confirmParams: { return_url: `${window.location.origin}/dashboard/billing` },
      redirect: "if_required",
    });

    if (submitError) {
      setError(submitError.message ?? "Failed to update payment method.");
      setProcessing(false);
      return;
    }

    if (setupIntent?.payment_method) {
      const res = await fetch("/api/billing/payment-method", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paymentMethodId: setupIntent.payment_method }),
      });
      if (!res.ok) {
        setError("Card saved but failed to set as default. Please try again.");
        setProcessing(false);
        return;
      }
    }

    setProcessing(false);
    onSuccess();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement options={{ layout: "tabs" }} />

      {error && (
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-3 py-2">
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      <div className="flex items-center gap-3 pt-1">
        <button
          type="submit"
          disabled={!stripe || processing}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#00c98d] py-2.5 text-sm font-bold text-white hover:bg-[#00e0a0] hover:text-white transition-colors disabled:opacity-40"
        >
          {processing ? <><Loader2 className="h-4 w-4 animate-spin" /> Saving...</> : <><Check className="h-4 w-4" /> Save Card</>}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center justify-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-[#8b92a8] hover:text-white hover:bg-white/[0.06] transition-colors"
        >
          <X className="h-4 w-4" /> Cancel
        </button>
      </div>

      <p className="flex items-center gap-1.5 text-[11px] text-[#8b92a8]/70">
        <Lock className="h-3 w-3 shrink-0" />
        Encrypted and stored securely by Stripe.
      </p>
    </form>
  );
}

export function UpdatePaymentMethod() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const handleOpen = useCallback(async () => {
    setLoading(true);
    setSuccess(false);
    try {
      const res = await fetch("/api/billing/payment-method", { method: "POST" });
      const data = await res.json();
      if (res.ok && data.clientSecret) {
        setClientSecret(data.clientSecret);
        setOpen(true);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const handleClose = () => { setOpen(false); setClientSecret(null); };

  const handleSuccess = () => {
    setOpen(false);
    setClientSecret(null);
    setSuccess(true);
    setTimeout(() => { setSuccess(false); router.refresh(); }, 2500);
  };

  if (success) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-[#00c98d]/20 bg-[#00c98d]/10 px-3 py-1.5 text-sm font-semibold text-[#00c98d]">
        <Check className="h-4 w-4" /> Updated!
      </div>
    );
  }

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={handleOpen}
        disabled={loading}
        className="flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.03] px-4 py-2 text-sm font-medium text-[#8b92a8] hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-40"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CreditCard className="h-4 w-4" />}
        Update Card
      </button>

      {/* Modal */}
      {open && clientSecret && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />
          {/* Panel */}
          <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/[0.07] bg-[#1e2235] p-6 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00c98d]/10">
                  <CreditCard className="h-4 w-4 text-[#00c98d]" />
                </div>
                <h3 className="text-[15px] font-bold text-white">Update Payment Method</h3>
              </div>
              <button
                onClick={handleClose}
                className="rounded-lg p-1.5 text-[#8b92a8] hover:text-white hover:bg-white/[0.06] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <Elements stripe={stripePromise} options={{ clientSecret, appearance: STRIPE_APPEARANCE }}>
              <UpdateForm onSuccess={handleSuccess} onCancel={handleClose} />
            </Elements>
          </div>
        </div>
      )}
    </>
  );
}
