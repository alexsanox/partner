"use client";

import { useState, useCallback } from "react";
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
      confirmParams: {
        return_url: `${window.location.origin}/dashboard/billing`,
      },
      redirect: "if_required",
    });

    if (submitError) {
      setError(submitError.message ?? "Failed to update payment method.");
      setProcessing(false);
      return;
    }

    if (setupIntent?.payment_method) {
      // Set as default for all subscriptions
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />

      {error && (
        <p className="text-xs text-red-400">{error}</p>
      )}

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={!stripe || processing}
          className="flex items-center gap-2 rounded-lg bg-[#00c98d] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#4a7bef] transition-colors disabled:opacity-40"
        >
          {processing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Save Card
            </>
          )}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-2 rounded-lg border border-white/[0.07] bg-[#232839] px-5 py-2.5 text-sm font-semibold text-[#8b92a8] hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
          Cancel
        </button>
      </div>

      <p className="text-[11px] text-[#8b92a8] flex items-center gap-1">
        <Lock className="h-3 w-3" />
        Your card details are encrypted and stored securely by Stripe.
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

  const handleSuccess = () => {
    setOpen(false);
    setClientSecret(null);
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      router.refresh();
    }, 2000);
  };

  if (success) {
    return (
      <div className="flex items-center gap-2 text-green-400 text-sm font-semibold">
        <Check className="h-4 w-4" />
        Payment method updated!
      </div>
    );
  }

  if (!open) {
    return (
      <button
        onClick={handleOpen}
        disabled={loading}
        className="flex items-center gap-2 rounded-lg bg-[#00c98d] px-4 py-2 text-sm font-bold text-white hover:bg-[#4a7bef] transition-colors disabled:opacity-40"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CreditCard className="h-4 w-4" />
        )}
        Update Card
      </button>
    );
  }

  if (!clientSecret) return null;

  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#1a1e2e] p-5">
      <h4 className="text-sm font-semibold text-[#e2e8f0] mb-4 flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-[#00c98d]" />
        Update Payment Method
      </h4>
      <Elements
        stripe={stripePromise}
        options={{
          clientSecret,
          appearance: {
            theme: "night",
            variables: {
              colorPrimary: "#00c98d",
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
        <UpdateForm
          onSuccess={handleSuccess}
          onCancel={() => { setOpen(false); setClientSecret(null); }}
        />
      </Elements>
    </div>
  );
}
