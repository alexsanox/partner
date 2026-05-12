"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Download, Star, RefreshCw, Package, ArrowLeft, Copy, Check, ExternalLink } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";

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

const CATEGORIES = [
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

function ProjectDetail({ slug, onBack }: { slug: string; onBack: () => void }) {
  const [project, setProject] = useState<ModrinthDetail | null>(null);
  const [versions, setVersions] = useState<ModrinthVersion[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [pRes, vRes] = await Promise.all([
          fetch(`https://api.modrinth.com/v2/project/${slug}`, { headers: { "User-Agent": "PartnerHosting/1.0" } }),
          fetch(`https://api.modrinth.com/v2/project/${slug}/version?limit=10`, { headers: { "User-Agent": "PartnerHosting/1.0" } }),
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
    toast.success("Download URL copied — paste it in your file manager or use wget in console");
    setTimeout(() => setCopied(null), 2000);
  }

  if (loading) return <div className="flex justify-center py-16"><RefreshCw className="h-5 w-5 animate-spin text-slate-500" /></div>;
  if (!project) return (
    <div className="text-center py-16">
      <p className="text-slate-400">Project not found</p>
      <Button variant="ghost" onClick={onBack} className="mt-4 text-slate-400">Back</Button>
    </div>
  );

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

      <div>
        <h3 className="text-sm font-semibold text-white mb-2">Versions</h3>
        <p className="text-xs text-slate-500 mb-3">Copy the download URL and use <code className="bg-white/5 px-1 rounded">wget &lt;url&gt;</code> in the console, or paste it in the file manager.</p>
        {versions.length === 0 ? (
          <p className="text-sm text-slate-500 py-6 text-center">No versions available</p>
        ) : (
          <div className="space-y-2">
            {versions.map((ver) => {
              const file = ver.files.find((f) => f.primary) ?? ver.files[0];
              return (
                <Card key={ver.id} className="border-white/5 bg-white/[0.02]">
                  <CardContent className="flex items-center justify-between gap-3 p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{ver.name}</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {ver.loaders.map((l) => <Badge key={l} variant="outline" className="text-[10px] border-white/10 text-blue-400 capitalize">{l}</Badge>)}
                        {ver.game_versions.slice(0, 3).map((v) => <Badge key={v} variant="outline" className="text-[10px] border-white/10 text-slate-400">{v}</Badge>)}
                        {ver.game_versions.length > 3 && <Badge variant="outline" className="text-[10px] border-white/10 text-slate-500">+{ver.game_versions.length - 3}</Badge>}
                      </div>
                    </div>
                    {file && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Button size="sm" variant="outline" className="border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 text-xs gap-1.5" onClick={() => copyUrl(file.url, ver.id)}>
                          {copied === ver.id ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                          Copy URL
                        </Button>
                        <a href={file.url} download={file.filename}>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white text-xs gap-1.5">
                            <Download className="h-3.5 w-3.5" />Download
                          </Button>
                        </a>
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

export function ServerStore() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("plugin");
  const [projects, setProjects] = useState<ModrinthProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);

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

  if (selectedSlug) return <ProjectDetail slug={selectedSlug} onBack={() => setSelectedSlug(null)} />;

  return (
    <div className="space-y-4">
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
