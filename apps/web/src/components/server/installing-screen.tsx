"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Server, Loader2, CheckCircle } from "lucide-react";

interface InstallingScreenProps {
  serverId: string;
  serverName: string;
  mode?: "installing" | "rebuilding";
}

export function InstallingScreen({ serverId, serverName, mode = "installing" }: InstallingScreenProps) {
  const isRebuilding = mode === "rebuilding";
  const router = useRouter();
  const [status, setStatus] = useState<"installing" | "done">("installing");
  const [dots, setDots] = useState("");

  // Animate dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // Poll server status every 5 seconds
  useEffect(() => {
    let cancelled = false;

    const poll = async () => {
      try {
        const res = await fetch(`/api/pelican/servers/${serverId}/status`);
        if (res.ok) {
          const data = await res.json();
          if (!data.is_installing) {
            setStatus("done");
            // Wait a moment then redirect
            setTimeout(() => {
              if (!cancelled) router.refresh();
            }, 1500);
            return;
          }
        }
      } catch {
        // ignore, keep polling
      }
      if (!cancelled) {
        setTimeout(poll, 5000);
      }
    };

    poll();
    return () => { cancelled = true; };
  }, [serverId, router]);

  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="relative mb-8">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-[#232839] border border-white/[0.07]">
          <Server className="h-9 w-9 text-[#5b8cff]" />
        </div>
        {status === "installing" && (
          <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#1a1e2e] border border-white/[0.07]">
            <Loader2 className="h-4 w-4 animate-spin text-[#5b8cff]" />
          </div>
        )}
        {status === "done" && (
          <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20">
            <CheckCircle className="h-4 w-4 text-green-400" />
          </div>
        )}
      </div>

      <h2 className="text-xl font-bold text-white mb-2">{serverName}</h2>

      {status === "installing" ? (
        <>
          <p className="text-[15px] text-[#5b8cff] font-semibold mb-1">
            {isRebuilding ? "Rebuilding" : "Installing"}{dots}
          </p>
          <p className="text-sm text-[#8b92a8] max-w-md text-center leading-relaxed">
            {isRebuilding
              ? "Your server is being rebuilt with the new version. This usually takes 1–3 minutes. This page will automatically refresh when it\u2019s ready."
              : "Your server is being set up. This usually takes 1–3 minutes. This page will automatically refresh when it\u2019s ready."}
          </p>

          {/* Progress bar animation */}
          <div className="mt-8 w-64 h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
            <div className="h-full w-1/3 rounded-full bg-[#5b8cff] animate-[slide_2s_ease-in-out_infinite]" />
          </div>

          <style jsx>{`
            @keyframes slide {
              0% { transform: translateX(-100%); }
              50% { transform: translateX(200%); }
              100% { transform: translateX(-100%); }
            }
          `}</style>
        </>
      ) : (
        <>
          <p className="text-[15px] text-green-400 font-semibold mb-1">
            {isRebuilding ? "Rebuild complete!" : "Installation complete!"}
          </p>
          <p className="text-sm text-[#8b92a8]">
            Redirecting to your server...
          </p>
        </>
      )}
    </div>
  );
}
