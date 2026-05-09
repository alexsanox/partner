"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, Sparkles, Rocket, PartyPopper } from "lucide-react";
import confetti from "canvas-confetti";

export function CheckoutSuccessBanner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [visible, setVisible] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  const fireConfetti = useCallback(() => {
    // Big burst from center
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#5b8cff", "#22c55e", "#a78bfa", "#f472b6", "#fbbf24"],
    });

    // Side cannons with delay
    setTimeout(() => {
      confetti({
        particleCount: 50,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: ["#5b8cff", "#22c55e", "#fbbf24"],
      });
      confetti({
        particleCount: 50,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: ["#a78bfa", "#f472b6", "#5b8cff"],
      });
    }, 300);

    // Stars burst
    setTimeout(() => {
      confetti({
        particleCount: 30,
        spread: 100,
        origin: { y: 0.5 },
        shapes: ["star"],
        colors: ["#fbbf24", "#f472b6"],
      });
    }, 600);
  }, []);

  const handleDismiss = useCallback(() => {
    setAnimateIn(false);
    setTimeout(() => setVisible(false), 300);
    router.replace("/dashboard/services", { scroll: false });
  }, [router]);

  useEffect(() => {
    if (searchParams.get("checkout") === "success") {
      setVisible(true);
      setTimeout(() => setAnimateIn(true), 50);
      fireConfetti();

      // Auto-dismiss after 8 seconds
      const dismiss = setTimeout(handleDismiss, 8000);
      return () => clearTimeout(dismiss);
    }
  }, [searchParams, fireConfetti, handleDismiss]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
          animateIn ? "opacity-100" : "opacity-0"
        }`}
        onClick={handleDismiss}
      />

      {/* Modal */}
      <div
        className={`relative w-full max-w-md transform transition-all duration-500 ${
          animateIn
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-95 opacity-0 translate-y-4"
        }`}
      >
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#1a1e2e] shadow-2xl shadow-[#5b8cff]/10">
          {/* Glow effect at top */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-32 w-64 bg-[#5b8cff]/20 blur-[80px] rounded-full" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 h-16 w-32 bg-green-400/20 blur-[40px] rounded-full" />

          <div className="relative px-8 pt-10 pb-8 text-center">
            {/* Animated checkmark */}
            <div className="mx-auto mb-6 relative">
              <div className="flex h-20 w-20 mx-auto items-center justify-center rounded-full bg-green-500/10 border-2 border-green-500/30 animate-[scaleIn_0.5s_ease-out]">
                <CheckCircle className="h-10 w-10 text-green-400 animate-[fadeIn_0.5s_ease-out_0.3s_both]" />
              </div>
              {/* Floating sparkles */}
              <Sparkles className="absolute -top-2 -right-2 h-5 w-5 text-[#fbbf24] animate-[float_2s_ease-in-out_infinite]" />
              <PartyPopper className="absolute -top-1 -left-3 h-5 w-5 text-[#f472b6] animate-[float_2s_ease-in-out_0.5s_infinite]" />
            </div>

            <h2 className="text-2xl font-extrabold text-white mb-2">
              You&apos;re All Set!
            </h2>
            <p className="text-[15px] text-green-400 font-semibold flex items-center justify-center gap-2 mb-3">
              <Rocket className="h-4 w-4" />
              Payment Successful
            </p>
            <p className="text-sm text-[#8b92a8] leading-relaxed max-w-xs mx-auto">
              Your server is being deployed now. It&apos;ll be ready in about a minute. Welcome aboard!
            </p>

            {/* Fun stats */}
            <div className="mt-6 grid grid-cols-3 gap-3">
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] px-3 py-3">
                <p className="text-lg font-bold text-[#5b8cff]">24/7</p>
                <p className="text-[10px] text-[#8b92a8] mt-0.5">Uptime</p>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] px-3 py-3">
                <p className="text-lg font-bold text-green-400">DDoS</p>
                <p className="text-[10px] text-[#8b92a8] mt-0.5">Protected</p>
              </div>
              <div className="rounded-xl bg-white/[0.03] border border-white/[0.05] px-3 py-3">
                <p className="text-lg font-bold text-[#a78bfa]">Instant</p>
                <p className="text-[10px] text-[#8b92a8] mt-0.5">Setup</p>
              </div>
            </div>

            {/* CTA */}
            <button
              onClick={handleDismiss}
              className="mt-6 w-full rounded-xl bg-[#5b8cff] px-6 py-3 text-sm font-bold text-white hover:bg-[#4a7bef] transition-colors"
            >
              Go to My Servers
            </button>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes scaleIn {
          from { transform: scale(0); }
          to { transform: scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.5); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-6px) rotate(10deg); }
        }
      `}</style>
    </div>
  );
}
