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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <RefreshCw className="h-6 w-6 animate-spin text-slate-500" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <Package className="mb-4 h-12 w-12 text-slate-600" />
        <p className="text-lg font-medium text-slate-400">Project not found</p>
        <Link href="/dashboard/store" className="mt-4">
          <Button variant="ghost" className="text-slate-400">Back to Store</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back */}
      <Link href="/dashboard/store">
        <Button variant="ghost" className="gap-2 text-slate-400 hover:text-white px-0">
          <ArrowLeft className="h-4 w-4" />
          Back to Store
        </Button>
      </Link>

      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="h-16 w-16 shrink-0 rounded-xl overflow-hidden bg-white/5 flex items-center justify-center">
          {project.icon_url ? (
            <Image src={project.icon_url} alt={project.title} width={64} height={64} className="h-16 w-16 object-cover" unoptimized />
          ) : (
            <Package className="h-8 w-8 text-slate-600" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-bold text-white">{project.title}</h1>
            <Badge variant="outline" className="border-white/10 text-slate-400 capitalize">{project.project_type}</Badge>
          </div>
          <p className="mt-1 text-sm text-slate-400">{project.description}</p>
          <div className="mt-3 flex items-center gap-6 text-sm text-slate-500">
            <span className="flex items-center gap-1.5"><Download className="h-4 w-4" />{formatDownloads(project.downloads)} downloads</span>
            <span className="flex items-center gap-1.5"><Star className="h-4 w-4" />{formatDownloads(project.follows)} followers</span>
            {project.source_url && (
              <a href={project.source_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 hover:text-white transition-colors">
                <ExternalLink className="h-4 w-4" />Source
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Versions */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-lg font-semibold text-white">Versions</h2>
          <p className="text-xs text-slate-500">Copy the download URL and paste it into your server&apos;s file manager or use <code className="bg-white/5 px-1 rounded">wget</code> in the console.</p>
          {versions.length === 0 ? (
            <Card className="border-white/5 bg-white/[0.02]">
              <CardContent className="py-8 text-center text-slate-500">No versions available</CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {versions.map((ver) => {
                const primaryFile = ver.files.find((f) => f.primary) ?? ver.files[0];
                return (
                  <Card key={ver.id} className="border-white/5 bg-white/[0.02]">
                    <CardContent className="flex items-center justify-between gap-4 p-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-white truncate">{ver.name}</p>
                        <div className="mt-1 flex flex-wrap gap-1.5">
                          {ver.loaders.map((l) => (
                            <Badge key={l} variant="outline" className="text-[10px] border-white/10 text-blue-400 capitalize">{l}</Badge>
                          ))}
                          {ver.game_versions.slice(0, 3).map((v) => (
                            <Badge key={v} variant="outline" className="text-[10px] border-white/10 text-slate-400">{v}</Badge>
                          ))}
                          {ver.game_versions.length > 3 && (
                            <Badge variant="outline" className="text-[10px] border-white/10 text-slate-500">+{ver.game_versions.length - 3}</Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-slate-500 hidden sm:block">
                          <Download className="inline h-3 w-3 mr-1" />{formatDownloads(ver.downloads)}
                        </span>
                        {primaryFile && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white gap-1.5 text-xs"
                              onClick={() => copyUrl(primaryFile.url, ver.id)}
                            >
                              {copied === ver.id ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                              Copy URL
                            </Button>
                            <a href={primaryFile.url} download={primaryFile.filename}>
                              <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white gap-1.5 text-xs">
                                <Download className="h-3.5 w-3.5" />
                                Download
                              </Button>
                            </a>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Info sidebar */}
        <div className="space-y-4">
          <Card className="border-white/5 bg-white/[0.02]">
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-semibold text-white">Details</h3>
              {project.categories.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-1.5">Categories</p>
                  <div className="flex flex-wrap gap-1.5">
                    {project.categories.map((c) => (
                      <Badge key={c} variant="outline" className="text-[10px] border-white/10 text-slate-400 capitalize">{c}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {project.loaders && project.loaders.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-1.5">Loaders</p>
                  <div className="flex flex-wrap gap-1.5">
                    {project.loaders.map((l) => (
                      <Badge key={l} variant="outline" className="text-[10px] border-white/10 text-blue-400 capitalize">{l}</Badge>
                    ))}
                  </div>
                </div>
              )}
              {project.game_versions && project.game_versions.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mb-1.5">Game Versions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {project.game_versions.slice(0, 6).map((v) => (
                      <Badge key={v} variant="outline" className="text-[10px] border-white/10 text-slate-400">{v}</Badge>
                    ))}
                    {project.game_versions.length > 6 && (
                      <Badge variant="outline" className="text-[10px] border-white/10 text-slate-500">+{project.game_versions.length - 6} more</Badge>
                    )}
                  </div>
                </div>
              )}
              {project.license && (
                <div>
                  <p className="text-xs text-slate-500 mb-1">License</p>
                  <p className="text-xs text-slate-300">{project.license.name}</p>
                </div>
              )}
              <a
                href={`https://modrinth.com/project/${project.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View on Modrinth
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
