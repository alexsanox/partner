"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Users,
  RefreshCcw,
  Loader2,
  MapPin,
  Skull,
  Heart,
  Utensils,
  Shield,
  ShieldOff,
  ArrowUpRight,
  UserX,
  ChevronDown,
  ChevronUp,
  Package,
  X,
  Swords,
  Eye,
  Compass,
  Sparkles,
  Plus,
  Trash2,
  ListChecks,
} from "lucide-react";

interface PlayerManagerProps {
  serverId: string;
}

interface InvSlot {
  slot: number;
  id: string;
  count: number;
}

interface Player {
  name: string;
  pos?: { x: number; y: number; z: number };
  dimension?: string;
  gamemode?: string;
  health?: number;
  foodLevel?: number;
  level?: number;
  inventory?: InvSlot[];
}

const GM_ICONS: Record<string, typeof Swords> = {
  survival: Swords,
  creative: Sparkles,
  adventure: Compass,
  spectator: Eye,
};

const GM_COLORS: Record<string, string> = {
  survival: "text-orange-400 bg-orange-400/10",
  creative: "text-emerald-400 bg-emerald-400/10",
  adventure: "text-sky-400 bg-sky-400/10",
  spectator: "text-purple-400 bg-purple-400/10",
};

function itemName(id: string): string {
  return id.replace("minecraft:", "").replace(/_/g, " ");
}

function itemIcon(id: string): string {
  // Convert minecraft:spruce_log -> Spruce_Log -> Invicon_Spruce_Log.png
  const raw = id.replace("minecraft:", "");
  const pascal = raw.split("_").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join("_");
  return `https://minecraft.wiki/images/Invicon_${pascal}.png`;
}

function parseInventory(data: string): InvSlot[] {
  const slots: InvSlot[] = [];
  let invContent = "";
  const invIdx = data.indexOf("Inventory: [");
  if (invIdx !== -1) {
    const start = data.indexOf("[", invIdx);
    let depth = 0;
    let end = start;
    for (let i = start; i < data.length; i++) {
      if (data[i] === "[") depth++;
      else if (data[i] === "]") { depth--; if (depth === 0) { end = i; break; } }
    }
    invContent = data.slice(start + 1, end);
  } else {
    const dataIdx = data.indexOf("entity data: [");
    if (dataIdx !== -1) {
      const start = data.indexOf("[", dataIdx);
      let depth = 0;
      let end = start;
      for (let i = start; i < data.length; i++) {
        if (data[i] === "[") depth++;
        else if (data[i] === "]") { depth--; if (depth === 0) { end = i; break; } }
      }
      invContent = data.slice(start + 1, end);
    }
  }
  if (!invContent) return slots;
  let m;
  const blockRe = /\{([^}]+)\}/g;
  while ((m = blockRe.exec(invContent)) !== null) {
    const b = m[1];
    const slotM = b.match(/[Ss]lot:\s*(-?\d+)/);
    const idM = b.match(/id:\s*"([^"]+)"/) || b.match(/id:\s*([^\s,}]+)/);
    const countM = b.match(/[Cc]ount:\s*(\d+)/);
    if (slotM && idM) {
      slots.push({
        slot: parseInt(slotM[1]),
        id: idM[1].replace(/"/g, "").trim(),
        count: countM ? parseInt(countM[1]) : 1,
      });
    }
  }
  return slots;
}

