"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Download, Star, RefreshCw, Package, ArrowLeft, Copy, Check, ExternalLink, ServerCrash, Zap, Upload, X } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

// ── Loader detection helpers ─────────────────────────────────────────────────
// Maps known Modrinth loader names to what Pelican egg startup variables look like
const LOADER_ALIASES: Record<string, string[]> = {
  spigot:  ["spigot", "bukkit", "craftbukkit"],
  paper:   ["paper", "spigot", "bukkit"],
  purpur:  ["purpur", "paper", "spigot"],
  folia:   ["folia", "paper"],
  bungeecord: ["bungeecord", "waterfall"],
  waterfall: ["waterfall", "bungeecord"],
  velocity: ["velocity"],
  fabric:  ["fabric"],
  forge:   ["forge", "neoforge"],
  neoforge:["neoforge", "forge"],
  quilt:   ["quilt", "fabric"],
  liteloader: ["liteloader"],
  modloader: ["forge"],
  rift:    ["rift"],
  sponge:  ["sponge"],
};

function detectLoaderFromVariables(vars: { env_variable: string; server_value?: string; default_value: string }[]): string[] {
  const allValues = vars.map((v) => `${v.env_variable}=${v.server_value ?? v.default_value}`.toLowerCase()).join(" ");
  const detected: string[] = [];
  for (const [loader] of Object.entries(LOADER_ALIASES)) {
    if (allValues.includes(loader)) detected.push(loader);
  }
  // Also detect from SERVER_JARFILE, STARTUP, docker image name etc.
  const jarVar = vars.find((v) => v.env_variable === "SERVER_JARFILE" || v.env_variable === "JAR_FILE");
  if (jarVar) {
    const val = (jarVar.server_value ?? jarVar.default_value).toLowerCase();
    for (const loader of ["spigot","paper","purpur","fabric","forge","neoforge","quilt","velocity","bungeecord","waterfall","sponge"]) {
      if (val.includes(loader) && !detected.includes(loader)) detected.push(loader);
    }
  }
  return detected.length > 0 ? detected : [];
}

function versionCompatible(verLoaders: string[], serverLoaders: string[]): boolean {
  if (serverLoaders.length === 0) return true; // unknown — show all
  const expanded = new Set<string>();
  for (const sl of serverLoaders) {
    (LOADER_ALIASES[sl] ?? [sl]).forEach((a) => expanded.add(a));
    expanded.add(sl);
  }
  return verLoaders.some((l) => expanded.has(l.toLowerCase()));
}

// ── Types ─────────────────────────────────────────────────────────────────────
type ModrinthProject = {
  project_id: string;
  slug: string;
  title: string;
  description: string;
  icon_url: string | null;
  downloads: number;
  follows: number;
  project_type: string;
  categories: string[];
};

type ModrinthVersion = {
  id: string;
  name: string;
  game_versions: string[];
  loaders: string[];
  downloads: number;
  files: { url: string; filename: string; primary: boolean }[];
};

type ModrinthDetail = {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon_url: string | null;
  downloads: number;
  follows: number;
  project_type: string;
  categories: string[];
  game_versions: string[];
  loaders: string[];
  source_url: string | null;
  license: { id: string; name: string } | null;
};

type PelicanVariable = { env_variable: string; server_value?: string; default_value: string };

const CATEGORIES = [
  { value: "plugin", label: "Plugins" },
  { value: "mod", label: "Mods" },
  { value: "modpack", label: "Modpacks" },
  { value: "resourcepack", label: "Resource Packs" },
  { value: "shader", label: "Shaders" },
  { value: "datapack", label: "Data Packs" },
];

const LOADER_COLORS: Record<string, string> = {
  spigot: "text-yellow-400 border-yellow-500/30",
  paper: "text-red-400 border-red-500/30",
  purpur: "text-purple-400 border-purple-500/30",
  fabric: "text-green-400 border-green-500/30",
  forge: "text-orange-400 border-orange-500/30",
  neoforge: "text-orange-300 border-orange-400/30",
  quilt: "text-pink-400 border-pink-500/30",
  velocity: "text-blue-400 border-blue-500/30",
  bungeecord: "text-cyan-400 border-cyan-500/30",
  waterfall: "text-sky-400 border-sky-500/30",
  sponge: "text-yellow-300 border-yellow-400/30",
};

