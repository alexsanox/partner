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
  Terminal, Eye, EyeOff, Pencil, Lock, Plus, X, Trash2, Upload,
} from "lucide-react";
import yaml from "js-yaml";
import { toast } from "sonner";

// ── Default docker images for quick-fill ──────────────────────────────────────
const JAVA_IMAGES: Record<string, string> = {
  "Java 8":  "ghcr.io/pelican-eggs/yolks:java_8",
  "Java 11": "ghcr.io/pelican-eggs/yolks:java_11",
  "Java 16": "ghcr.io/pelican-eggs/yolks:java_16",
  "Java 17": "ghcr.io/pelican-eggs/yolks:java_17",
  "Java 21": "ghcr.io/pelican-eggs/yolks:java_21",
  "Java 25": "ghcr.io/pelican-eggs/yolks:java_25",
};

interface NewVariable {
  name: string;
  env_variable: string;
  default_value: string;
  description: string;
  user_viewable: boolean;
  user_editable: boolean;
  rules: string;
}

interface DockerImageRow {
  label: string;
  image: string;
}

const EMPTY_VAR = (): NewVariable => ({
  name: "", env_variable: "", default_value: "", description: "",
  user_viewable: true, user_editable: true, rules: "nullable|string",
});

// ── Create Egg Modal ──────────────────────────────────────────────────────────
function CreateEggModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startup, setStartup] = useState("java -Xms128M -Xmx{{SERVER_MEMORY}}M -jar {{SERVER_JARFILE}}");
  const [dockerRows, setDockerRows] = useState<DockerImageRow[]>([
    { label: "Java 21", image: JAVA_IMAGES["Java 21"] },
    { label: "Java 25", image: JAVA_IMAGES["Java 25"] },
  ]);
  const [variables, setVariables] = useState<NewVariable[]>([]);
  const [saving, setSaving] = useState(false);

  const handleYamlImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = yaml.load(ev.target?.result as string) as Record<string, unknown>;
        if (parsed.name) setName(parsed.name as string);
        if (parsed.description) setDescription(parsed.description as string);
        // Docker images
        if (parsed.docker_images && typeof parsed.docker_images === "object") {
          setDockerRows(
            Object.entries(parsed.docker_images as Record<string, string>).map(([label, image]) => ({ label, image }))
          );
        }
        // Variables
        if (Array.isArray(parsed.variables)) {
          setVariables(
            (parsed.variables as Record<string, unknown>[]).map((v) => ({
              name: String(v.name ?? ""),
              env_variable: String(v.env_variable ?? ""),
              default_value: String(v.default_value ?? ""),
              description: String(v.description ?? ""),
              user_viewable: Boolean(v.user_viewable ?? true),
              user_editable: Boolean(v.user_editable ?? true),
              rules: Array.isArray(v.rules) ? (v.rules as string[]).join("|") : String(v.rules ?? "nullable|string"),
            }))
          );
        }
        toast.success(`Imported "${parsed.name ?? file.name}" from YAML`);
      } catch {
        toast.error("Failed to parse YAML file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const addDockerRow = () => setDockerRows((r) => [...r, { label: "", image: "" }]);
  const removeDockerRow = (i: number) => setDockerRows((r) => r.filter((_, idx) => idx !== i));
  const updateDockerRow = (i: number, field: "label" | "image", val: string) =>
    setDockerRows((r) => r.map((row, idx) => idx === i ? { ...row, [field]: val } : row));

  const addVariable = () => setVariables((v) => [...v, EMPTY_VAR()]);
  const removeVariable = (i: number) => setVariables((v) => v.filter((_, idx) => idx !== i));
  const updateVariable = (i: number, field: keyof NewVariable, val: string | boolean) =>
    setVariables((v) => v.map((row, idx) => idx === i ? { ...row, [field]: val } : row));

  const handleSubmit = async () => {
    if (!name.trim() || !startup.trim() || dockerRows.some((r) => !r.label || !r.image)) {
      toast.error("Fill in all required fields (name, startup, docker images)");
      return;
    }
    setSaving(true);
    const docker_images: Record<string, string> = {};
    dockerRows.forEach((r) => { docker_images[r.label] = r.image; });

    try {
      const res = await fetch("/api/admin/eggs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, startup, docker_images, variables }),
      });
      const data = await res.json();
      if (!res.ok) { toast.error(data.error || "Failed to create egg"); return; }
      toast.success(`Egg "${name}" created successfully`);
      onCreated();
      onClose();
    } catch {
      toast.error("Network error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 pt-16">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-2xl rounded-2xl border border-white/10 bg-[#13161f] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.07] px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#5b8cff]/10">
              <Egg className="h-4 w-4 text-[#5b8cff]" />
            </div>
            <h2 className="text-[15px] font-bold text-white">Create New Egg</h2>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-1.5 cursor-pointer rounded-lg border border-white/[0.07] bg-white/[0.04] px-3 py-1.5 text-[12px] text-[#8b92a8] hover:text-white hover:border-white/20 transition-colors">
              <Upload className="h-3.5 w-3.5" />
              Import YAML
              <input type="file" accept=".yaml,.yml" className="hidden" onChange={handleYamlImport} />
            </label>
            <button onClick={onClose} className="text-[#8b92a8] hover:text-white transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Name + Description */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#8b92a8] uppercase tracking-wider">Name *</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Paper"
                className="w-full rounded-lg border border-white/[0.07] bg-[#1a1e2e] px-3 py-2 text-sm text-white placeholder-[#4a5068] outline-none focus:border-[#5b8cff]/40"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#8b92a8] uppercase tracking-wider">Description</label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Short description"
                className="w-full rounded-lg border border-white/[0.07] bg-[#1a1e2e] px-3 py-2 text-sm text-white placeholder-[#4a5068] outline-none focus:border-[#5b8cff]/40"
              />
            </div>
          </div>

          {/* Startup */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#8b92a8] uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="h-3 w-3" /> Startup Command *
            </label>
            <input
              value={startup}
              onChange={(e) => setStartup(e.target.value)}
              className="w-full rounded-lg border border-white/[0.07] bg-[#1a1e2e] px-3 py-2 text-sm text-[#5b8cff] font-mono placeholder-[#4a5068] outline-none focus:border-[#5b8cff]/40"
            />
          </div>

          {/* Docker Images */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#8b92a8] uppercase tracking-wider flex items-center gap-1.5">
                <Container className="h-3 w-3" /> Docker Images *
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setDockerRows(Object.entries(JAVA_IMAGES).map(([label, image]) => ({ label, image })))}
                  className="text-[11px] text-[#5b8cff] hover:text-[#7da8ff] transition-colors"
                >
                  Fill all Java
                </button>
                <button onClick={addDockerRow} className="flex items-center gap-1 text-[11px] text-[#5b8cff] hover:text-[#7da8ff] transition-colors">
                  <Plus className="h-3 w-3" /> Add
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {dockerRows.map((row, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    value={row.label}
                    onChange={(e) => updateDockerRow(i, "label", e.target.value)}
                    placeholder="Label (e.g. Java 21)"
                    className="w-32 shrink-0 rounded-lg border border-white/[0.07] bg-[#1a1e2e] px-3 py-2 text-sm text-white placeholder-[#4a5068] outline-none focus:border-[#5b8cff]/40"
                  />
                  <input
                    value={row.image}
                    onChange={(e) => updateDockerRow(i, "image", e.target.value)}
                    placeholder="ghcr.io/pelican-eggs/yolks:java_21"
                    className="flex-1 rounded-lg border border-white/[0.07] bg-[#1a1e2e] px-3 py-2 text-sm text-[#8b92a8] font-mono placeholder-[#4a5068] outline-none focus:border-[#5b8cff]/40"
                  />
                  <button onClick={() => removeDockerRow(i)} className="text-red-400/60 hover:text-red-400 transition-colors shrink-0">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Variables */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#8b92a8] uppercase tracking-wider flex items-center gap-1.5">
                <Variable className="h-3 w-3" /> Environment Variables
              </label>
              <button onClick={addVariable} className="flex items-center gap-1 text-[11px] text-[#5b8cff] hover:text-[#7da8ff] transition-colors">
                <Plus className="h-3 w-3" /> Add Variable
              </button>
            </div>
            {variables.length === 0 && (
              <p className="text-[12px] text-[#4a5068] italic">No variables. Click &quot;Add Variable&quot; to add one.</p>
            )}
            {variables.map((v, i) => (
              <div key={i} className="rounded-lg border border-white/[0.07] bg-[#1a1e2e] p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#8b92a8] uppercase tracking-wider">Variable {i + 1}</span>
                  <button onClick={() => removeVariable(i)} className="text-red-400/60 hover:text-red-400 transition-colors">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input value={v.name} onChange={(e) => updateVariable(i, "name", e.target.value)} placeholder="Display name" className="rounded border border-white/[0.07] bg-[#13161f] px-2.5 py-1.5 text-xs text-white placeholder-[#4a5068] outline-none focus:border-[#5b8cff]/40" />
                  <input value={v.env_variable} onChange={(e) => updateVariable(i, "env_variable", e.target.value.toUpperCase())} placeholder="ENV_VARIABLE" className="rounded border border-white/[0.07] bg-[#13161f] px-2.5 py-1.5 text-xs text-white font-mono placeholder-[#4a5068] outline-none focus:border-[#5b8cff]/40" />
                  <input value={v.default_value} onChange={(e) => updateVariable(i, "default_value", e.target.value)} placeholder="Default value" className="rounded border border-white/[0.07] bg-[#13161f] px-2.5 py-1.5 text-xs text-white placeholder-[#4a5068] outline-none focus:border-[#5b8cff]/40" />
                  <input value={v.description} onChange={(e) => updateVariable(i, "description", e.target.value)} placeholder="Description" className="rounded border border-white/[0.07] bg-[#13161f] px-2.5 py-1.5 text-xs text-white placeholder-[#4a5068] outline-none focus:border-[#5b8cff]/40" />
                </div>
                <div className="flex gap-4">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={v.user_viewable} onChange={(e) => updateVariable(i, "user_viewable", e.target.checked)} className="rounded" />
                    <span className="text-[11px] text-[#8b92a8]">User Viewable</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="checkbox" checked={v.user_editable} onChange={(e) => updateVariable(i, "user_editable", e.target.checked)} className="rounded" />
                    <span className="text-[11px] text-[#8b92a8]">User Editable</span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-white/[0.07] px-6 py-4">
          <Button variant="outline" onClick={onClose} className="border-white/10 text-[#8b92a8] hover:text-white">Cancel</Button>
          <Button onClick={handleSubmit} disabled={saving} className="bg-[#5b8cff] hover:bg-[#4a7bef] text-white">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Creating...</> : <><Plus className="h-4 w-4 mr-2" />Create Egg</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

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
  const [showCreate, setShowCreate] = useState(false);

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
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Eggs</h1>
          <p className="mt-1 text-sm text-[#8b92a8]">
            Pelican server eggs available for plan configuration. These are synced from your panel.
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="bg-[#5b8cff] hover:bg-[#4a7bef] text-white shrink-0">
          <Plus className="h-4 w-4 mr-2" /> Create Egg
        </Button>
      </div>

      {showCreate && (
        <CreateEggModal onClose={() => setShowCreate(false)} onCreated={fetchEggs} />
      )}

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
