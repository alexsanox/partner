"use client";

import { useEffect, useState, useCallback } from "react";
import { Save, Loader2, Check, Search, RotateCcw } from "lucide-react";

interface ServerPropertiesProps {
  serverId: string;
}

interface Property {
  key: string;
  value: string;
  comment?: string;
}

// Common properties with friendly labels and descriptions
const propertyMeta: Record<string, { label: string; description: string; type: "text" | "number" | "boolean" | "select"; options?: string[]; inverted?: boolean }> = {
  "gamemode": { label: "Game Mode", description: "Default game mode for new players", type: "select", options: ["survival", "creative", "adventure", "spectator"] },
  "difficulty": { label: "Difficulty", description: "Server difficulty level", type: "select", options: ["peaceful", "easy", "normal", "hard"] },
  "max-players": { label: "Max Players", description: "Maximum number of players allowed", type: "number" },
  "motd": { label: "MOTD", description: "Message shown in the server list", type: "text" },
  "pvp": { label: "PvP", description: "Allow players to fight each other", type: "boolean" },
  "spawn-protection": { label: "Spawn Protection", description: "Radius of spawn area protection (0 to disable)", type: "number" },
  "allow-nether": { label: "Allow Nether", description: "Allow players to travel to the Nether", type: "boolean" },
  "allow-flight": { label: "Allow Flight", description: "Allow players to fly in survival mode", type: "boolean" },
  "view-distance": { label: "View Distance", description: "Maximum view distance in chunks", type: "number" },
  "simulation-distance": { label: "Simulation Distance", description: "Distance for entity ticking in chunks", type: "number" },
  "level-name": { label: "World Name", description: "Name of the world folder", type: "text" },
  "level-seed": { label: "World Seed", description: "Seed for world generation", type: "text" },
  "level-type": { label: "World Type", description: "Type of world to generate", type: "select", options: ["minecraft:normal", "minecraft:flat", "minecraft:large_biomes", "minecraft:amplified", "minecraft:single_biome_surface"] },
  "online-mode": { label: "Allow Cracked", description: "Disables online mode — allows players without a Mojang account to join", type: "boolean", inverted: true },
  "white-list": { label: "Whitelist", description: "Only allow whitelisted players to join", type: "boolean" },
  "enable-command-block": { label: "Command Blocks", description: "Enable command blocks", type: "boolean" },
  "spawn-monsters": { label: "Spawn Monsters", description: "Allow hostile mobs to spawn", type: "boolean" },
  "spawn-animals": { label: "Spawn Animals", description: "Allow animals to spawn", type: "boolean" },
  "hardcore": { label: "Hardcore", description: "Enable hardcore mode (death = ban)", type: "boolean" },
  "resource-pack": { label: "Resource Pack URL", description: "URL to a resource pack", type: "text" },
  "player-idle-timeout": { label: "Idle Timeout", description: "Minutes before idle players are kicked (0 = disable)", type: "number" },
};

// Categories for grouping
const categories: { label: string; keys: string[] }[] = [
  {
    label: "General",
    keys: ["motd", "max-players", "gamemode", "difficulty", "hardcore", "pvp", "online-mode"],
  },
  {
    label: "World",
    keys: ["level-name", "level-seed", "level-type", "view-distance", "simulation-distance", "spawn-protection"],
  },
  {
    label: "Spawning",
    keys: ["spawn-monsters", "spawn-animals", "allow-nether", "allow-flight"],
  },
  {
    label: "Security",
    keys: ["white-list", "enable-command-block"],
  },
  {
    label: "Other",
    keys: ["resource-pack", "player-idle-timeout"],
  },
];

function parseProperties(raw: string): Property[] {
  const lines = raw.split("\n");
  const props: Property[] = [];
  let lastComment = "";

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("#")) {
      lastComment = trimmed.slice(1).trim();
      continue;
    }
    if (!trimmed || !trimmed.includes("=")) {
      lastComment = "";
      continue;
    }
    const eqIdx = trimmed.indexOf("=");
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim();
    props.push({ key, value, comment: lastComment || undefined });
    lastComment = "";
  }

  return props;
}

function serializeProperties(properties: Property[], rawHeader: string): string {
  const headerLines: string[] = [];
  for (const line of rawHeader.split("\n")) {
    if (line.trim().startsWith("#")) {
      headerLines.push(line);
    } else {
      break;
    }
  }

  const propLines = properties.map((p) => `${p.key}=${p.value}`);
  return [...headerLines, ...propLines].join("\n") + "\n";
}