function fmt(n: number | undefined | null) {
  if (!n) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

// ── Project Detail View ───────────────────────────────────────────────────────
function ProjectDetail({
  slug, serverId, serverLoaders, gameVersion, onBack,
}: {
  slug: string;
  serverId: string;
  serverLoaders: string[];
  gameVersion: string | null;
  onBack: () => void;
}) {
  const [project, setProject] = useState<ModrinthDetail | null>(null);
  const [versions, setVersions] = useState<ModrinthVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);
  const [installing, setInstalling] = useState<string | null>(null);
  const [filterLoader, setFilterLoader] = useState(true);
  const [filterVersion, setFilterVersion] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [pRes, vRes] = await Promise.all([
          fetch(`https://api.modrinth.com/v2/project/${slug}`, { headers: { "User-Agent": "PartnerHosting/1.0" } }),
          fetch(`https://api.modrinth.com/v2/project/${slug}/version?limit=20`, { headers: { "User-Agent": "PartnerHosting/1.0" } }),
        ]);
        const [p, v] = await Promise.all([pRes.json(), vRes.json()]);
        setProject(p);
        setVersions(Array.isArray(v) ? v : []);
      } catch {
        setProject(null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug]);

  function copyUrl(url: string, id: string) {
    navigator.clipboard.writeText(url);
    setCopied(id);
    toast.success("URL copied to clipboard");
    setTimeout(() => setCopied(null), 2000);
  }

  async function installToServer(ver: ModrinthVersion) {
    const file = ver.files.find((f) => f.primary) ?? ver.files[0];
    if (!file) return;
    setInstalling(ver.id);
    try {
      const res = await fetch(`/api/server/${serverId}/install-mod`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl: file.url, filename: file.filename, loaders: ver.loaders }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error ?? "Installation failed");
      } else {
        toast.success(data.warning ? `Installed (${data.warning})` : "Installed");
      }
    } catch {
      toast.error("Network error during installation");
    } finally {
      setInstalling(null);
    }
  }

  if (loading) return <div className="flex justify-center py-16"><RefreshCw className="h-5 w-5 animate-spin text-slate-500" /></div>;
  if (!project) return (
    <div className="text-center py-16">
      <p className="text-slate-400">Project not found</p>
      <Button variant="ghost" onClick={onBack} className="mt-4 text-slate-400">Back</Button>
    </div>
  );

  const compatibleVersions = versions.filter((v) => {
    const loaderOk = !filterLoader || serverLoaders.length === 0 || versionCompatible(v.loaders, serverLoaders);
    const versionOk = !filterVersion || !gameVersion || v.game_versions.length === 0 || v.game_versions.some((gv) => gv === gameVersion || gv.startsWith(gameVersion.split(".").slice(0, 2).join(".")));
    return loaderOk && versionOk;
  });

  return (
    <div className="space-y-5">
      <Button variant="ghost" onClick={onBack} className="gap-2 text-slate-400 hover:text-white px-0 text-sm">
        <ArrowLeft className="h-4 w-4" /> Back to results
      </Button>

      <div className="flex items-start gap-4">
        <div className="h-14 w-14 shrink-0 rounded-xl overflow-hidden bg-white/5 flex items-center justify-center">
          {project.icon_url
            ? <Image src={project.icon_url} alt={project.title} width={56} height={56} className="h-14 w-14 object-cover" unoptimized />
            : <Package className="h-7 w-7 text-slate-600" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-lg font-bold text-white">{project.title}</h2>
            <Badge variant="outline" className="border-white/10 text-slate-400 capitalize text-[10px]">{project.project_type}</Badge>
          </div>
          <p className="text-sm text-slate-400 mt-1">{project.description}</p>
          <div className="mt-2 flex gap-5 text-xs text-slate-500">
            <span className="flex items-center gap-1"><Download className="h-3 w-3" />{fmt(project.downloads)}</span>
            <span className="flex items-center gap-1"><Star className="h-3 w-3" />{fmt(project.follows)}</span>
            <a href={`https://modrinth.com/project/${project.slug}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-blue-400 transition-colors">
              <ExternalLink className="h-3 w-3" />Modrinth
            </a>
          </div>
        </div>
      </div>

      {/* Active filters */}
      {(serverLoaders.length > 0 || gameVersion) && (
        <div className="flex flex-wrap gap-2">
          {serverLoaders.length > 0 && (
            <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
              filterLoader ? "border-blue-500/30 bg-blue-500/10 text-blue-300" : "border-white/10 bg-white/5 text-slate-500 line-through"
            }`}>
              <Zap className="h-3 w-3" />
              <span className="capitalize">{serverLoaders[0]}</span>
              <button onClick={() => setFilterLoader((v) => !v)} className="ml-0.5 opacity-60 hover:opacity-100">
                {filterLoader ? "×" : "+"}
              </button>
            </div>
          )}
          {gameVersion && (
            <div className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
              filterVersion ? "border-green-500/30 bg-green-500/10 text-green-300" : "border-white/10 bg-white/5 text-slate-500 line-through"
            }`}>
              <span>MC {gameVersion}</span>
              <button onClick={() => setFilterVersion((v) => !v)} className="ml-0.5 opacity-60 hover:opacity-100">
                {filterVersion ? "×" : "+"}
              </button>
            </div>
          )}
          <span className="self-center text-xs text-slate-500">{compatibleVersions.length} of {versions.length} versions</span>
        </div>
      )}

      <div>
        <h3 className="text-sm font-semibold text-white mb-3">
          Versions {compatibleVersions.length > 0 && <span className="text-slate-500 font-normal">({compatibleVersions.length})</span>}
        </h3>
        {compatibleVersions.length === 0 ? (
          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-6 text-center">
            <ServerCrash className="h-8 w-8 text-yellow-500/50 mx-auto mb-2" />
            <p className="text-sm text-yellow-300">No compatible versions for your server&apos;s loader</p>
            <button onClick={() => { setFilterLoader(false); setFilterVersion(false); }} className="mt-2 text-xs text-slate-400 hover:text-white underline">Remove filters</button>
          </div>
        ) : (
          <div className="space-y-2">
            {compatibleVersions.map((ver, i) => {
              const file = ver.files.find((f) => f.primary) ?? ver.files[0];
              const isLatest = i === 0;
              const isInstalling = installing === ver.id;
              return (
                <Card key={ver.id} className={`border-white/5 ${isLatest ? "bg-blue-500/5 border-blue-500/20" : "bg-white/[0.02]"}`}>
                  <CardContent className="flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white truncate">{ver.name}</p>
                        {isLatest && <Badge className="text-[10px] bg-blue-500/20 text-blue-300 border-blue-500/30 border">Latest</Badge>}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {ver.loaders.map((l) => (
                          <Badge key={l} variant="outline" className={`text-[10px] capitalize ${LOADER_COLORS[l.toLowerCase()] ?? "text-slate-400 border-white/10"}`}>{l}</Badge>
                        ))}
                        {ver.game_versions.slice(0, 3).map((v) => (
                          <Badge key={v} variant="outline" className="text-[10px] border-white/10 text-slate-400">{v}</Badge>
                        ))}
                        {ver.game_versions.length > 3 && (
                          <Badge variant="outline" className="text-[10px] border-white/10 text-slate-500">+{ver.game_versions.length - 3}</Badge>
                        )}
                      </div>
                    </div>
                    {file && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm" variant="outline"
                          className="border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 text-xs gap-1.5"
                          onClick={() => copyUrl(file.url, ver.id)}
                        >
                          {copied === ver.id ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                          Copy URL
                        </Button>
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-500 text-white text-xs gap-1.5 min-w-[110px]"
                          onClick={() => installToServer(ver)}
                          disabled={isInstalling}
                        >
                          {isInstalling
                            ? <><RefreshCw className="h-3.5 w-3.5 animate-spin" />Installing...</>
                            : <><Download className="h-3.5 w-3.5" />Install to Server</>
                          }
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main ServerStore ──────────────────────────────────────────────────────────
export function ServerStore({ serverId }: { serverId: string }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("plugin");
  const [projects, setProjects] = useState<ModrinthProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [serverLoaders, setServerLoaders] = useState<string[]>([]);
  const [gameVersion, setGameVersion] = useState<string | null>(null);
  const [mrpackInstalling, setMrpackInstalling] = useState(false);
  const mrpackRef = useRef<HTMLInputElement>(null);

  async function handleMrpackUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    setMrpackInstalling(true);
    try {
      const form = new FormData();
      form.append("serverId", serverId);
      form.append("mrpack", file);
      const res = await fetch("/api/server/install-mrpack", { method: "POST", body: form });
      const data = await res.json();
      if (res.ok) {
        toast.success(`${data.modpack}: ${data.installed} mods installed${data.failed > 0 ? `, ${data.failed} failed` : ""}`);
      } else {
        toast.error(data.error ?? "Modpack install failed");
      }
    } catch {
      toast.error("Network error during modpack install");
    } finally {
      setMrpackInstalling(false);
    }
  }

  // Detect server loader from Pelican variables
  useEffect(() => {
    async function detectLoader() {
      try {
        const res = await fetch(`/api/pelican/servers/${serverId}/startup`);
        if (!res.ok) return;
        const data = await res.json();
        const vars: PelicanVariable[] = data.variables ?? [];
        const loaders = detectLoaderFromVariables(vars);
        setServerLoaders(loaders);
        if (data.gameVersion) setGameVersion(data.gameVersion);
        // Auto-select best category
        if (loaders.some((l) => ["fabric","forge","neoforge","quilt","liteloader"].includes(l))) {
          setCategory("mod");
        } else {
          setCategory("plugin");
        }
      } catch { /* silent */ }
    }
    detectLoader();
  }, [serverId]);

  const search = useCallback(async (q: string, cat: string) => {
    setLoading(true);
    try {
      const facets = JSON.stringify([["project_type:" + cat]]);
      const url = `https://api.modrinth.com/v2/search?query=${encodeURIComponent(q)}&facets=${encodeURIComponent(facets)}&limit=20&index=downloads`;
      const res = await fetch(url, { headers: { "User-Agent": "PartnerHosting/1.0" } });
      const data = await res.json();
      setProjects(data.hits ?? []);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { search("", category); }, [category, search]);

  if (selectedSlug) return (
    <ProjectDetail
      slug={selectedSlug}
      serverId={serverId}
      serverLoaders={serverLoaders}
      gameVersion={gameVersion}
      onBack={() => setSelectedSlug(null)}
    />
  );

  return (
    <div className="space-y-4">
      {/* Mrpack install */}
      <div className="flex items-center justify-between rounded-lg border border-white/[0.07] bg-[#1a1e2e] px-4 py-3">
          <div>
            <p className="text-[13px] font-semibold text-white">Install Modpack</p>
            <p className="text-[11px] text-[#8b92a8]">Upload a .mrpack file to install all mods at once</p>
          </div>
          <label className={`flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-[12px] font-medium cursor-pointer hover:bg-white/10 transition-colors ${mrpackInstalling ? "opacity-50 pointer-events-none" : ""}`}>
            {mrpackInstalling ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {mrpackInstalling ? "Installing..." : "Upload .mrpack"}
            <input ref={mrpackRef} type="file" accept=".mrpack" className="hidden" onChange={handleMrpackUpload} />
          </label>
        </div>

      {/* Loader badge */}
      {serverLoaders.length > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-white/5 bg-white/[0.02] px-3 py-2">
          <Zap className="h-3.5 w-3.5 text-blue-400" />
          <span className="text-xs text-slate-400">Server loader detected:</span>
          {serverLoaders.map((l) => (
            <Badge key={l} variant="outline" className={`text-[10px] capitalize ${LOADER_COLORS[l] ?? "text-slate-400 border-white/10"}`}>{l}</Badge>
          ))}
        </div>
      )}

      {/* Search */}
      <form onSubmit={(e) => { e.preventDefault(); search(query, category); }} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search plugins, mods..." className="pl-9 border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus-visible:ring-blue-500" />
        </div>
        <Button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white">Search</Button>
      </form>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button key={cat.value} onClick={() => { setCategory(cat.value); setQuery(""); }}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${category === cat.value ? "bg-blue-600 text-white" : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10"}`}>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-16"><RefreshCw className="h-5 w-5 animate-spin text-slate-500" /></div>
      ) : projects.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <Package className="mb-3 h-10 w-10 text-slate-600" />
          <p className="text-slate-400">No results found</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((p) => (
            <button key={p.project_id} onClick={() => setSelectedSlug(p.slug)} className="text-left">
              <Card className="h-full border-white/5 bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04] transition-all cursor-pointer">
                <CardContent className="p-4 flex flex-col gap-2.5 h-full">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-lg overflow-hidden bg-white/5 flex items-center justify-center">
                      {p.icon_url
                        ? <Image src={p.icon_url} alt={p.title} width={40} height={40} className="h-10 w-10 object-cover" unoptimized />
                        : <Package className="h-5 w-5 text-slate-600" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">{p.title}</p>
                      <Badge variant="outline" className="mt-0.5 text-[10px] border-white/10 text-slate-400 capitalize">{p.project_type}</Badge>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2 flex-1">{p.description}</p>
                  <div className="flex gap-4 text-xs text-slate-500 border-t border-white/5 pt-2.5">
                    <span className="flex items-center gap-1"><Download className="h-3 w-3" />{fmt(p.downloads)}</span>
                    <span className="flex items-center gap-1"><Star className="h-3 w-3" />{fmt(p.follows)}</span>
                  </div>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
