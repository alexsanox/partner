"use client";

import { useState, useEffect } from "react";
import { Play, Square, RotateCcw, Skull, Loader2, ChevronDown } from "lucide-react";

interface PowerControlsProps {
  serverId: string;
  currentState: string;
}

export function PowerControls({ serverId, currentState }: PowerControlsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [state, setState] = useState(currentState);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => {
    setState(currentState);
  }, [currentState]);

  const send = async (signal: string) => {
    setLoading(signal);
    setShowMore(false);
    try {
      await fetch(`/api/pelican/servers/${serverId}/power`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signal }),
      });
      if (signal === "start") setState("starting");
      if (signal === "stop") setState("stopping");
      if (signal === "restart") setState("stopping");
      if (signal === "kill") setState("offline");
    } catch {
      // ignore
    } finally {
      setLoading(null);
    }
  };

  const isOnline = state === "running";
  const isOffline = state === "offline";

  const primaryAction = isOnline || state === "starting"
    ? { label: "Shut Down", signal: "stop", bg: "bg-[#e74c4c] hover:bg-[#d43d3d]", icon: Square }
    : { label: "Start Server", signal: "start", bg: "bg-[#22c55e] hover:bg-[#16a34a]", icon: Play };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="relative flex">
        <button
          onClick={() => send(primaryAction.signal)}
          disabled={loading !== null || (primaryAction.signal === "start" && isOnline) || (primaryAction.signal === "stop" && isOffline)}
          className={`flex items-center gap-2 rounded-l-lg px-4 py-2 text-[13px] font-bold text-white transition-colors disabled:opacity-40 ${primaryAction.bg}`}
        >
          {loading === primaryAction.signal ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <primaryAction.icon className="h-3.5 w-3.5" />
          )}
          {primaryAction.label}
        </button>
        <button
          onClick={() => setShowMore((v) => !v)}
          className={`rounded-r-lg border-l border-white/20 px-2.5 py-2 text-white transition-colors ${primaryAction.bg}`}
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </button>

        {showMore && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMore(false)} />
            <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-lg border border-white/[0.07] bg-[#232839] py-1 shadow-xl">
              <DropdownItem
                icon={RotateCcw}
                label="Restart"
                onClick={() => send("restart")}
                disabled={isOffline || loading !== null}
              />
              {!isOffline && primaryAction.signal !== "stop" && (
                <DropdownItem
                  icon={Square}
                  label="Stop"
                  onClick={() => send("stop")}
                  disabled={isOffline || loading !== null}
                />
              )}
              {isOffline && (
                <DropdownItem
                  icon={Play}
                  label="Start"
                  onClick={() => send("start")}
                  disabled={isOnline || loading !== null}
                />
              )}
              <DropdownItem
                icon={Skull}
                label="Kill"
                onClick={() => send("kill")}
                disabled={isOffline || loading !== null}
                danger
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function DropdownItem({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  danger = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-2.5 px-3 py-2 text-sm transition-colors disabled:opacity-30 ${
        danger
          ? "text-red-400 hover:bg-red-500/10"
          : "text-slate-300 hover:bg-white/[0.06]"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
