"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Home, RefreshCw, AlertTriangle } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-0">
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/5 blur-[120px]" />
        <div className="absolute right-1/4 top-1/2 h-[300px] w-[400px] rounded-full bg-orange-500/4 blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 text-center">
        {/* Error code */}
        <div className="relative mb-6 select-none">
          <p className="text-[180px] sm:text-[220px] font-black leading-none text-white/[0.03] tracking-tighter">
            500
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-7xl sm:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-red-400 to-red-400/30 tracking-tighter">
              500
            </p>
          </div>
        </div>

        {/* Icon */}
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/5">
          <AlertTriangle className="h-7 w-7 text-red-400" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
          Something went wrong
        </h1>
        <p className="text-[#8b92a8] text-base max-w-md leading-relaxed mb-4">
          An unexpected error occurred on our end. Our team has been notified.
          Try refreshing the page or come back in a moment.
        </p>

        {/* Digest for support reference */}
        {error.digest && (
          <p className="mb-8 rounded-lg border border-white/[0.06] bg-white/[0.03] px-4 py-2 font-mono text-xs text-[#8b92a8]">
            Error ID: <span className="text-white">{error.digest}</span>
          </p>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={reset}
            className="flex items-center gap-2 rounded-xl bg-[#00c98d] px-6 py-3 text-sm font-bold text-white hover:bg-[#00b07d] transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-6 py-3 text-sm font-semibold text-[#8b92a8] hover:text-white hover:border-white/20 transition-colors"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Link>
        </div>

        <div className="mt-14 flex flex-wrap items-center justify-center gap-6 text-xs text-[#8b92a8]">
          {[
            { href: "/dashboard", label: "Dashboard" },
            { href: "/support", label: "Support" },
            { href: "/status", label: "Status Page" },
          ].map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-white transition-colors">
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      <div className="relative z-10 border-t border-white/[0.04] py-5 text-center text-xs text-[#8b92a8]/50">
        PobbleHost &copy; {new Date().getFullYear()}
      </div>
    </div>
  );
}
