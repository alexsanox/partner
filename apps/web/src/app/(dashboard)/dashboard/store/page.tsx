"use client";

import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Search, Download, Star, RefreshCw, Package } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

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
  versions: string[];
  date_modified: string;
  color: number | null;
};

const CATEGORIES = [
  { value: "mod", label: "Mods" },
  { value: "plugin", label: "Plugins" },
  { value: "modpack", label: "Modpacks" },
  { value: "resourcepack", label: "Resource Packs" },
  { value: "shader", label: "Shaders" },
  { value: "datapack", label: "Data Packs" },
];

function formatDownloads(n: number | undefined | null) {
  if (!n) return "0";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

export default function StorePage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("plugin");
  const [projects, setProjects] = useState<ModrinthProject[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const search = useCallback(async (q: string, cat: string) => {
    setLoading(true);
    setSearched(true);
    try {
      const facets = JSON.stringify([["project_type:" + cat]]);
      const url = `https://api.modrinth.com/v2/search?query=${encodeURIComponent(q)}&facets=${encodeURIComponent(facets)}&limit=24&index=downloads`;
      const res = await fetch(url, { headers: { "User-Agent": "PartnerHosting/1.0" } });
      const data = await res.json();
      setProjects(data.hits ?? []);
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    search("", category);
  }, [category, search]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    search(query, category);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Minecraft Store</h1>
        <p className="mt-1 text-sm text-slate-400">
          Browse and install plugins, mods, modpacks and more from Modrinth
        </p>
      </div>

      {/* Search + filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <form onSubmit={handleSearch} className="flex flex-1 gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search plugins, mods, modpacks..."
              className="pl-9 border-white/10 bg-white/5 text-white placeholder:text-slate-500 focus-visible:ring-[#00c98d]"
            />
          </div>
          <Button type="submit" className="bg-[#00c98d] hover:bg-[#00e0a0] text-white">
            Search
          </Button>
        </form>
      </div>

      {/* Category tabs */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => { setCategory(cat.value); setQuery(""); }}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              category === cat.value
                ? "bg-[#00c98d] text-white"
                : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white border border-white/10"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="h-6 w-6 animate-spin text-slate-500" />
        </div>
      ) : projects.length === 0 && searched ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Package className="mb-4 h-12 w-12 text-slate-600" />
          <p className="text-lg font-medium text-slate-400">No results found</p>
          <p className="mt-1 text-sm text-slate-500">Try a different search term or category</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {projects.map((project) => (
            <Link key={project.project_id} href={`/dashboard/store/${project.slug}`}>
              <Card className="h-full border-white/5 bg-white/[0.02] transition-all hover:border-white/10 hover:bg-white/[0.04] cursor-pointer">
                <CardContent className="p-4 flex flex-col gap-3 h-full">
                  {/* Icon + title */}
                  <div className="flex items-start gap-3">
                    <div className="h-12 w-12 shrink-0 rounded-lg overflow-hidden bg-white/5 flex items-center justify-center">
                      {project.icon_url ? (
                        <Image
                          src={project.icon_url}
                          alt={project.title}
                          width={48}
                          height={48}
                          className="h-12 w-12 object-cover"
                          unoptimized
                        />
                      ) : (
                        <Package className="h-6 w-6 text-slate-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-white truncate text-sm">{project.title}</p>
                      <Badge variant="outline" className="mt-1 text-[10px] border-white/10 text-slate-400 capitalize">
                        {project.project_type}
                      </Badge>
                    </div>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-500 line-clamp-2 flex-1">{project.description}</p>

                  {/* Stats */}
                  <div className="flex items-center gap-4 text-xs text-slate-500 border-t border-white/5 pt-3">
                    <span className="flex items-center gap-1">
                      <Download className="h-3 w-3" />
                      {formatDownloads(project.downloads)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      {formatDownloads(project.follows)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
