"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Search, Download, Star, RefreshCw, Package, Server, Bot,
  Puzzle, Check, HardDrive, Cpu, MemoryStick, ArrowRight,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

// ── Types ──────────────────────────────────────────────────────────────────

type Plan = {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string | null;
  ramMb: number;
  cpuPercent: number;
  diskMb: number;
  playerSlots: number;
  priceMonthly: number;
  features: string[];
};

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

// ── Constants ──────────────────────────────────────────────────────────────

const TOP_CATEGORIES = [
  { id: "minecraft", label: "Minecraft Hosting", icon: Server, color: "text-[#00c98d]", bg: "bg-[#00c98d]/10", border: "border-[#00c98d]/30" },
  { id: "discord", label: "Discord Bot Hosting", icon: Bot, color: "text-[#5865F2]", bg: "bg-[#5865F2]/10", border: "border-[#5865F2]/30" },
  { id: "mods", label: "Mods & Plugins", icon: Puzzle, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/30" },
];

const MOD_CATEGORIES = [
  { value: "plugin", label: "Plugins" },
  { value: "mod", label: "Mods" },
  { value: "modpack", label: "Modpacks" },
  { value: "resourcepack", label: "Resource Packs" },
  { value: "shader", label: "Shaders" },
  { value: "datapack", label: "Data Packs" },
];

function fmt(n: number | undefined | null) {
  if (!n) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function fmtRam(mb: number) { return mb >= 1024 ? `${mb / 1024} GB` : `${mb} MB`; }
function fmtDisk(mb: number) { return mb >= 1024 ? `${mb / 1024} GB` : `${mb} MB`; }

// ── Plan Card ──────────────────────────────────────────────────────────────

function PlanCard({ plan, accent }: { plan: Plan; accent: { color: string; btn: string; glow: string } }) {
  return (
    <div className={`relative flex flex-col rounded-2xl border border-white/[0.07] bg-[#131720] overflow-hidden transition-all hover:border-white/15 hover:scale-[1.01]`}>
      <div className={`h-1 w-full ${accent.glow}`} />
      <div className="p-5 flex-1 flex flex-col gap-4">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-widest ${accent.color}`}>{plan.type === "MINECRAFT" ? "Minecraft" : "Discord Bot"}</p>
          <h3 className="mt-1 text-lg font-bold text-white">{plan.name}</h3>
          {plan.description && <p className="mt-1 text-sm text-[#8b92a8]">{plan.description}</p>}
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-4xl font-black text-white">${(plan.priceMonthly / 100).toFixed(0)}</span>
          <span className="text-sm text-[#8b92a8]">/mo</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: MemoryStick, label: "RAM", value: fmtRam(plan.ramMb) },
            { icon: HardDrive, label: "Disk", value: fmtDisk(plan.diskMb) },
            { icon: Cpu, label: "CPU", value: `${plan.cpuPercent}%` },
          ].map((s) => (
            <div key={s.label} className="rounded-lg bg-white/[0.03] p-2 text-center">
              <s.icon className={`mx-auto mb-1 h-3.5 w-3.5 ${accent.color}`} />
              <div className="text-xs font-bold text-white">{s.value}</div>
              <div className="text-[10px] text-[#8b92a8]">{s.label}</div>
            </div>
          ))}
        </div>

        {plan.features.length > 0 && (
          <ul className="space-y-1.5 flex-1">
            {plan.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-xs text-[#c8cdd8]">
                <Check className={`h-3.5 w-3.5 shrink-0 ${accent.color}`} />
                {f}
              </li>
            ))}
          </ul>
        )}

        <Link href={`/dashboard/services/create?planId=${plan.id}`} className="mt-auto">
          <button className={`w-full rounded-xl py-2.5 text-sm font-bold text-white transition-all ${accent.btn}`}>
            Get Started <ArrowRight className="inline h-3.5 w-3.5 ml-1" />
          </button>
        </Link>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function StorePage() {
  const [category, setCategory] = useState("minecraft");
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [modCat, setModCat] = useState("plugin");
  const [projects, setProjects] = useState<ModrinthProject[]>([]);
  const [modsLoading, setModsLoading] = useState(false);

  // Fetch hosting plans
  useEffect(() => {
    if (category !== "minecraft" && category !== "discord") return;
    setPlansLoading(true);
    const type = category === "minecraft" ? "MINECRAFT" : "DISCORD_BOT";
    fetch(`/api/plans?type=${type}`)
      .then((r) => r.json())
      .then((data) => setPlans(Array.isArray(data) ? data : []))
      .catch(() => setPlans([]))
      .finally(() => setPlansLoading(false));
  }, [category]);

  // Fetch mods
  const searchMods = useCallback(async (q: string, cat: string) => {
    setModsLoading(true);
    try {
      const facets = JSON.stringify([["project_type:" + cat]]);
      const url = `https://api.modrinth.com/v2/search?query=${encodeURIComponent(q)}&facets=${encodeURIComponent(facets)}&limit=24&index=downloads`;
      const res = await fetch(url, { headers: { "User-Agent": "PobbleHost/1.0" } });
      const data = await res.json();
      setProjects(data.hits ?? []);
    } catch { setProjects([]); }
    setModsLoading(false);
  }, []);

  useEffect(() => {
    if (category === "mods") searchMods(query, modCat);
  }, [category, modCat, searchMods]);

  const minecraftAccent = { color: "text-[#00c98d]", btn: "bg-[#00c98d] hover:bg-[#00e0a0]", glow: "bg-gradient-to-r from-[#00c98d] to-[#4dd9ae]" };
  const discordAccent = { color: "text-[#5865F2]", btn: "bg-[#5865F2] hover:bg-[#4752c4]", glow: "bg-gradient-to-r from-[#5865F2] to-[#7c85f5]" };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Store</h1>
        <p className="mt-1 text-sm text-[#8b92a8]">Browse hosting plans and Minecraft resources</p>
      </div>

      {/* Top category tabs */}
      <div className="flex flex-wrap gap-3">
        {TOP_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setCategory(cat.id)}
            className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all ${
              category === cat.id
                ? `${cat.bg} ${cat.border} ${cat.color}`
                : "border-white/[0.07] bg-white/[0.02] text-[#8b92a8] hover:text-white hover:bg-white/[0.05]"
            }`}
          >
            <cat.icon className="h-4 w-4" />
            {cat.label}
          </button>
        ))}
      </div>

      {/* ── Minecraft Plans ── */}
      {category === "minecraft" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-[#00c98d]" />
            <h2 className="text-lg font-bold text-white">Minecraft Server Hosting</h2>
            <Badge className="bg-[#00c98d]/10 text-[#00c98d] border-[#00c98d]/20">Instant Deploy</Badge>
          </div>
          <p className="text-sm text-[#8b92a8]">Enterprise NVMe hardware · DDoS protection · 24/7 support · Deploy in 60 seconds</p>
          {plansLoading ? (
            <div className="flex justify-center py-16"><RefreshCw className="h-6 w-6 animate-spin text-[#8b92a8]" /></div>
          ) : plans.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <Server className="h-12 w-12 text-[#8b92a8] mb-3" />
              <p className="text-[#8b92a8]">No Minecraft plans available yet</p>
              <p className="text-xs text-[#8b92a8]/60 mt-1">Check back soon or contact support</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => <PlanCard key={plan.id} plan={plan} accent={minecraftAccent} />)}
            </div>
          )}
        </div>
      )}

      {/* ── Discord Bot Plans ── */}
      {category === "discord" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-[#5865F2]" />
            <h2 className="text-lg font-bold text-white">Discord Bot Hosting</h2>
            <Badge className="bg-[#5865F2]/10 text-[#5865F2] border-[#5865F2]/20">Node.js · Python</Badge>
          </div>
          <p className="text-sm text-[#8b92a8]">Reliable uptime for your Discord bots · Supports Node.js, Python · Always-on hosting</p>
          {plansLoading ? (
            <div className="flex justify-center py-16"><RefreshCw className="h-6 w-6 animate-spin text-[#8b92a8]" /></div>
          ) : plans.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <Bot className="h-12 w-12 text-[#8b92a8] mb-3" />
              <p className="text-[#8b92a8]">No Discord bot plans available yet</p>
              <p className="text-xs text-[#8b92a8]/60 mt-1">Plans coming soon — check back shortly</p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {plans.map((plan) => <PlanCard key={plan.id} plan={plan} accent={discordAccent} />)}
            </div>
          )}
        </div>
      )}

      {/* ── Mods & Plugins ── */}
      {category === "mods" && (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Puzzle className="h-5 w-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">Mods & Plugins</h2>
            <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20">Powered by Modrinth</Badge>
          </div>

          {/* Mod subcategory tabs */}
          <div className="flex flex-wrap gap-2">
            {MOD_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => { setModCat(cat.value); setQuery(""); }}
                className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  modCat === cat.value
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/30"
                    : "bg-white/5 text-[#8b92a8] hover:bg-white/10 hover:text-white border border-white/10"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <form onSubmit={(e) => { e.preventDefault(); searchMods(query, modCat); }} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b92a8]" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search plugins, mods, modpacks..."
                className="pl-9 border-white/10 bg-white/5 text-white placeholder:text-[#8b92a8] focus-visible:ring-purple-500"
              />
            </div>
            <Button type="submit" className="bg-purple-600 hover:bg-purple-500 text-white">Search</Button>
          </form>

          {modsLoading ? (
            <div className="flex justify-center py-16"><RefreshCw className="h-6 w-6 animate-spin text-[#8b92a8]" /></div>
          ) : projects.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <Package className="h-12 w-12 text-[#8b92a8] mb-3" />
              <p className="text-[#8b92a8]">No results found</p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {projects.map((project) => (
                <Link key={project.project_id} href={`/dashboard/store/${project.slug}`}>
                  <Card className="h-full border-white/5 bg-white/[0.02] transition-all hover:border-white/10 hover:bg-white/[0.04] cursor-pointer">
                    <CardContent className="p-4 flex flex-col gap-3 h-full">
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 shrink-0 rounded-lg overflow-hidden bg-white/5 flex items-center justify-center">
                          {project.icon_url ? (
                            <Image src={project.icon_url} alt={project.title} width={48} height={48} className="h-12 w-12 object-cover" unoptimized />
                          ) : (
                            <Package className="h-6 w-6 text-[#8b92a8]" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-white truncate text-sm">{project.title}</p>
                          <Badge variant="outline" className="mt-1 text-[10px] border-white/10 text-[#8b92a8] capitalize">{project.project_type}</Badge>
                        </div>
                      </div>
                      <p className="text-xs text-[#8b92a8] line-clamp-2 flex-1">{project.description}</p>
                      <div className="flex items-center gap-4 text-xs text-[#8b92a8] border-t border-white/5 pt-3">
                        <span className="flex items-center gap-1"><Download className="h-3 w-3" />{fmt(project.downloads)}</span>
                        <span className="flex items-center gap-1"><Star className="h-3 w-3" />{fmt(project.follows)}</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
