"use client";

import { useEffect, useState } from "react";

export interface ResourceStats {
  memory_bytes: number;
  cpu_absolute: number;
  disk_bytes: number;
  network: { rx_bytes: number; tx_bytes: number };
  uptime: number;
  state: string;
}

interface ResourceUsageProps {
  serverId: string;
  memoryLimit: number;
  diskLimit: number;
  cpuLimit: number;
  liveStats?: ResourceStats | null;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

export function ResourceUsage({ serverId, memoryLimit, diskLimit, cpuLimit, liveStats }: ResourceUsageProps) {
  const [restStats, setRestStats] = useState<ResourceStats | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Initial fetch from REST so we have data before the first SSE stats event
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/pelican/servers/${serverId}/resources`);
        if (res.ok) {
          const data = await res.json();
          if (data.resources) {
            const r = data.resources;
            setRestStats({
              memory_bytes: r.memory_bytes,
              cpu_absolute: r.cpu_absolute,
              disk_bytes: r.disk_bytes,
              network: { rx_bytes: r.network_rx_bytes, tx_bytes: r.network_tx_bytes },
              uptime: r.uptime,
              state: data.current_state,
            });
          }
        }
      } catch {}
    })();
  }, [serverId]);

  const r = liveStats ?? restStats;
  const cpuPct = r?.cpu_absolute ?? 0;
  const memMb = r?.memory_bytes ? r.memory_bytes / (1024 * 1024) : 0;
  const diskGb = r?.disk_bytes ? r.disk_bytes / (1024 * 1024 * 1024) : 0;
  const diskLimitDisplay = diskLimit === 0 ? "∞" : `${Math.round(diskLimit / 1024)} GB`;

  const rows = [
    {
      label: "CPU",
      value: r ? `${cpuPct.toFixed(1)}%` : "—",
      pct: cpuLimit > 0 ? Math.min(100, (cpuPct / cpuLimit) * 100) : 0,
      dotColor: "bg-green-400",
      barColor: "bg-green-500",
    },
    {
      label: "RAM",
      value: r ? `${Math.round(memMb)} / ${memoryLimit} MB` : "—",
      pct: memoryLimit > 0 ? Math.min(100, (memMb / memoryLimit) * 100) : 0,
      dotColor: "bg-blue-400",
      barColor: "bg-blue-500",
    },
    {
      label: "Storage",
      value: r ? `${diskGb.toFixed(1)} / ${diskLimitDisplay}` : "—",
      pct: diskLimit > 0 ? Math.min(100, (diskGb / (diskLimit / 1024)) * 100) : 1,
      dotColor: "bg-red-400",
      barColor: "bg-red-500",
    },
  ];

  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#232839] p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[15px] font-bold text-[#e2e8f0]">Usage</h3>
        <button onClick={() => setShowAdvanced(!showAdvanced)} className="text-[12px] text-[#5b8cff] hover:text-[#7da8ff] cursor-pointer transition-colors">
          {showAdvanced ? "Hide Advanced" : "Show Advanced"}
        </button>
      </div>
      <div className="space-y-4">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-4">
            <div className="flex items-center gap-2.5 w-24 shrink-0">
              <div className={`h-2.5 w-2.5 rounded-full ${row.dotColor}`} />
              <span className="text-[13px] font-semibold text-[#e2e8f0]">{row.label}</span>
            </div>
            <span className="text-[13px] font-mono text-[#8b92a8] w-36 shrink-0 text-right">{row.value}</span>
            <div className="flex-1 h-2 rounded-full bg-[#1a1e2e] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${row.barColor}`}
                style={{ width: `${Math.max(row.pct, 1)}%` }}
              />
            </div>
          </div>
        ))}

        {showAdvanced && r && (
          <>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2.5 w-24 shrink-0">
                <div className="h-2.5 w-2.5 rounded-full bg-purple-400" />
                <span className="text-[13px] font-semibold text-[#e2e8f0]">Net In</span>
              </div>
              <span className="text-[13px] font-mono text-[#8b92a8] w-36 shrink-0 text-right">{formatBytes(r.network?.rx_bytes ?? 0)}</span>
              <div className="flex-1" />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2.5 w-24 shrink-0">
                <div className="h-2.5 w-2.5 rounded-full bg-orange-400" />
                <span className="text-[13px] font-semibold text-[#e2e8f0]">Net Out</span>
              </div>
              <span className="text-[13px] font-mono text-[#8b92a8] w-36 shrink-0 text-right">{formatBytes(r.network?.tx_bytes ?? 0)}</span>
              <div className="flex-1" />
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2.5 w-24 shrink-0">
                <div className="h-2.5 w-2.5 rounded-full bg-cyan-400" />
                <span className="text-[13px] font-semibold text-[#e2e8f0]">Uptime</span>
              </div>
              <span className="text-[13px] font-mono text-[#8b92a8] w-36 shrink-0 text-right">{formatUptime(r.uptime)}</span>
              <div className="flex-1" />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function formatUptime(ms: number): string {
  if (ms === 0) return "—";
  const seconds = Math.floor(ms / 1000);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}