export function PlayerManager({ serverId }: PlayerManagerProps) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [invLoading, setInvLoading] = useState<string | null>(null);
  const [tpTarget, setTpTarget] = useState<string | null>(null);
  const [tpCoords, setTpCoords] = useState({ x: "", y: "", z: "" });
  const [wlInput, setWlInput] = useState("");
  const [wlPlayers, setWlPlayers] = useState<string[]>([]);
  const [wlLoading, setWlLoading] = useState(false);
  const outputBuffer = useRef<string[]>([]);
  const esRef = useRef<EventSource | null>(null);
  const readyRef = useRef(false);
  const refreshTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const sendCmd = useCallback(
    async (cmd: string) => {
      try {
        await fetch(`/api/pelican/servers/${serverId}/command`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ command: cmd }),
        });
      } catch {}
    },
    [serverId]
  );

  const waitForOutput = useCallback(
    (pattern: RegExp, timeoutMs = 3000): Promise<string | null> => {
      return new Promise((resolve) => {
        const start = Date.now();
        const check = () => {
          for (let i = outputBuffer.current.length - 1; i >= 0; i--) {
            if (pattern.test(outputBuffer.current[i])) {
              resolve(outputBuffer.current[i]);
              return;
            }
          }
          if (Date.now() - start > timeoutMs) { resolve(null); return; }
          setTimeout(check, 100);
        };
        check();
      });
    },
    []
  );

  const fetchPlayers = useCallback(async () => {
    outputBuffer.current = [];
    await sendCmd("list");

    const line = await waitForOutput(/There are \d+ of a max/i, 3000);
    if (!line) { setPlayers([]); setLoading(false); return; }

    const match = line.match(/players online:\s*(.*)/i);
    if (!match || !match[1]?.trim()) { setPlayers([]); setLoading(false); return; }

    const names = match[1].split(",").map((n) => n.trim()).filter(Boolean);
    const newPlayers: Player[] = names.map((name) => ({ name }));
    setPlayers(newPlayers);
    setLoading(false);

    // Fetch entity data per player
    const gamemodes = ["survival", "creative", "adventure", "spectator"];
    for (const player of newPlayers) {
      await sendCmd(`data get entity ${player.name}`);
      const data = await waitForOutput(new RegExp(`${player.name} has the following entity data`, "i"), 2000);
      if (data) {
        const posMatch = data.match(/Pos:\s*\[([-\d.]+)d?,\s*([-\d.]+)d?,\s*([-\d.]+)d?\]/);
        const healthMatch = data.match(/Health:\s*([\d.]+)f/);
        const foodMatch = data.match(/foodLevel:\s*(\d+)/);
        const gmMatch = data.match(/playerGameType:\s*(\d+)/);
        const lvlMatch = data.match(/XpLevel:\s*(\d+)/);
        const dimMatch = data.match(/Dimension:\s*"([^"]+)"/);

        setPlayers((prev) =>
          prev.map((p) =>
            p.name === player.name
              ? {
                  ...p,
                  pos: posMatch ? { x: Math.round(parseFloat(posMatch[1])), y: Math.round(parseFloat(posMatch[2])), z: Math.round(parseFloat(posMatch[3])) } : undefined,
                  health: healthMatch ? parseFloat(healthMatch[1]) : undefined,
                  foodLevel: foodMatch ? parseInt(foodMatch[1]) : undefined,
                  gamemode: gmMatch ? gamemodes[parseInt(gmMatch[1])] ?? "unknown" : undefined,
                  level: lvlMatch ? parseInt(lvlMatch[1]) : undefined,
                  dimension: dimMatch ? dimMatch[1].replace("minecraft:", "") : undefined,
                  inventory: parseInventory(data),
                }
              : p
          )
        );
      }
    }
  }, [sendCmd, waitForOutput]);

  const fetchInventory = useCallback(async (name: string) => {
    setInvLoading(name);
    outputBuffer.current = [];
    await sendCmd(`data get entity ${name}`);
    const data = await waitForOutput(new RegExp(`${name} has the following entity data`, "i"), 3000);
    if (data) {
      const slots = parseInventory(data);
      setPlayers((prev) =>
        prev.map((p) => (p.name === name ? { ...p, inventory: slots } : p))
      );
    }
    setInvLoading(null);
  }, [sendCmd, waitForOutput]);

  const fetchWhitelist = useCallback(async () => {
    setWlLoading(true);
    outputBuffer.current = [];
    await sendCmd("whitelist list");
    const line = await waitForOutput(/whitelisted player|no whitelisted/i, 3000);
    if (line) {
      const match = line.match(/whitelisted player(?:\(s\)|s)?:\s*(.*)/i);
      if (match && match[1]?.trim()) {
        setWlPlayers(match[1].split(",").map((n) => n.trim()).filter(Boolean));
      } else {
        setWlPlayers([]);
      }
    }
    setWlLoading(false);
  }, [sendCmd, waitForOutput]);

  const addToWhitelist = useCallback(async (name: string) => {
    await sendCmd(`whitelist add ${name}`);
    setTimeout(fetchWhitelist, 1000);
  }, [sendCmd, fetchWhitelist]);

  const removeFromWhitelist = useCallback(async (name: string) => {
    await sendCmd(`whitelist remove ${name}`);
    setTimeout(fetchWhitelist, 1000);
  }, [sendCmd, fetchWhitelist]);

  // Own SSE connection for reading command output
  useEffect(() => {
    const es = new EventSource(`/api/pelican/servers/${serverId}/console`);
    esRef.current = es;
    es.addEventListener("output", (e) => {
      try {
        const lines: string[] = JSON.parse(e.data);
        outputBuffer.current.push(...lines.map((l) => l.replace(/\x1b\[[0-9;]*m/g, "")));
        if (outputBuffer.current.length > 300) outputBuffer.current = outputBuffer.current.slice(-150);
      } catch {}
    });
    es.addEventListener("auth", () => {
      readyRef.current = true;
      fetchPlayers();
      fetchWhitelist();
    });
    es.onerror = () => {};
    refreshTimerRef.current = setInterval(fetchPlayers, 15000);
    return () => {
      readyRef.current = false;
      es.close();
      esRef.current = null;
      if (refreshTimerRef.current) clearInterval(refreshTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serverId]);

  const doAction = async (name: string, action: string, extra?: string) => {
    setActionLoading(`${name}-${action}`);
    try {
      switch (action) {
        case "kill": await sendCmd(`kill ${name}`); break;
        case "kick": await sendCmd(`kick ${name}`); break;
        case "op": await sendCmd(`op ${name}`); break;
        case "deop": await sendCmd(`deop ${name}`); break;
        case "tp": if (extra) await sendCmd(`tp ${name} ${extra}`); break;
        case "gamemode": if (extra) await sendCmd(`gamemode ${extra} ${name}`); break;
        case "heal": await sendCmd(`effect give ${name} minecraft:instant_health 1 255`); break;
        case "feed": await sendCmd(`effect give ${name} minecraft:saturation 1 255`); break;
      }
      setTimeout(fetchPlayers, 1000);
    } catch { setError("Failed to execute command"); }
    finally { setActionLoading(null); }
  };

  const toggleExpand = (name: string) => {
    if (expanded === name) { setExpanded(null); return; }
    setExpanded(name);
    const player = players.find((p) => p.name === name);
    if (!player?.inventory) fetchInventory(name);
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="flex items-center justify-between rounded-lg border border-[#e74c4c]/20 bg-[#e74c4c]/5 px-4 py-3 text-[13px] text-[#e74c4c]">
          {error}
          <button onClick={() => setError(null)} className="text-[#8b92a8] hover:text-white"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {/* Header card */}
      <div className="rounded-xl border border-white/[0.07] bg-[#232839]">
        <div className="flex items-center justify-between px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-[#5b8cff]/10">
              <Users className="h-4.5 w-4.5 text-[#5b8cff]" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-[#e2e8f0]">Online Players</h3>
              <p className="text-[12px] text-[#8b92a8]">{players.length} player{players.length !== 1 ? "s" : ""} connected</p>
            </div>
          </div>
          <button
            onClick={() => { setLoading(true); fetchPlayers(); }}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.07] px-3.5 py-2 text-[12px] font-medium text-[#8b92a8] transition-colors hover:text-white hover:bg-white/5 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
            Refresh
          </button>
        </div>
      </div>

      {/* TP bar */}
      {tpTarget && (
        <div className="rounded-xl border border-[#5b8cff]/20 bg-[#5b8cff]/5 px-5 py-3">
          <div className="flex items-center gap-3">
            <ArrowUpRight className="h-4 w-4 text-[#5b8cff] shrink-0" />
            <span className="text-[13px] text-[#e2e8f0] font-medium shrink-0">Teleport {tpTarget}</span>
            <div className="flex items-center gap-1.5 flex-1">
              {(["x", "y", "z"] as const).map((axis) => (
                <input
                  key={axis}
                  value={tpCoords[axis]}
                  onChange={(e) => setTpCoords((p) => ({ ...p, [axis]: e.target.value }))}
                  placeholder={axis.toUpperCase()}
                  className="w-20 rounded-lg border border-white/[0.07] bg-[#1a1e2e] px-2.5 py-1.5 text-[12px] text-[#e2e8f0] outline-none focus:border-[#5b8cff]/40 font-mono text-center"
                />
              ))}
            </div>
            <button
              onClick={() => { doAction(tpTarget, "tp", `${tpCoords.x} ${tpCoords.y} ${tpCoords.z}`); setTpTarget(null); setTpCoords({ x: "", y: "", z: "" }); }}
              disabled={!tpCoords.x || !tpCoords.y || !tpCoords.z}
              className="rounded-lg bg-[#5b8cff] px-4 py-1.5 text-[12px] font-bold text-white hover:bg-[#4a7bee] disabled:opacity-40 transition-colors"
            >
              Teleport
            </button>
            <button onClick={() => { setTpTarget(null); setTpCoords({ x: "", y: "", z: "" }); }} className="text-[#8b92a8] hover:text-white transition-colors">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Player cards */}
      {loading && players.length === 0 ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-[#5b8cff]" />
        </div>
      ) : players.length === 0 ? (
        <div className="rounded-xl border border-white/[0.07] bg-[#232839] text-center py-20">
          <Users className="h-10 w-10 text-[#8b92a8]/20 mx-auto mb-3" />
          <p className="text-[14px] font-medium text-[#8b92a8]">No players online</p>
          <p className="text-[12px] text-[#8b92a8]/50 mt-1">Players will appear here when they join the server</p>
        </div>
      ) : (
        <div className="space-y-3">
          {players.map((player) => {
            const isExpanded = expanded === player.name;
            const GmIcon = GM_ICONS[player.gamemode ?? ""] ?? Swords;
            const gmColor = GM_COLORS[player.gamemode ?? ""] ?? "text-[#8b92a8] bg-white/5";
            const healthPct = player.health !== undefined ? Math.min(100, (player.health / 20) * 100) : 0;
            const foodPct = player.foodLevel !== undefined ? Math.min(100, (player.foodLevel / 20) * 100) : 0;

            return (
              <div key={player.name} className="rounded-xl border border-white/[0.07] bg-[#232839] overflow-hidden transition-all">
                {/* Player row */}
                <div
                  className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-white/[0.02] transition-colors"
                  onClick={() => toggleExpand(player.name)}
                >
                  {/* Avatar */}
                  <div className="relative shrink-0">
                    <img
                      src={`https://mc-heads.net/avatar/${player.name}/40`}
                      alt={player.name}
                      className="h-10 w-10 rounded-lg shadow-md"
                      onError={(e) => { (e.target as HTMLImageElement).src = `https://mc-heads.net/avatar/MHF_Steve/40`; }}
                    />
                    <div className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-green-500 border-2 border-[#232839]" />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5">
                      <span className="text-[14px] font-bold text-[#e2e8f0]">{player.name}</span>
                      {player.gamemode && (
                        <span className={`flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${gmColor}`}>
                          <GmIcon className="h-2.5 w-2.5" />
                          {player.gamemode}
                        </span>
                      )}
                      {player.level !== undefined && player.level > 0 && (
                        <span className="text-[10px] font-semibold text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">
                          Lvl {player.level}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-[12px] text-[#8b92a8]">
                      {player.pos && (
                        <span className="flex items-center gap-1 font-mono text-[11px]">
                          <MapPin className="h-3 w-3 text-[#5b8cff]" />
                          {player.pos.x}, {player.pos.y}, {player.pos.z}
                        </span>
                      )}
                      {player.dimension && (
                        <span className="capitalize">{player.dimension}</span>
                      )}
                    </div>
                  </div>

                  {/* Health / food bars */}
                  <div className="hidden sm:flex flex-col gap-1.5 w-28 shrink-0">
                    {player.health !== undefined && (
                      <div className="flex items-center gap-1.5">
                        <Heart className="h-3 w-3 text-red-400 shrink-0" />
                        <div className="flex-1 h-1.5 rounded-full bg-[#1a1e2e] overflow-hidden">
                          <div className="h-full rounded-full bg-red-400 transition-all duration-500" style={{ width: `${healthPct}%` }} />
                        </div>
                        <span className="text-[10px] font-mono text-[#8b92a8] w-6 text-right">{Math.round(player.health)}</span>
                      </div>
                    )}
                    {player.foodLevel !== undefined && (
                      <div className="flex items-center gap-1.5">
                        <Utensils className="h-3 w-3 text-amber-400 shrink-0" />
                        <div className="flex-1 h-1.5 rounded-full bg-[#1a1e2e] overflow-hidden">
                          <div className="h-full rounded-full bg-amber-400 transition-all duration-500" style={{ width: `${foodPct}%` }} />
                        </div>
                        <span className="text-[10px] font-mono text-[#8b92a8] w-6 text-right">{player.foodLevel}</span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <ActionBtn title="Teleport" active={tpTarget === player.name} onClick={() => setTpTarget(tpTarget === player.name ? null : player.name)} icon={ArrowUpRight} />
                    <ActionBtn title="Heal" loading={actionLoading === `${player.name}-heal`} onClick={() => doAction(player.name, "heal")} icon={Heart} />
                    <ActionBtn title="Feed" loading={actionLoading === `${player.name}-feed`} onClick={() => doAction(player.name, "feed")} icon={Utensils} />
                    <ActionBtn title="Kill" loading={actionLoading === `${player.name}-kill`} onClick={() => doAction(player.name, "kill")} icon={Skull} danger />
                    <ActionBtn title="Kick" loading={actionLoading === `${player.name}-kick`} onClick={() => doAction(player.name, "kick")} icon={UserX} danger />
                  </div>

                  {/* Expand toggle */}
                  <div className="shrink-0 text-[#8b92a8]">
                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  </div>
                </div>

                {/* Expanded panel */}
                {isExpanded && (
                  <div className="border-t border-white/[0.04] bg-[#1c2030]">
                    {/* Action bar */}
                    <div className="flex items-center gap-2 px-5 py-3 border-b border-white/[0.04] overflow-x-auto">
                      <span className="text-[11px] uppercase tracking-wider text-[#8b92a8] shrink-0 mr-1">Gamemode</span>
                      {(["survival", "creative", "adventure", "spectator"] as const).map((gm) => {
                        const Icon = GM_ICONS[gm] ?? Swords;
                        const active = player.gamemode === gm;
                        return (
                          <button
                            key={gm}
                            onClick={() => doAction(player.name, "gamemode", gm)}
                            disabled={actionLoading === `${player.name}-gamemode`}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold capitalize transition-colors ${
                              active ? "bg-[#5b8cff] text-white" : "border border-white/[0.07] text-[#8b92a8] hover:text-white hover:bg-white/5"
                            }`}
                          >
                            <Icon className="h-3 w-3" />
                            {gm}
                          </button>
                        );
                      })}
                      <div className="flex-1" />
                      <span className="text-[11px] uppercase tracking-wider text-[#8b92a8] shrink-0 mr-1">Role</span>
                      <button
                        onClick={() => doAction(player.name, "op")}
                        className="flex items-center gap-1.5 rounded-lg border border-white/[0.07] px-3 py-1.5 text-[11px] font-semibold text-[#8b92a8] hover:text-emerald-400 hover:border-emerald-400/20 hover:bg-emerald-400/5 transition-colors"
                      >
                        <Shield className="h-3 w-3" /> OP
                      </button>
                      <button
                        onClick={() => doAction(player.name, "deop")}
                        className="flex items-center gap-1.5 rounded-lg border border-white/[0.07] px-3 py-1.5 text-[11px] font-semibold text-[#8b92a8] hover:text-red-400 hover:border-red-400/20 hover:bg-red-400/5 transition-colors"
                      >
                        <ShieldOff className="h-3 w-3" /> De-OP
                      </button>
                    </div>

                    {/* Inventory */}
                    <div className="px-5 py-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Package className="h-3.5 w-3.5 text-[#8b92a8]" />
                        <span className="text-[12px] font-semibold text-[#e2e8f0]">Inventory</span>
                        <button
                          onClick={() => fetchInventory(player.name)}
                          disabled={invLoading === player.name}
                          className="ml-auto text-[11px] text-[#5b8cff] hover:text-[#7da8ff] transition-colors"
                        >
                          {invLoading === player.name ? "Loading..." : "Refresh"}
                        </button>
                      </div>

                      {invLoading === player.name && !player.inventory ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-4 w-4 animate-spin text-[#5b8cff]" />
                        </div>
                      ) : !player.inventory || player.inventory.length === 0 ? (
                        <div className="text-center py-6 text-[12px] text-[#8b92a8]/50">
                          Inventory is empty
                        </div>
                      ) : (
                        <div className="rounded-lg bg-[#1a1e2e] p-3 border border-white/[0.04]">
                          {/* Armor row */}
                          {(() => {
                            const armorSlots = [
                              { slot: 103, label: "Helmet" },
                              { slot: 102, label: "Chest" },
                              { slot: 101, label: "Legs" },
                              { slot: 100, label: "Boots" },
                              { slot: -106, label: "Offhand" },
                            ];
                            return (
                              <div className="flex gap-1 mb-2 justify-center">
                                {armorSlots.map((a) => {
                                  const item = player.inventory?.find((s) => s.slot === a.slot);
                                  return <InvSlotCell key={a.slot} item={item ?? null} label={a.label} />;
                                })}
                              </div>
                            );
                          })()}
                          {/* Main inventory (slots 9-35) */}
                          <div className="grid grid-cols-9 gap-1 mb-2">
                            {Array.from({ length: 27 }, (_, i) => {
                              const item = player.inventory?.find((s) => s.slot === i + 9) ?? null;
                              return <InvSlotCell key={i + 9} item={item} />;
                            })}
                          </div>
                          {/* Hotbar (slots 0-8) — highlighted */}
                          <div className="grid grid-cols-9 gap-1 pt-2 border-t border-white/[0.06]">
                            {Array.from({ length: 9 }, (_, i) => {
                              const item = player.inventory?.find((s) => s.slot === i) ?? null;
                              return <InvSlotCell key={i} item={item} hotbar />;
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Whitelist Management */}
      <div className="rounded-xl border border-white/[0.07] bg-[#232839]">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.04]">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-emerald-500/10">
              <ListChecks className="h-4.5 w-4.5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-[#e2e8f0]">Whitelist</h3>
              <p className="text-[12px] text-[#8b92a8]">{wlPlayers.length} player{wlPlayers.length !== 1 ? "s" : ""} whitelisted</p>
            </div>
          </div>
          <button
            onClick={fetchWhitelist}
            disabled={wlLoading}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.07] px-3.5 py-2 text-[12px] font-medium text-[#8b92a8] transition-colors hover:text-white hover:bg-white/5 disabled:opacity-50"
          >
            {wlLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCcw className="h-3.5 w-3.5" />}
            Refresh
          </button>
        </div>

        {/* Add player */}
        <div className="px-5 py-3 border-b border-white/[0.04]">
          <div className="flex items-center gap-2">
            <input
              value={wlInput}
              onChange={(e) => setWlInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && wlInput.trim()) { addToWhitelist(wlInput.trim()); setWlInput(""); } }}
              placeholder="Player name..."
              className="flex-1 rounded-lg border border-white/[0.07] bg-[#1a1e2e] px-3 py-2 text-[13px] text-[#e2e8f0] outline-none focus:border-[#5b8cff]/40 placeholder:text-[#8b92a8]/40"
            />
            <button
              onClick={() => { if (wlInput.trim()) { addToWhitelist(wlInput.trim()); setWlInput(""); } }}
              disabled={!wlInput.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-[12px] font-bold text-white hover:bg-emerald-600 disabled:opacity-40 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Add
            </button>
          </div>
        </div>

        {/* Whitelisted players list */}
        {wlPlayers.length === 0 ? (
          <div className="text-center py-10">
            <ListChecks className="h-8 w-8 text-[#8b92a8]/20 mx-auto mb-2" />
            <p className="text-[12px] text-[#8b92a8]/50">No players whitelisted</p>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {wlPlayers.map((name) => (
              <div key={name} className="flex items-center gap-3 px-5 py-2.5 hover:bg-white/[0.02] transition-colors">
                <img
                  src={`https://mc-heads.net/avatar/${name}/24`}
                  alt={name}
                  className="h-6 w-6 rounded"
                  onError={(e) => { (e.target as HTMLImageElement).src = `https://mc-heads.net/avatar/MHF_Steve/24`; }}
                />
                <span className="flex-1 text-[13px] text-[#e2e8f0]">{name}</span>
                <button
                  onClick={() => removeFromWhitelist(name)}
                  className="rounded-md p-1.5 text-[#8b92a8] hover:bg-red-500/10 hover:text-red-400 transition-colors"
                  title="Remove from whitelist"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InvSlotCell({ item, label, hotbar }: { item: InvSlot | null; label?: string; hotbar?: boolean }) {
  const [imgOk, setImgOk] = useState(true);

  return (
    <div
      className={`group relative aspect-square rounded border flex items-center justify-center overflow-hidden ${
        hotbar ? "bg-[#8b8b8b]/20 border-[#373737]" : "bg-[#8b8b8b]/10 border-[#373737]/60"
      } ${item ? "hover:brightness-125" : ""}`}
    >
      {item ? (
        <>
          {imgOk ? (
            <img
              src={itemIcon(item.id)}
              alt={itemName(item.id)}
              className="w-8 h-8 drop-shadow-sm"
              style={{ imageRendering: "pixelated" }}
              draggable={false}
              onError={() => setImgOk(false)}
            />
          ) : (
            <span className="text-[8px] text-[#c8cdd8] capitalize text-center leading-tight px-0.5 truncate">
              {itemName(item.id)}
            </span>
          )}
          {item.count > 1 && (
            <span className="absolute bottom-px right-0.5 text-[11px] font-bold text-white leading-none" style={{ textShadow: "2px 2px 0 #3f3f3f, -1px -1px 0 #3f3f3f, 1px -1px 0 #3f3f3f, -1px 1px 0 #3f3f3f" }}>
              {item.count}
            </span>
          )}
          {/* Minecraft-style tooltip */}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-1.5 py-0.5 rounded-sm bg-[#100010]/95 border border-[#2d0a63] text-[11px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-30 shadow-lg">
            <span className="capitalize">{itemName(item.id)}</span>
          </div>
        </>
      ) : label ? (
        <span className="text-[7px] text-[#8b92a8]/20 uppercase tracking-tight">{label}</span>
      ) : null}
    </div>
  );
}

function ActionBtn({
  title,
  icon: Icon,
  onClick,
  danger = false,
  active = false,
  loading = false,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  danger?: boolean;
  active?: boolean;
  loading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={loading}
      className={`rounded-lg p-2 transition-colors disabled:opacity-50 ${
        active
          ? "bg-[#5b8cff]/10 text-[#5b8cff]"
          : danger
            ? "text-[#8b92a8] hover:bg-red-500/10 hover:text-red-400"
            : "text-[#8b92a8] hover:bg-white/5 hover:text-white"
      }`}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
    </button>
  );
}
