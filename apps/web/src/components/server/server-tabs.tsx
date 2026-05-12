"use client";

import { useState, useCallback } from "react";
import { Terminal, FolderOpen, Settings, LayoutDashboard, Copy, Check, Archive, SlidersHorizontal, Users, Server, Gamepad2, Box, ShoppingBag } from "lucide-react";
import { ServerConsole } from "./server-console";
import { PowerControls } from "./power-controls";
import { ResourceUsage, type ResourceStats } from "./resource-usage";
import { FileManager } from "./file-manager";
import { ServerConfig } from "./server-config";
import { BackupManager } from "./backup-manager";
import { ServerProperties } from "./server-properties";
import { PlayerManager } from "./player-manager";
import { ServerStore } from "./server-store";
import { InstallingScreen } from "./installing-screen";

interface ServerTabsProps {
  serverId: string;
  serverName: string;
  currentState: string;
  limits: {
    memory: number;
    swap: number;
    disk: number;
    io: number;
    cpu: number;
  };
  uuid: string;
  node: string;
  description: string;
  sftpDetails: { ip: string; alias: string | null; port: number };
  allocation: { id: number; ip: string; ip_alias: string | null; port: number } | null;
  variables: {
    name: string;
    description: string;
    env_variable: string;
    default_value: string;
    server_value: string;
    is_editable: boolean;
    rules: string;
  }[];
  backupLimit: number;
  eggName: string;
  eggVersion: string;
}

const tabs = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "console", label: "Console", icon: Terminal },
  { key: "files", label: "Files", icon: FolderOpen },
  { key: "mods", label: "Mods & Plugins", icon: ShoppingBag },
  { key: "backups", label: "Backups", icon: Archive },
  { key: "players", label: "Players", icon: Users },
  { key: "settings", label: "Settings", icon: SlidersHorizontal },
  { key: "config", label: "Config", icon: Settings },
];

