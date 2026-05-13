"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { signUp } from "@/lib/auth-client";
import { Turnstile } from "@/components/ui/turnstile";

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !turnstileToken) {
      setError("Please complete the CAPTCHA.");
      setIsLoading(false);
      return;
    }

    const { error: authError } = await signUp.email({
      name,
      email,
      password,
    });

    if (authError) {
      setError(authError.message ?? "Something went wrong. Please try again.");
      setIsLoading(false);
      return;
    }

    router.push("/dashboard");
  }

  return (
    <Card className="border-white/5 bg-white/[0.03]">
      <CardHeader className="space-y-1 p-6 pb-0">
        <h1 className="text-2xl font-bold text-white">Create an account</h1>
        <p className="text-sm text-slate-400">
          Get your Minecraft server running in under 60 seconds
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
            <Label htmlFor="name" className="text-slate-300">
              Name
            </Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder="Your name"
              required
              className="border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus-visible:ring-[#00c98d]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email" className="text-slate-300">
              Email
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="you@example.com"
              required
              className="border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus-visible:ring-[#00c98d]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-slate-300">
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              required
              minLength={8}
              className="border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus-visible:ring-[#00c98d]"
            />
          </div>
          <Turnstile
            onVerify={setTurnstileToken}
            onExpire={() => setTurnstileToken(null)}
          />
          <Button
            type="submit"
            className="w-full bg-[#00c98d] text-white hover:bg-[#00e0a0]"
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-[#00c98d] hover:text-[#4dd9ae]"
          >
            Sign in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
