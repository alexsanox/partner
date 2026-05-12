"use client";

import { useEffect, useState, use } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Download, Star, ExternalLink, Package, RefreshCw, Copy, Check } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";

type ModrinthProject = {
  id: string;
  slug: string;
  title: string;
  description: string;
  body: string;
  icon_url: string | null;
  downloads: number;
  follows: number;
  project_type: string;
  categories: string[];
  versions: string[];
  source_url: string | null;
  wiki_url: string | null;
  issues_url: string | null;
  license: { id: string; name: string } | null;
  game_versions: string[];
  loaders: string[];
};

type ModrinthVersion = {
  id: string;
  name: string;
  version_number: string;
  game_versions: string[];
  loaders: string[];
  downloads: number;
  date_published: string;
  files: { url: string; filename: string; primary: boolean }[];
};

function formatDownloads(n: number | undefined | null) {
  if (!n) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export default function StoreProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const [project, setProject] = useState<ModrinthProject | null>(null);
  const [versions, setVersions] = useState<ModrinthVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [projRes, versRes] = await Promise.all([
          fetch(`https://api.modrinth.com/v2/project/${slug}`, { headers: { "User-Agent": "PartnerHosting/1.0" } }),
          fetch(`https://api.modrinth.com/v2/project/${slug}/version?limit=10`, { headers: { "User-Agent": "PartnerHosting/1.0" } }),
        ]);
        const [proj, vers] = await Promise.all([projRes.json(), versRes.json()]);
        setProject(proj);
        setVersions(Array.isArray(vers) ? vers : []);
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
    toast.success("Download URL copied to clipboard");
    setTimeout(() => setCopied(null), 2000);
  }

  const typeColor: Record<string, string> = {
    mod: "bg-violet-500/10 text-violet-400 border-violet-500/20",
    plugin: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    modpack: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    resourcepack: "bg-green-500/10 text-green-400 border-green-500/20",
    shader: "bg-pink-500/10 text-pink-400 border-pink-500/20",
    datapack: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-5 w-24 rounded bg-white/5 animate-pulse" />
        <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8">
          <div className="flex gap-5">
            <div className="h-20 w-20 rounded-2xl bg-white/5 animate-pulse shrink-0" />
            <div className="flex-1 space-y-3">
              <div className="h-7 w-48 rounded bg-white/5 animate-pulse" />
              <div className="h-4 w-full rounded bg-white/5 animate-pulse" />
              <div className="h-4 w-2/3 rounded bg-white/5 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="flex justify-center py-10">
          <RefreshCw className="h-5 w-5 animate-spin text-slate-600" />
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5">
          <Package className="h-8 w-8 text-slate-600" />
        </div>
        <p className="text-lg font-semibold text-white">Project not found</p>
        <p className="mt-1 text-sm text-slate-500">This project may have been removed from Modrinth.</p>
        <Link href="/dashboard/store" className="mt-6">
          <Button variant="outline" className="border-white/10 text-slate-300 hover:text-white gap-2">
            <ArrowLeft className="h-4 w-4" />Back to Store
          </Button>
        </Link>
      </div>
    );
  }

  const latestVersion = versions[0];
  const latestFile = latestVersion?.files.find((f) => f.primary) ?? latestVersion?.files[0];

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href="/dashboard/store">
        <button className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-white transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back to Store
        </button>
      </Link>

      {/* Hero card */}
      <div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-[#161b27]">
        {/* Subtle top gradient accent */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent" />

        <div className="p-6 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            {/* Icon */}
            <div className="h-20 w-20 shrink-0 rounded-2xl overflow-hidden ring-1 ring-white/10 bg-[#0f1219] flex items-center justify-center">
              {project.icon_url ? (
                <Image src={project.icon_url} alt={project.title} width={80} height={80} className="h-20 w-20 object-cover" unoptimized />
              ) : (
                <Package className="h-9 w-9 text-slate-600" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5 mb-2">
                <h1 className="text-2xl font-bold text-white">{project.title}</h1>
                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold capitalize ${typeColor[project.project_type] ?? "bg-white/5 text-slate-400 border-white/10"}`}>
                  {project.project_type}
                </span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed max-w-2xl">{project.description}</p>

              {/* Stats row */}
              <div className="mt-4 flex flex-wrap items-center gap-5">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-500/10">
                    <Download className="h-3.5 w-3.5 text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{formatDownloads(project.downloads)}</p>
                    <p className="text-[10px] text-slate-500 leading-none">Downloads</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-yellow-500/10">
                    <Star className="h-3.5 w-3.5 text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{formatDownloads(project.follows)}</p>
                    <p className="text-[10px] text-slate-500 leading-none">Followers</p>
                  </div>
                </div>
                <div className="ml-auto flex items-center gap-2">
                  {project.source_url && (
                    <a href={project.source_url} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-slate-300 hover:text-white gap-1.5 text-xs h-8">
                        <ExternalLink className="h-3.5 w-3.5" />Source
                      </Button>
                    </a>
                  )}
                  <a href={`https://modrinth.com/project/${project.slug}`} target="_blank" rel="noopener noreferrer">
                    <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-slate-300 hover:text-white gap-1.5 text-xs h-8">
                      <ExternalLink className="h-3.5 w-3.5" />Modrinth
                    </Button>
                  </a>
                  {latestFile && (
                    <a href={latestFile.url} download={latestFile.filename}>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white gap-1.5 text-xs h-8 font-semibold">
                        <Download className="h-3.5 w-3.5" />Latest Version
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main grid */}
      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        {/* Versions */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-white">All Versions</h2>
            <div className="flex items-center gap-1.5 rounded-lg bg-blue-500/10 border border-blue-500/20 px-3 py-1.5">
              <Copy className="h-3 w-3 text-blue-400" />
              <span className="text-[11px] text-blue-400 font-medium">Copy URL → paste into file manager or <code className="font-mono">wget</code></span>
            </div>
          </div>

          {versions.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center rounded-2xl border border-white/5 bg-white/[0.02]">
              <Package className="mb-3 h-9 w-9 text-slate-600" />
              <p className="text-slate-400 text-sm">No versions available</p>
            </div>
          ) : (
            <div className="space-y-2">
              {versions.map((ver, i) => {
                const primaryFile = ver.files.find((f) => f.primary) ?? ver.files[0];
                const isLatest = i === 0;
                return (
                  <div key={ver.id} className={`group relative rounded-xl border transition-all ${isLatest ? "border-blue-500/30 bg-blue-500/[0.04]" : "border-white/[0.06] bg-white/[0.02] hover:border-white/10 hover:bg-white/[0.04]"}`}>
                    {isLatest && (
                      <div className="absolute right-3 top-3">
                        <span className="rounded-full bg-blue-500/20 border border-blue-500/30 px-2 py-0.5 text-[10px] font-semibold text-blue-400">Latest</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-4 p-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap pr-16">
                          <p className="text-sm font-semibold text-white">{ver.name}</p>
                          <span className="text-[11px] text-slate-500 font-mono">{ver.version_number}</span>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {ver.loaders.map((l) => (
                            <span key={l} className="inline-flex items-center rounded-md bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] font-medium text-blue-400 capitalize">{l}</span>
                          ))}
                          {ver.game_versions.slice(0, 4).map((v) => (
                            <span key={v} className="inline-flex items-center rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] font-medium text-slate-400">{v}</span>
                          ))}
                          {ver.game_versions.length > 4 && (
                            <span className="inline-flex items-center rounded-md bg-white/5 border border-white/10 px-2 py-0.5 text-[10px] text-slate-500">+{ver.game_versions.length - 4} more</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="hidden sm:flex items-center gap-1 text-xs text-slate-500">
                          <Download className="h-3 w-3" />{formatDownloads(ver.downloads)}
                        </span>
                        {primaryFile && (
                          <>
                            <Button size="sm" variant="outline"
                              className="border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white gap-1.5 text-xs h-8"
                              onClick={() => copyUrl(primaryFile.url, ver.id)}>
                              {copied === ver.id
                                ? <><Check className="h-3.5 w-3.5 text-green-400" />Copied!</>
                                : <><Copy className="h-3.5 w-3.5" />Copy URL</>}
                            </Button>
                            <a href={primaryFile.url} download={primaryFile.filename}>
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white gap-1.5 text-xs h-8">
                                <Download className="h-3.5 w-3.5" />Download
                              </Button>
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Categories */}
          {project.categories.length > 0 && (
            <div className="rounded-xl border border-white/[0.06] bg-[#161b27] p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Categories</p>
              <div className="flex flex-wrap gap-1.5">
                {project.categories.map((c) => (
                  <span key={c} className="rounded-full bg-white/5 border border-white/10 px-2.5 py-1 text-[11px] text-slate-300 capitalize">{c}</span>
                ))}
              </div>
            </div>
          )}

          {/* Loaders */}
          {project.loaders?.length > 0 && (
            <div className="rounded-xl border border-white/[0.06] bg-[#161b27] p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Loaders</p>
              <div className="flex flex-wrap gap-1.5">
                {project.loaders.map((l) => (
                  <span key={l} className="rounded-full bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 text-[11px] text-blue-400 capitalize">{l}</span>
                ))}
              </div>
            </div>
          )}

          {/* Game versions */}
          {project.game_versions?.length > 0 && (
            <div className="rounded-xl border border-white/[0.06] bg-[#161b27] p-4 space-y-3">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Game Versions</p>
              <div className="flex flex-wrap gap-1.5">
                {project.game_versions.slice(0, 8).map((v) => (
                  <span key={v} className="rounded-full bg-white/5 border border-white/10 px-2.5 py-1 text-[11px] text-slate-300 font-mono">{v}</span>
                ))}
                {project.game_versions.length > 8 && (
                  <span className="rounded-full bg-white/5 border border-white/10 px-2.5 py-1 text-[11px] text-slate-500">+{project.game_versions.length - 8} more</span>
                )}
              </div>
            </div>
          )}

          {/* License */}
          {project.license && (
            <div className="rounded-xl border border-white/[0.06] bg-[#161b27] p-4 space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">License</p>
              <p className="text-xs text-slate-300">{project.license.name}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
