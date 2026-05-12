"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2, Egg, ChevronDown, ChevronRight, Variable, Container,
  Terminal, Eye, EyeOff, Pencil, Lock,
} from "lucide-react";
import { toast } from "sonner";

interface EggVariable {
  name: string;
  envVariable: string;
  defaultValue: string;
  description: string;
  userViewable: boolean;
  userEditable: boolean;
}

interface EggData {
  id: number;
  uuid: string;
  name: string;
  description: string | null;
  dockerImages: Record<string, string>;
  startup: string;
  variables: EggVariable[];
}

export default function AdminEggsPage() {
  const [eggs, setEggs] = useState<EggData[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const fetchEggs = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/eggs");
      if (res.ok) {
        setEggs(await res.json());
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to fetch eggs");
      }
    } catch {
      toast.error("Failed to fetch eggs");
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchEggs(); }, [fetchEggs]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-[#8b92a8]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Eggs</h1>
        <p className="mt-1 text-sm text-[#8b92a8]">
          Pelican server eggs available for plan configuration. These are synced from your panel.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Total Eggs", value: eggs.length, color: "text-white" },
          { label: "Total Variables", value: eggs.reduce((s, e) => s + e.variables.length, 0), color: "text-blue-400" },
          { label: "Docker Images", value: eggs.reduce((s, e) => s + Object.keys(e.dockerImages).length, 0), color: "text-purple-400" },
        ].map((s) => (
          <Card key={s.label} className="border-white/5 bg-white/[0.02]">
            <CardContent className="p-5">
              <p className="text-xs text-[#8b92a8]">{s.label}</p>
              <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Egg List */}
      <Card className="border-white/5 bg-white/[0.02]">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="w-8 text-[#8b92a8]"></TableHead>
                <TableHead className="text-[#8b92a8]">Egg</TableHead>
                <TableHead className="text-[#8b92a8]">ID</TableHead>
                <TableHead className="text-[#8b92a8]">Docker Images</TableHead>
                <TableHead className="text-[#8b92a8]">Variables</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {eggs.length === 0 ? (
                <TableRow className="border-white/5">
                  <TableCell colSpan={5} className="py-12 text-center text-[#8b92a8]">
                    <Egg className="mx-auto mb-3 h-10 w-10 text-slate-600" />
                    <p>No eggs found. Make sure your Pelican panel is configured and has eggs installed.</p>
                  </TableCell>
                </TableRow>
              ) : (
                eggs.map((egg) => {
                  const isExpanded = expandedId === egg.id;
                  const imageNames = Object.keys(egg.dockerImages);
                  return (
                    <TableRow
                      key={egg.id}
                      className="border-white/5 hover:bg-white/[0.02] cursor-pointer group"
                      onClick={() => setExpandedId(isExpanded ? null : egg.id)}
                    >
                      <TableCell colSpan={5} className="p-0">
                        {/* Main row */}
                        <div className="flex items-center px-4 py-3">
                          <div className="w-8 shrink-0">
                            {isExpanded ? (
                              <ChevronDown className="h-4 w-4 text-[#8b92a8]" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-[#8b92a8]" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-white">{egg.name}</p>
                            {egg.description && (
                              <p className="text-xs text-[#8b92a8] truncate mt-0.5">{egg.description}</p>
                            )}
                          </div>
                          <div className="w-20 text-center">
                            <Badge variant="outline" className="bg-white/[0.04] text-[#8b92a8] border-white/[0.07]">
                              #{egg.id}
                            </Badge>
                          </div>
                          <div className="w-40">
                            <div className="flex flex-wrap gap-1">
                              {imageNames.slice(0, 2).map((name) => (
                                <Badge key={name} variant="outline" className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/20 truncate max-w-[120px]">
                                  {name}
                                </Badge>
                              ))}
                              {imageNames.length > 2 && (
                                <Badge variant="outline" className="text-[10px] bg-white/[0.04] text-[#8b92a8] border-white/[0.07]">
                                  +{imageNames.length - 2}
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="w-20 text-center">
                            <span className="text-sm text-[#8b92a8]">{egg.variables.length}</span>
                          </div>
                        </div>

                        {/* Expanded detail */}
                        {isExpanded && (
                          <div className="border-t border-white/[0.04] bg-white/[0.01] px-4 py-4 space-y-4" onClick={(e) => e.stopPropagation()}>
                            {/* Startup */}
                            <div>
                              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8b92a8] mb-2">
                                <Terminal className="h-3.5 w-3.5" />
                                Startup Command
                              </h4>
                              <div className="rounded-lg border border-white/[0.07] bg-[#0f1219] p-3">
                                <code className="text-xs text-[#5b8cff] break-all font-mono">{egg.startup}</code>
                              </div>
                            </div>

                            {/* Docker Images */}
                            <div>
                              <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8b92a8] mb-2">
                                <Container className="h-3.5 w-3.5" />
                                Docker Images ({imageNames.length})
                              </h4>
                              <div className="space-y-1">
                                {Object.entries(egg.dockerImages).map(([name, image]) => (
                                  <div key={name} className="flex items-center justify-between rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2">
                                    <span className="text-xs font-medium text-white">{name}</span>
                                    <code className="text-[11px] text-[#8b92a8] font-mono truncate ml-4 max-w-[300px]">{image}</code>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Variables */}
                            {egg.variables.length > 0 && (
                              <div>
                                <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#8b92a8] mb-2">
                                  <Variable className="h-3.5 w-3.5" />
                                  Environment Variables ({egg.variables.length})
                                </h4>
                                <div className="space-y-1.5">
                                  {egg.variables.map((v) => (
                                    <div key={v.envVariable} className="rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2.5">
                                      <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                          <code className="text-xs font-mono font-medium text-white">{v.envVariable}</code>
                                          <span className="text-[11px] text-[#8b92a8]">({v.name})</span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                          {v.userViewable ? (
                                            <Badge variant="outline" className="text-[9px] py-0 px-1 bg-green-500/10 text-green-400 border-green-500/20">
                                              <Eye className="h-2.5 w-2.5 mr-0.5" /> Viewable
                                            </Badge>
                                          ) : (
                                            <Badge variant="outline" className="text-[9px] py-0 px-1 bg-slate-500/10 text-slate-500 border-slate-500/20">
                                              <EyeOff className="h-2.5 w-2.5 mr-0.5" /> Hidden
                                            </Badge>
                                          )}
                                          {v.userEditable ? (
                                            <Badge variant="outline" className="text-[9px] py-0 px-1 bg-blue-500/10 text-blue-400 border-blue-500/20">
                                              <Pencil className="h-2.5 w-2.5 mr-0.5" /> Editable
                                            </Badge>
                                          ) : (
                                            <Badge variant="outline" className="text-[9px] py-0 px-1 bg-slate-500/10 text-slate-500 border-slate-500/20">
                                              <Lock className="h-2.5 w-2.5 mr-0.5" /> Locked
                                            </Badge>
                                          )}
                                        </div>
                                      </div>
                                      {v.description && (
                                        <p className="text-[11px] text-[#8b92a8] mb-1">{v.description}</p>
                                      )}
                                      <p className="text-[11px] text-[#8b92a8]">
                                        Default: <code className="text-[#5b8cff] font-mono">{v.defaultValue || "(empty)"}</code>
                                      </p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