export function ServerProperties({ serverId }: ServerPropertiesProps) {
  const [properties, setProperties] = useState<Property[]>([]);
  const [rawHeader, setRawHeader] = useState("");
  const [original, setOriginal] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [showRestart, setShowRestart] = useState(false);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("General");
  const [showAll, setShowAll] = useState(false);

  const fetchProps = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      // First check if server is running
      let serverOffline = false;
      try {
        const statusRes = await fetch(`/api/pelican/servers/${serverId}/resources`);
        if (statusRes.ok) {
          const statusData = await statusRes.json();
          serverOffline = statusData.current_state !== "running";
        } else {
          serverOffline = true;
        }
      } catch {
        serverOffline = true;
      }

      const res = await fetch(`/api/pelican/servers/${serverId}/files?file=/server.properties`);
      if (!res.ok) {
        // If server is offline, always show the friendly "start server first" message
        if (serverOffline) {
          setNotFound(true);
          return;
        }
        const text = await res.text();
        const lower = text.toLowerCase();
        if (
          res.status === 404 ||
          lower.includes("not found") ||
          lower.includes("does not exist") ||
          lower.includes("no such file") ||
          lower.includes("404") ||
          lower.includes("open /home/container/server.properties")
        ) {
          setNotFound(true);
          return;
        }
        throw new Error("Could not load server properties. Please try again later.");
      }
      const raw = await res.text();
      if (!raw.trim() || !raw.includes("=")) {
        setNotFound(true);
        return;
      }
      setRawHeader(raw);
      const parsed = parseProperties(raw);
      setProperties(parsed);
      const orig: Record<string, string> = {};
      for (const p of parsed) orig[p.key] = p.value;
      setOriginal(orig);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong loading server properties.");
    } finally {
      setLoading(false);
    }
  }, [serverId]);

  useEffect(() => {
    fetchProps();
  }, [fetchProps]);

  const handleChange = (key: string, value: string) => {
    setProperties((prev) => prev.map((p) => (p.key === key ? { ...p, value } : p)));
    setSaved(false);
  };

  const isDirty = properties.some((p) => original[p.key] !== p.value);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const content = serializeProperties(properties, rawHeader);
      const res = await fetch(`/api/pelican/servers/${serverId}/files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "write", file: "/server.properties", content }),
      });
      if (!res.ok) throw new Error("Failed to save");
      const orig: Record<string, string> = {};
      for (const p of properties) orig[p.key] = p.value;
      setOriginal(orig);
      setSaved(true);
      setShowRestart(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setProperties((prev) => prev.map((p) => ({ ...p, value: original[p.key] ?? p.value })));
    setSaved(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[#00c98d]" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="rounded-xl border border-white/[0.07] bg-[#232839] p-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#8b92a8]/10">
            <Save className="h-7 w-7 text-[#8b92a8]/40" />
          </div>
          <h3 className="text-lg font-bold text-[#8b92a8]">Settings Unavailable</h3>
          <p className="mt-2 text-sm text-[#8b92a8]/70 max-w-sm leading-relaxed">
            The server needs to be running to load settings.
            Start it from the Console tab, then come back here.
          </p>
        </div>
      </div>
    );
  }

  const propMap = new Map(properties.map((p) => [p.key, p]));

  // Get categorized keys that exist in the file
  const activeCat = categories.find((c) => c.label === activeCategory);
  const categorizedKeys = new Set(categories.flatMap((c) => c.keys));
  const uncategorizedProps = properties.filter((p) => !categorizedKeys.has(p.key));

  // Filter by search
  const filterProp = (p: Property) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const meta = propertyMeta[p.key];
    return (
      p.key.toLowerCase().includes(q) ||
      p.value.toLowerCase().includes(q) ||
      (meta?.label.toLowerCase().includes(q)) ||
      (meta?.description.toLowerCase().includes(q))
    );
  };

  const renderProperty = (p: Property) => {
    const meta = propertyMeta[p.key];
    const label = meta?.label ?? p.key;
    const desc = meta?.description ?? p.comment ?? "";
    const changed = original[p.key] !== p.value;

    return (
      <div key={p.key} className={`flex items-start gap-4 py-3.5 px-4 -mx-4 rounded-lg transition-colors ${changed ? "bg-[#00c98d]/5" : "hover:bg-white/[0.02]"}`}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-[13px] font-semibold text-[#e2e8f0]">{label}</span>
            {changed && <span className="text-[10px] font-medium text-[#00c98d] bg-[#00c98d]/10 px-1.5 py-0.5 rounded">Modified</span>}
          </div>
          <p className="text-[12px] text-[#8b92a8] mb-2">{desc}</p>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono text-[#8b92a8]/50">{p.key}</span>
          </div>
        </div>

        <div className="shrink-0 w-52">
          {meta?.type === "boolean" ? (() => {
            const isOn = meta.inverted ? p.value === "false" : p.value === "true";
            return (
              <button
                onClick={() => handleChange(p.key, p.value === "true" ? "false" : "true")}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  isOn ? "bg-[#00c98d]" : "bg-[#364052]"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                    isOn ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            );
          })() : meta?.type === "select" && meta.options ? (
            <select
              value={p.value}
              onChange={(e) => handleChange(p.key, e.target.value)}
              className="w-full rounded-lg border border-white/[0.07] bg-[#1a1e2e] px-3 py-2 text-[13px] text-[#e2e8f0] outline-none focus:border-[#00c98d]/40 transition-colors"
            >
              {meta.options.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
              {!meta.options.includes(p.value) && <option value={p.value}>{p.value}</option>}
            </select>
          ) : (
            <input
              value={p.value}
              onChange={(e) => handleChange(p.key, e.target.value)}
              className="w-full rounded-lg border border-white/[0.07] bg-[#1a1e2e] px-3 py-2 text-[13px] text-[#e2e8f0] outline-none focus:border-[#00c98d]/40 transition-colors font-mono"
              type={meta?.type === "number" ? "number" : "text"}
            />
          )}
        </div>
      </div>
    );
  };

  // Properties to display
  let displayProps: Property[] = [];
  if (search) {
    displayProps = properties.filter(filterProp);
  } else if (showAll) {
    displayProps = uncategorizedProps;
  } else if (activeCat) {
    displayProps = activeCat.keys.map((k) => propMap.get(k)).filter(Boolean) as Property[];
  }

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-xl border border-white/[0.07] bg-[#232839] p-8">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#FFAA00]/10">
              <RotateCcw className="h-7 w-7 text-[#FFAA00]/60" />
            </div>
            <h3 className="text-lg font-bold text-[#e2e8f0]">Couldn&apos;t Load Settings</h3>
            <p className="mt-2 text-sm text-[#8b92a8]/70 max-w-sm leading-relaxed">
              {error}
            </p>
            <button
              onClick={fetchProps}
              className="mt-5 rounded-lg bg-[#00c98d] px-5 py-2 text-sm font-semibold text-white hover:bg-[#4a7bef] transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {!error && showRestart && (
        <div className="flex items-center justify-between rounded-lg border border-[#FFAA00]/20 bg-[#FFAA00]/5 px-4 py-3">
          <span className="text-[13px] text-[#FFAA00]">Changes saved. Restart your server for them to take effect.</span>
          <button onClick={() => setShowRestart(false)} className="text-[12px] text-[#8b92a8] hover:text-white transition-colors ml-4 shrink-0">Dismiss</button>
        </div>
      )}

      {/* Header */}
      {!error && (
      <div className="rounded-xl border border-white/[0.07] bg-[#232839]">
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04]">
          <div>
            <h3 className="text-[15px] font-bold text-[#e2e8f0]">Server Properties</h3>
            <p className="text-[12px] text-[#8b92a8] mt-0.5">Edit server.properties — changes require a server restart</p>
          </div>
          <div className="flex items-center gap-2">
            {isDirty && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 rounded-lg border border-white/[0.07] px-3 py-2 text-[12px] font-medium text-[#8b92a8] transition-colors hover:text-white hover:bg-white/5"
              >
                <RotateCcw className="h-3 w-3" />
                Reset
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !isDirty}
              className="flex items-center gap-1.5 rounded-lg bg-[#00c98d] px-4 py-2 text-[12px] font-bold text-white transition-colors hover:bg-[#4a7bee] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {saving ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : saved ? (
                <Check className="h-3 w-3" />
              ) : (
                <Save className="h-3 w-3" />
              )}
              {saved ? "Saved!" : "Save Changes"}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b border-white/[0.04]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#8b92a8]" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search properties..."
              className="w-full rounded-lg border border-white/[0.07] bg-[#1a1e2e] pl-9 pr-3 py-2 text-[13px] text-[#e2e8f0] outline-none placeholder:text-[#6b7280] focus:border-[#00c98d]/40 transition-colors"
            />
          </div>
        </div>

        {/* Category tabs */}
        {!search && (
          <div className="flex items-center gap-0 px-5 border-b border-white/[0.04] overflow-x-auto">
            {categories.map((cat) => {
              const count = cat.keys.filter((k) => propMap.has(k)).length;
              if (count === 0) return null;
              return (
                <button
                  key={cat.label}
                  onClick={() => { setActiveCategory(cat.label); setShowAll(false); }}
                  className={`relative px-3 py-2.5 text-[12px] font-semibold whitespace-nowrap transition-colors ${
                    activeCategory === cat.label && !showAll
                      ? "text-[#00c98d]"
                      : "text-[#8b92a8] hover:text-[#c8cdd8]"
                  }`}
                >
                  {cat.label}
                  <span className="ml-1 text-[10px] text-[#8b92a8]/50">{count}</span>
                  {activeCategory === cat.label && !showAll && (
                    <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00c98d] rounded-t-full" />
                  )}
                </button>
              );
            })}
            {uncategorizedProps.length > 0 && (
              <button
                onClick={() => setShowAll(true)}
                className={`relative px-3 py-2.5 text-[12px] font-semibold whitespace-nowrap transition-colors ${
                  showAll ? "text-[#00c98d]" : "text-[#8b92a8] hover:text-[#c8cdd8]"
                }`}
              >
                Other
                <span className="ml-1 text-[10px] text-[#8b92a8]/50">{uncategorizedProps.length}</span>
                {showAll && (
                  <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#00c98d] rounded-t-full" />
                )}
              </button>
            )}
          </div>
        )}

        {/* Properties list */}
        <div className="px-5 py-2 divide-y divide-white/[0.04]">
          {displayProps.length === 0 ? (
            <div className="py-10 text-center text-[13px] text-[#8b92a8]">
              {search ? "No matching properties" : "No properties in this category"}
            </div>
          ) : (
            displayProps.map(renderProperty)
          )}
        </div>
      </div>
      )}
    </div>
  );
}
