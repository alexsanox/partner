"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, Mail } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function TwoFactorPage() {
  const router = useRouter();
  const [code, setCode] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Auto-send OTP on page load
  useEffect(() => {
    handleSendOTP();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSendOTP = async () => {
    setSending(true);
    setSent(false);
    try {
      await authClient.twoFactor.sendOtp();
      setSent(true);
      setTimeout(() => setSent(false), 5000);
    } catch {
      setError("Failed to send code. Please try again.");
    }
    setSending(false);
  };

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    setError(null);

    // Auto-focus next input
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all 6 digits are entered
    if (newCode.every((d) => d !== "") && value) {
      handleVerify(newCode.join(""));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!pasted) return;

    const newCode = [...code];
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted[i];
    }
    setCode(newCode);

    const nextEmpty = newCode.findIndex((d) => d === "");
    inputRefs.current[nextEmpty === -1 ? 5 : nextEmpty]?.focus();

    if (newCode.every((d) => d !== "")) {
      handleVerify(newCode.join(""));
    }
  };

  const handleVerify = async (otp: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await authClient.twoFactor.verifyOtp({ code: otp });
      if (res.error) {
        setError(res.error.message ?? "Invalid code. Please try again.");
        setCode(["", "", "", "", "", ""]);
        inputRefs.current[0]?.focus();
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Verification failed. Please try again.");
      setCode(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    }
    setLoading(false);
  };

  return (
    <Card className="border-white/5 bg-white/[0.03]">
      <CardHeader className="space-y-1 p-6 pb-0 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[#00c98d]/10">
          <ShieldCheck className="h-7 w-7 text-[#00c98d]" />
        </div>
        <h1 className="text-2xl font-bold text-white">Two-Factor Authentication</h1>
        <p className="text-sm text-slate-400">
          We sent a 6-digit code to your email. Enter it below to continue.
        </p>
      </CardHeader>
      <CardContent className="p-6">
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400 text-center">
            {error}
          </div>
        )}

        {/* OTP Input */}
        <div className="flex justify-center gap-3 mb-6" onPaste={handlePaste}>
          {code.map((digit, i) => (
            <input
              key={i}
              ref={(el) => { inputRefs.current[i] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="h-14 w-12 rounded-lg border border-white/10 bg-white/5 text-center text-xl font-bold text-white
                focus:border-[#00c98d]/50 focus:outline-none focus:ring-1 focus:ring-[#00c98d]/30
                transition-all"
              autoFocus={i === 0}
              disabled={loading}
            />
          ))}
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 text-sm text-[#8b92a8] mb-4">
            <Loader2 className="h-4 w-4 animate-spin" />
            Verifying...
          </div>
        )}

        {/* Resend OTP */}
        <div className="text-center">
          <button
            onClick={handleSendOTP}
            disabled={sending}
            className="inline-flex items-center gap-1.5 text-sm text-[#00c98d] hover:text-[#4a7bef] transition-colors disabled:opacity-50"
          >
            {sending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Mail className="h-3.5 w-3.5" />
            )}
            {sent ? "Code sent!" : "Resend code"}
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-white/5 text-center">
          <Button
            variant="ghost"
            className="text-slate-400 hover:text-white text-sm"
            onClick={() => router.push("/login")}
          >
            ← Back to login
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
