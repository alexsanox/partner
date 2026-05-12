"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, MailCheck } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await authClient.requestPasswordReset({
      email,
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      console.error("[forgot-password] error:", error);
      setError(error.message ?? `Error ${error.status}: Something went wrong.`);
      setLoading(false);
      return;
    }

    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <Card className="border-white/5 bg-white/[0.03]">
        <CardContent className="p-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-blue-500/10 border border-blue-500/20">
            <MailCheck className="h-7 w-7 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Check your inbox</h2>
          <p className="mt-2 text-sm text-slate-400">
            We sent a password reset link to{" "}
            <span className="font-medium text-white">{email}</span>. It expires in 1 hour.
          </p>
          <p className="mt-4 text-xs text-slate-500">
            Didn&apos;t receive it? Check your spam folder or{" "}
            <button
              onClick={() => setSent(false)}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              try again
            </button>
            .
          </p>
          <Link
            href="/login"
            className="mt-6 flex items-center justify-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-white/5 bg-white/[0.03]">
      <CardHeader className="space-y-1 p-6 pb-0">
        <h1 className="text-2xl font-bold text-white">Forgot password?</h1>
        <p className="text-sm text-slate-400">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </CardHeader>
      <CardContent className="p-6">
        {error && (
          <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
            {error}
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-300">
              Email address
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus-visible:ring-blue-500"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-blue-600 text-white hover:bg-blue-500"
            disabled={loading}
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Send reset link
          </Button>
        </form>

        <Link
          href="/login"
          className="mt-6 flex items-center justify-center gap-1.5 text-sm text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to sign in
        </Link>
      </CardContent>
    </Card>
  );
}
