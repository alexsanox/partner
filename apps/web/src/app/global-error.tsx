"use client";

import { useEffect } from "react";
import { RefreshCw, Zap } from "lucide-react";

export default function GlobalError({
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
    <html lang="en">
      <body className="min-h-screen bg-[#0d1117] flex flex-col items-center justify-center px-4 text-center font-sans antialiased">
        <div className="pointer-events-none fixed inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/3 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/5 blur-[120px]" />
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-red-500/20 bg-red-500/5">
            <Zap className="h-7 w-7 text-red-400" />
          </div>

          <h1 className="text-3xl font-black text-white mb-3">Critical Error</h1>
          <p className="text-[#8b92a8] max-w-md leading-relaxed mb-8">
            The application encountered a critical error and could not recover.
            Please refresh the page.
          </p>

          {error.digest && (
            <p className="mb-8 rounded-lg border border-white/[0.06] bg-white/[0.03] px-4 py-2 font-mono text-xs text-[#8b92a8]">
              Error ID: <span className="text-white">{error.digest}</span>
            </p>
          )}

          <button
            onClick={reset}
            className="flex items-center gap-2 rounded-xl bg-[#00c98d] px-6 py-3 text-sm font-bold text-white hover:bg-[#00b07d] transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Reload Page
          </button>
        </div>
      </body>
    </html>
  );
}
