"use client";

import { useState, useEffect, useRef } from "react";

const TABS = ["Console", "Files", "Backups", "Settings", "Players"];

const CONSOLE_LINES = [
  { text: "[Server] Starting Minecraft server version 1.21.4...", color: "text-[#00c98d]", delay: 0 },
  { text: "[Server] Loading libraries, please wait...", color: "text-[#8b92a8]", delay: 600 },
  { text: "[Server] Environment: Java 21 (OpenJDK)", color: "text-[#8b92a8]", delay: 1100 },
  { text: "[Server] Preparing level \"world\"", color: "text-[#8b92a8]", delay: 1600 },
  { text: "[Server] Preparing start region for dimension minecraft:overworld", color: "text-[#8b92a8]", delay: 2100 },
  { text: "[Server] Done (2.847s)! For help, type \"help\"", color: "text-[#4dd9ae] font-semibold", delay: 2700 },
  { text: "[Server] 0/100 players online", color: "text-[#8b92a8]", delay: 3200 },
];

const FILES_CONTENT = [
  { name: "world/", type: "dir", size: "—" },
  { name: "plugins/", type: "dir", size: "—" },
  { name: "server.jar", type: "file", size: "48.2 MB" },
  { name: "server.properties", type: "file", size: "2.1 KB" },
  { name: "eula.txt", type: "file", size: "0.2 KB" },
  { name: "ops.json", type: "file", size: "0.4 KB" },
];

const BACKUPS_CONTENT = [
  { name: "backup-2026-05-12-20-00.tar.gz", size: "1.2 GB", date: "May 12, 8:00 PM" },
  { name: "backup-2026-05-11-20-00.tar.gz", size: "1.1 GB", date: "May 11, 8:00 PM" },
  { name: "backup-2026-05-10-20-00.tar.gz", size: "1.1 GB", date: "May 10, 8:00 PM" },
];

const PLAYERS_CONTENT = [
  { name: "Steve_Builder", status: "online", ping: "12ms" },
  { name: "Alex_Crafter", status: "online", ping: "34ms" },
  { name: "Notch", status: "online", ping: "8ms" },
];