export function ServerTabs({
  serverId,
  serverName,
  currentState,
  limits,
  uuid,
  node,
  description,
  sftpDetails,
  allocation,
  variables,
  backupLimit,
  eggName,
  eggVersion,
}: ServerTabsProps) {
  const [activeTab, setActiveTab] = useState("overview");
  const [rebuilding, setRebuilding] = useState(false);
  const [liveStats, setLiveStats] = useState<ResourceStats | null>(null);
  const [playerCount, setPlayerCount] = useState<{ online: number; max: number } | null>(null);
  const [liveState, setLiveState] = useState(currentState);
  const handleStats = useCallback((s: unknown) => setLiveStats(s as ResourceStats), []);
  const handleStatus = useCallback((state: string) => setLiveState(state), []);

  const handleOutput = useCallback((lines: string[]) => {
    for (const line of lines) {
      const clean = line.replace(/\x1b\[[0-9;]*m/g, "");
      const m = clean.match(/There are (\d+) of a max of (\d+) players? online/);
      if (m) setPlayerCount({ online: parseInt(m[1]), max: parseInt(m[2]) });
    }
  }, []);

  const stateColors: Record<string, { dot: string; label: string; text: string }> = {
    running: { dot: "bg-green-400", label: "Online", text: "text-green-400" },
    starting: { dot: "bg-yellow-400 animate-pulse", label: "Starting", text: "text-yellow-400" },
    stopping: { dot: "bg-yellow-400 animate-pulse", label: "Stopping", text: "text-yellow-400" },
    offline: { dot: "bg-[#8b92a8]", label: "Offline", text: "text-[#8b92a8]" },
  };
  const status = stateColors[liveState] ?? stateColors.offline;

  if (rebuilding) {
    return <InstallingScreen serverId={serverId} serverName={serverName} mode="rebuilding" />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-8 w-8 items-center justify-center">
            <Server className="h-5 w-5 text-[#00c98d]" />
          </div>
          <h1 className="text-[22px] font-bold text-white">{serverName}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 ml-11">
          <span className="flex items-center gap-1.5 rounded-full bg-[#232839] px-3 py-1">
            <span className={`inline-block h-2 w-2 rounded-full ${status.dot}`} />
            <span className={`text-[12px] font-semibold ${status.text}`}>{status.label}</span>
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-[#232839] px-3 py-1">
            <Gamepad2 className="h-3 w-3 text-[#8b92a8]" />
            <span className="text-[12px] text-[#8b92a8]">{eggName}</span>
          </span>
          {eggVersion && (
            <span className="flex items-center gap-1.5 rounded-full bg-[#232839] px-3 py-1">
              <Box className="h-3 w-3 text-[#8b92a8]" />
              <span className="text-[12px] text-[#8b92a8]">{eggVersion}</span>
            </span>
          )}
          <span className="flex items-center gap-1.5 rounded-full bg-[#232839] px-3 py-1">
            <Users className="h-3 w-3 text-[#8b92a8]" />
            <span className="text-[12px] text-[#8b92a8]">
              {playerCount ? `${playerCount.online}/${playerCount.max} players` : "— players"}
            </span>
          </span>
        </div>
      </div>

      {/* Tabs — Shockbyte underline style */}
      <div className="flex items-center gap-0 border-b border-white/[0.07]">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative px-4 py-3 text-[13px] font-semibold transition-colors ${
              activeTab === tab.key
                ? "text-[#00c98d]"
                : "text-[#8b92a8] hover:text-[#c8cdd8]"
            }`}
          >
            {tab.label}
            {activeTab === tab.key && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00c98d] rounded-t-full" />
            )}
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeTab === "overview" && (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Sidebar - Server Info */}
          <div className="space-y-4">
            <div className="rounded-xl border border-white/[0.07] bg-[#232839] p-5">
              <h3 className="text-sm font-semibold text-[#e2e8f0] mb-4">Server Information</h3>
              <div className="space-y-3.5">
                <InfoRow label="Server Name" value={serverName} />
                <InfoRow label="Players" value={playerCount ? `${playerCount.online}/${playerCount.max}` : "—"} />
                {allocation && (
                  <InfoRow
                    label="IP Address"
                    value={`${allocation.ip_alias ?? allocation.ip}:${allocation.port}`}
                    mono
                    copyable
                  />
                )}
                <InfoRow label="Node" value={node} />
              </div>
              <div className="mt-5 flex gap-2">
                <PowerControls serverId={serverId} currentState={liveState} />
              </div>
            </div>
          </div>

          {/* Main area */}
          <div className="space-y-5">
            <ServerConsole serverId={serverId} onStats={handleStats} onOutput={handleOutput} onStatus={handleStatus} />
            <ResourceUsage
              serverId={serverId}
              memoryLimit={limits.memory}
              diskLimit={limits.disk}
              cpuLimit={limits.cpu}
              liveStats={liveStats}
            />
          </div>
        </div>
      )}

      {/* Console fullscreen */}
      {activeTab === "console" && (
        <div className="space-y-5">
          <ServerConsole serverId={serverId} onOutput={handleOutput} onStatus={handleStatus} />
        </div>
      )}

      {/* Files */}
      {activeTab === "files" && <FileManager serverId={serverId} />}

      {/* Backups */}
      {activeTab === "backups" && (
        <BackupManager serverId={serverId} backupLimit={backupLimit} />
      )}

      {/* Players */}
      {activeTab === "players" && (
        <PlayerManager serverId={serverId} />
      )}

      {/* Settings - server.properties */}
      {activeTab === "settings" && (
        <ServerProperties serverId={serverId} />
      )}

      {/* Mods & Plugins Store */}
      {activeTab === "mods" && <ServerStore serverId={serverId} />}

      {/* Config */}
      {activeTab === "config" && (
        <ServerConfig
          serverId={serverId}
          serverName={serverName}
          description={description}
          variables={variables}
          sftpDetails={sftpDetails}
          allocation={allocation}
          onRebuilding={() => setRebuilding(true)}
        />
      )}
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
  copyable = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
  copyable?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-[#8b92a8] mb-0.5">{label}</p>
      <div className="flex items-center gap-2">
        <p className={`text-[13px] text-[#e2e8f0] break-all ${mono ? "font-mono" : ""}`}>
          {value}
        </p>
        {copyable && (
          <button
            onClick={handleCopy}
            className="shrink-0 rounded p-0.5 text-[#8b92a8] transition-colors hover:text-white"
          >
            {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
          </button>
        )}
      </div>
    </div>
  );
}
