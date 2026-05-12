"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { RefreshCcw } from "lucide-react";

interface ServerConsoleProps {
  serverId: string;
  onStats?: (stats: unknown) => void;
  onOutput?: (lines: string[]) => void;
  onStatus?: (state: string) => void;
}

export function ServerConsole({ serverId, onStats, onOutput, onStatus }: ServerConsoleProps) {
  const [lines, setLines] = useState<string[]>([]);
  const [command, setCommand] = useState("");
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const mountedRef = useRef(true);
  const [autoScroll, setAutoScroll] = useState(true);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);

  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectRef = useRef<() => void>(() => {});
  const backoffRef = useRef(3000);
  const eulaAcceptedRef = useRef(false);
  const onStatsRef = useRef(onStats);
  onStatsRef.current = onStats;
  const onOutputRef = useRef(onOutput);
  onOutputRef.current = onOutput;
  const onStatusRef = useRef(onStatus);
  onStatusRef.current = onStatus;

  const scheduleReconnect = useCallback(() => {
    if (!mountedRef.current) return;
    if (reconnectTimer.current) return;
    const delay = backoffRef.current;
    backoffRef.current = Math.min(delay * 2, 30000);
    reconnectTimer.current = setTimeout(() => {
      reconnectTimer.current = null;
      if (mountedRef.current) connectRef.current();
    }, delay);
  }, []);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
      reconnectTimer.current = null;
    }
    eventSourceRef.current?.close();
    setError(null);

    const es = new EventSource(`/api/pelican/servers/${serverId}/console`);
    eventSourceRef.current = es;

    es.addEventListener("auth", () => {
      setConnected(true);
      setError(null);
      backoffRef.current = 3000; // reset backoff on success
      // Auto-send list command so player count is available immediately
      fetch(`/api/pelican/servers/${serverId}/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: "list" }),
      }).catch(() => {});
    });

    es.addEventListener("output", (e) => {
      try {
        const outputLines: string[] = JSON.parse(e.data);
        setLines((prev) => {
          const next = [...prev, ...outputLines];
          return next.length > 1000 ? next.slice(-1000) : next;
        });
        onOutputRef.current?.(outputLines);

        // Auto-accept EULA if prompted
        if (!eulaAcceptedRef.current) {
          for (const line of outputLines) {
            if (line.includes("Go to eula.txt for more info") || line.includes("You need to agree to the EULA")) {
              eulaAcceptedRef.current = true;
              setLines((prev) => [...prev, "[Auto] Accepting EULA and restarting server..."]);
              fetch(`/api/pelican/servers/${serverId}/files`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "write", file: "/eula.txt", content: "eula=true\n" }),
              })
                .then(() =>
                  fetch(`/api/pelican/servers/${serverId}/power`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ signal: "restart" }),
                  })
                )
                .catch(() => {});
              break;
            }
          }
        }
      } catch {
        // ignore
      }
    });

    es.addEventListener("stats", (e) => {
      try {
        const args = JSON.parse(e.data);
        const raw = args[0] ?? args;
        const stats = typeof raw === "string" ? JSON.parse(raw) : raw;
        onStatsRef.current?.(stats);
      } catch {}
    });

    es.addEventListener("status", (e) => {
      setLines((prev) => [...prev, `[Server] Status changed to ${e.data}`]);
      onStatusRef.current?.(e.data);
    });

    es.addEventListener("disconnected", () => {
      setConnected(false);
      setError("Reconnecting...");
      es.close();
      scheduleReconnect();
    });

    es.addEventListener("error", () => {
      setConnected(false);
      setError("Connection error. Retrying...");
      es.close();
      scheduleReconnect();
    });

    es.onerror = () => {
      if (!mountedRef.current) return;
      setConnected(false);
      setError("Connection lost. Retrying...");
      es.close();
      scheduleReconnect();
    };
  }, [serverId, scheduleReconnect]);

  connectRef.current = connect;

  const manualReconnect = useCallback(() => {
    eventSourceRef.current?.close();
    setError(null);
    setConnected(false);
    connect();
  }, [connect]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      eventSourceRef.current?.close();
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
    };
  }, [connect]);

  useEffect(() => {
    if (consoleRef.current && autoScroll) {
      requestAnimationFrame(() => {
        if (consoleRef.current) {
          consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
        }
      });
    }
  }, [lines, autoScroll]);

  const handleScroll = () => {
    if (!consoleRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = consoleRef.current;
    setAutoScroll(scrollHeight - scrollTop - clientHeight < 60);
  };

  const handleSend = async () => {
    if (!command.trim()) return;
    setCmdHistory((prev) => [command.trim(), ...prev.slice(0, 49)]);
    setHistoryIdx(-1);
    try {
      await fetch(`/api/pelican/servers/${serverId}/command`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: command.trim() }),
      });
      setCommand("");
    } catch {
      // ignore
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSend();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (cmdHistory.length > 0 && historyIdx < cmdHistory.length - 1) {
        const next = historyIdx + 1;
        setHistoryIdx(next);
        setCommand(cmdHistory[next] || "");
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (historyIdx > 0) {
        const next = historyIdx - 1;
        setHistoryIdx(next);
        setCommand(cmdHistory[next] || "");
      } else {
        setHistoryIdx(-1);
        setCommand("");
      }
    }
  };

  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#232839] overflow-hidden">
      {/* Console header */}
      <div className="flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-2.5">
          <span className="text-[15px] font-bold text-[#e2e8f0]">Console</span>
          <div className="flex items-center gap-1.5 ml-1">
            <div
              className={`h-2 w-2 rounded-full ${
                connected
                  ? "bg-green-400"
                  : error
                    ? "bg-red-400"
                    : "bg-yellow-400 animate-pulse"
              }`}
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          {!connected && (
            <button
              onClick={manualReconnect}
              className="text-[12px] text-[#5b8cff] hover:text-[#7da8ff] transition-colors"
            >
              Reconnect
            </button>
          )}
        </div>
      </div>

      {/* Console output */}
      <div
        ref={consoleRef}
        onScroll={handleScroll}
        className="h-[420px] overflow-y-auto overflow-x-hidden px-5 py-3 bg-[#1a1e2e] text-[13px] leading-[1.75]"
        style={{ fontFamily: 'var(--font-mono), "JetBrains Mono", Menlo, Consolas, monospace' }}
      >
        {lines.length === 0 ? (
          <div className="pt-1">
            <span className="text-[#6b7280]">
              {connected ? "Waiting for output..." : ""}
            </span>
            <span className="inline-block w-[7px] h-[14px] bg-[#5b8cff]/70 animate-pulse ml-0.5 align-middle" />
          </div>
        ) : (
          lines.map((line, i) => (
            <div
              key={i}
              className="hover:bg-white/[0.03] -mx-5 px-5"
              dangerouslySetInnerHTML={{ __html: formatConsoleLine(line) }}
            />
          ))
        )}
      </div>

      {/* Scroll to bottom indicator */}
      {!autoScroll && lines.length > 0 && (
        <div className="flex justify-center -mt-8 relative z-10 pb-2">
          <button
            onClick={() => {
              setAutoScroll(true);
              consoleRef.current?.scrollTo({ top: consoleRef.current.scrollHeight, behavior: "smooth" });
            }}
            className="rounded-full bg-blue-600/90 px-3 py-1 text-[11px] font-medium text-white shadow-lg backdrop-blur transition-colors hover:bg-blue-500"
          >
            ↓ New output
          </button>
        </div>
      )}

      {/* Command input */}
      <div className="bg-[#1a1e2e] border-t border-white/[0.07] px-5 py-3">
        <input
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Enter a command..."
          className="w-full bg-[#2a3048] rounded-lg px-4 py-2.5 text-[13px] text-[#c8ccd4] outline-none placeholder:text-[#6b7280] border border-white/[0.07] focus:border-[#5b8cff]/40 transition-colors"
          style={{ fontFamily: 'var(--font-mono), "JetBrains Mono", Menlo, Consolas, monospace' }}
          spellCheck={false}
          autoComplete="off"
        />
      </div>
    </div>
  );
}

function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, "");
}

function escapeHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Minecraft § color code map
const mcColors: Record<string, string> = {
  "0": "#000000", "1": "#0000AA", "2": "#00AA00", "3": "#00AAAA",
  "4": "#AA0000", "5": "#AA00AA", "6": "#FFAA00", "7": "#AAAAAA",
  "8": "#555555", "9": "#5555FF", a: "#55FF55", b: "#55FFFF",
  c: "#FF5555", d: "#FF55FF", e: "#FFFF55", f: "#FFFFFF",
};

function stripMcCodes(text: string): string {
  return text.replace(/§[0-9a-fk-or]/gi, "");
}

function formatConsoleLine(raw: string): string {
  const text = escapeHtml(stripAnsi(raw));

  // Match Shockbyte format: "5/2 4:41:32 AM [Info] message"
  const tsMatch = text.match(/^(\d{1,2}\/\d{1,2}\s+\d{1,2}:\d{2}:\d{2}\s+(?:AM|PM))\s+/i);
  const simpleTs = text.match(/^\[(\d{2}:\d{2}:\d{2})\]\s*/);
  let timestamp = "";
  let rest = text;

  if (tsMatch) {
    timestamp = `<span style="color:#6b7280" class="mr-2 select-text">${tsMatch[1]}</span>`;
    rest = text.slice(tsMatch[0].length);
  } else if (simpleTs) {
    timestamp = `<span style="color:#6b7280" class="mr-2 select-text">${simpleTs[1]}</span>`;
    rest = text.slice(simpleTs[0].length);
  }

  // Handle § color codes (Minecraft section sign)
  if (text.includes("§")) {
    let colored = "";
    let currentColor = "#c8ccd4";
    const parts = text.split(/§([0-9a-fk-or])/gi);
    colored = `<span style="color:${currentColor}">`;
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        colored += parts[i];
      } else {
        const code = parts[i].toLowerCase();
        if (mcColors[code]) {
          currentColor = mcColors[code];
          colored += `</span><span style="color:${currentColor}">`;
        }
      }
    }
    colored += "</span>";
    return colored;
  }

  const containerMatch = text.match(/^container~/);
  if (containerMatch) {
    return `<span style="color:#8b92a8">${text}</span>`;
  }

  let html = rest;

  html = html.replace(
    /\[(\w+)\/(\w+)\]/g,
    '<span style="color:#8b92a8">[$1/$2]</span>'
  );

  html = html.replace(
    /\[(Info|INFO)\]/gi,
    '<span style="color:#6b9fff">[Info]</span>'
  );
  html = html.replace(
    /\[(Warn|WARNING|WARN)\]/gi,
    '<span style="color:#f0b429">[Warn]</span>'
  );
  html = html.replace(
    /\[(Error|ERROR|SEVERE)\]/gi,
    '<span style="color:#e74c4c">[Error]</span>'
  );
  html = html.replace(
    /\[(Debug|DEBUG)\]/gi,
    '<span style="color:#8b92a8">[Debug]</span>'
  );

  html = html.replace(
    /(\w{3,16}) (joined the game|left the game|logged in|lost connection)/g,
    '<span style="color:#4ade80">$1</span> <span style="color:#8b92a8">$2</span>'
  );

  html = html.replace(
    /Done \([\d.]+s\)!/g,
    (m) => `<span style="color:#4ade80;font-weight:600">${m}</span>`
  );

  if (/error|exception|crash|failed/i.test(rest)) {
    html = `<span style="color:#e74c4c">${html}</span>`;
  }

  return `<span style="color:#c8ccd4">${timestamp}${html}</span>`;
}