export function PanelMockup() {
  const [activeTab, setActiveTab] = useState(0);
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [command, setCommand] = useState("");
  const [sentCommands, setSentCommands] = useState<string[]>([]);
  const consoleRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Animate console lines on mount / tab switch
  useEffect(() => {
    if (activeTab !== 0) return;
    setVisibleLines([]);
    const timers: ReturnType<typeof setTimeout>[] = [];
    CONSOLE_LINES.forEach((line, i) => {
      timers.push(setTimeout(() => setVisibleLines((prev) => [...prev, i]), line.delay));
    });
    return () => timers.forEach(clearTimeout);
  }, [activeTab]);

  // Auto-scroll console
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [visibleLines, sentCommands]);

  const handleSend = () => {
    if (!command.trim()) return;
    setSentCommands((p) => [...p, command.trim()]);
    setCommand("");
    inputRef.current?.focus();
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#0d1117] shadow-2xl shadow-[#00c98d]/5 select-none">
      {/* Title bar */}
      <div className="flex items-center gap-2 border-b border-white/[0.06] bg-[#161b27] px-4 py-3">
        <div className="h-3 w-3 rounded-full bg-red-500/70" />
        <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
        <div className="h-3 w-3 rounded-full bg-green-500/70" />
        <span className="ml-3 text-xs text-[#8b92a8]">panel.partnerhosting.com — My Server</span>
        <span className="ml-auto flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[11px] text-green-400 font-medium">Online</span>
        </span>
      </div>

      {/* Panel content */}
      <div className="flex flex-col gap-0 sm:flex-row" style={{ minHeight: 320 }}>
        {/* Sidebar */}
        <div className="flex flex-row gap-0.5 overflow-x-auto border-b border-white/[0.05] p-3 sm:flex-col sm:border-b-0 sm:border-r sm:w-44 sm:p-4">
          {TABS.map((tab, i) => (
            <button
              key={tab}
              onClick={() => setActiveTab(i)}
              className={`rounded-lg px-3 py-2 text-sm font-medium text-left whitespace-nowrap transition-all ${
                activeTab === i
                  ? "bg-[#00c98d]/15 text-[#00c98d]"
                  : "text-[#8b92a8] hover:text-white hover:bg-white/[0.05]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-hidden">
          {/* Console */}
          {activeTab === 0 && (
            <div className="flex h-full flex-col">
              <div
                ref={consoleRef}
                className="flex-1 overflow-y-auto p-4 font-mono text-xs leading-[1.9]"
                style={{ maxHeight: 260 }}
              >
                {CONSOLE_LINES.map((line, i) =>
                  visibleLines.includes(i) ? (
                    <div
                      key={i}
                      className={`${line.color} animate-[fadeIn_0.3s_ease]`}
                      style={{ animation: "fadeInLine 0.25s ease forwards" }}
                    >
                      {line.text}
                    </div>
                  ) : null
                )}
                {sentCommands.map((cmd, i) => (
                  <div key={`cmd-${i}`} className="text-white">
                    <span className="text-[#00c98d]">&gt; </span>{cmd}
                  </div>
                ))}
                {visibleLines.length === CONSOLE_LINES.length && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-[#00c98d]">&gt;</span>
                    <span className="inline-block h-[13px] w-[6px] animate-pulse bg-[#00c98d]/80" />
                  </div>
                )}
              </div>
              <div className="border-t border-white/[0.05] p-3 flex gap-2">
                <input
                  ref={inputRef}
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Type a command..."
                  className="flex-1 rounded-lg border border-white/[0.07] bg-[#161b27] px-3 py-1.5 font-mono text-xs text-white placeholder:text-[#8b92a8]/50 outline-none focus:border-[#00c98d]/30 transition-colors"
                  spellCheck={false}
                />
                <button
                  onClick={handleSend}
                  disabled={!command.trim()}
                  className="rounded-lg bg-[#00c98d]/15 px-3 py-1.5 text-xs font-bold text-[#00c98d] hover:bg-[#00c98d]/25 transition-colors disabled:opacity-30"
                >
                  Send
                </button>
              </div>
            </div>
          )}

          {/* Files */}
          {activeTab === 1 && (
            <div className="p-4 font-mono text-xs">
              <div className="mb-3 flex items-center gap-2 text-[#8b92a8]">
                <span className="text-[#00c98d]">/</span>
                <span>home/container</span>
              </div>
              <div className="space-y-0.5">
                <div className="grid grid-cols-[1fr_auto] gap-4 px-2 py-1 text-[10px] uppercase tracking-wider text-[#8b92a8]/50 border-b border-white/[0.04] mb-1">
                  <span>Name</span><span>Size</span>
                </div>
                {FILES_CONTENT.map((f, i) => (
                  <div
                    key={f.name}
                    className="grid grid-cols-[1fr_auto] gap-4 rounded px-2 py-1.5 transition-colors hover:bg-white/[0.04] cursor-pointer"
                    style={{ animationDelay: `${i * 40}ms` }}
                  >
                    <span className={f.type === "dir" ? "text-[#4dd9ae]" : "text-[#c8cdd8]"}>
                      {f.type === "dir" ? "📁 " : "📄 "}{f.name}
                    </span>
                    <span className="text-[#8b92a8]">{f.size}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Backups */}
          {activeTab === 2 && (
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-[#8b92a8]">3 of 5 slots used</span>
                <button className="rounded-lg bg-[#00c98d]/15 px-3 py-1 text-[11px] font-bold text-[#00c98d] hover:bg-[#00c98d]/25 transition-colors">
                  + Create Backup
                </button>
              </div>
              {BACKUPS_CONTENT.map((b, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2">
                  <div>
                    <p className="text-[11px] font-mono text-[#c8cdd8]">{b.name}</p>
                    <p className="text-[10px] text-[#8b92a8] mt-0.5">{b.date} · {b.size}</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button className="rounded px-2 py-1 text-[10px] text-[#8b92a8] hover:text-white hover:bg-white/[0.05] transition-colors">Restore</button>
                    <button className="rounded px-2 py-1 text-[10px] text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Settings */}
          {activeTab === 3 && (
            <div className="p-4 space-y-3 text-xs">
              {[
                { label: "Server Name", value: "My Minecraft Server" },
                { label: "Max Players", value: "100" },
                { label: "Difficulty", value: "Hard" },
                { label: "Game Mode", value: "Survival" },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2">
                  <span className="text-[#8b92a8]">{s.label}</span>
                  <span className="font-medium text-white">{s.value}</span>
                </div>
              ))}
            </div>
          )}

          {/* Players */}
          {activeTab === 4 && (
            <div className="p-4 space-y-2">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-[#8b92a8]">
                  <span className="text-[#00c98d] font-bold">3</span> / 100 players online
                </span>
              </div>
              {PLAYERS_CONTENT.map((p, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-green-400" />
                    <span className="text-sm font-medium text-white">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-[#8b92a8]">{p.ping}</span>
                    <button className="rounded px-2 py-0.5 text-[10px] text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-colors">Kick</button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
