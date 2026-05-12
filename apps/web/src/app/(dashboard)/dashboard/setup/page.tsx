"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Server, ChevronDown, Loader2, CheckCircle, Rocket, Sparkles, Package, Upload, X } from "lucide-react";
import confetti from "canvas-confetti";

const SERVER_TYPES = [
  {
    id: "fabric",
    label: "Fabric",
    description: "Lightweight modding platform. Best for performance & mods.",
    color: "bg-yellow-500/10 border-yellow-500/30 text-yellow-300",
    dot: "bg-yellow-400",
  },
  {
    id: "paper",
    label: "Paper",
    description: "High-performance Spigot fork. Best for plugins & vanilla+.",
    color: "bg-blue-500/10 border-blue-500/30 text-blue-300",
    dot: "bg-blue-400",
  },
  {
    id: "vanilla",
    label: "Vanilla",
    description: "Pure Minecraft, no mods or plugins.",
    color: "bg-green-500/10 border-green-500/30 text-green-300",
    dot: "bg-green-400",
  },
  {
    id: "forge",
    label: "Forge",
    description: "Classic mod loader. Large mod ecosystem.",
    color: "bg-orange-500/10 border-orange-500/30 text-orange-300",
    dot: "bg-orange-400",
  },
  {
    id: "purpur",
    label: "Purpur",
    description: "Paper fork with extra configuration and features.",
    color: "bg-purple-500/10 border-purple-500/30 text-purple-300",
    dot: "bg-purple-400",
  },
  {
    id: "bungeecord",
    label: "BungeeCord",
    description: "Proxy server for linking multiple servers.",
    color: "bg-cyan-500/10 border-cyan-500/30 text-cyan-300",
    dot: "bg-cyan-400",
  },
];

function SetupWizard() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const session = searchParams.get("session");

  const [versions, setVersions] = useState<string[]>([]);
  const [loadingVersions, setLoadingVersions] = useState(true);
  const [selectedVersion, setSelectedVersion] = useState("");
  const [selectedType, setSelectedType] = useState("fabric");
  const [deploying, setDeploying] = useState(false);
  const [deployed, setDeployed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [serverName, setServerName] = useState("");
  const [mrpackFile, setMrpackFile] = useState<File | null>(null);
  const [mrpackMcVersion, setMrpackMcVersion] = useState<string | null>(null);
  const [installingMods, setInstallingMods] = useState(false);
  const [modResult, setModResult] = useState<{ installed: number; failed: number; modpack: string; failures?: { name: string; error?: string }[] } | null>(null);
  const mrpackInputRef = useRef<HTMLInputElement>(null);

  const supportsMrpack = ["fabric", "forge"].includes(selectedType);

  const handleMrpackSelect = async (f: File) => {
    setMrpackFile(f);
    try {
      const { default: JSZip } = await import("jszip");
      const zip = await JSZip.loadAsync(await f.arrayBuffer());
      const indexFile = zip.file("modrinth.index.json");
      if (indexFile) {
        const index = JSON.parse(await indexFile.async("string"));
        const mcVer = index.dependencies?.minecraft;
        if (mcVer) {
          setMrpackMcVersion(mcVer);
          setSelectedVersion(mcVer);
        }
      }
    } catch { /* ignore parse errors */ }
  };

  // Fetch MC versions
  useEffect(() => {
    fetch("/api/minecraft/versions")
      .then((r) => r.json())
      .then((data) => {
        const vers: string[] = data.versions ?? [];
        setVersions(vers);
        if (vers.length > 0) setSelectedVersion(vers[0]);
      })
      .finally(() => setLoadingVersions(false));
  }, []);

  // Resolve order from session (setupIntentId = stripeSessionId on Order)
  useEffect(() => {
    if (!session) return;
    fetch(`/api/server/setup-order?session=${session}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.orderId) setOrderId(data.orderId);
        if (data.serverName) setServerName(data.serverName);
      });
  }, [session]);

  const handleDeploy = async () => {
    if (!orderId || !selectedVersion || !selectedType) return;
    setDeploying(true);
    setError(null);
    try {
      const res = await fetch("/api/server/provision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, mcVersion: selectedVersion, serverType: selectedType }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Deployment failed");
        return;
      }
      // If mrpack provided, install it now
      if (mrpackFile) {
        setInstallingMods(true);
        try {
          const form = new FormData();
          form.append("serverId", data.serverId);
          form.append("mrpack", mrpackFile);
          const modRes = await fetch("/api/server/install-mrpack", { method: "POST", body: form });
          const modData = await modRes.json();
          if (modRes.ok) setModResult({ installed: modData.installed, failed: modData.failed, modpack: modData.modpack, failures: modData.failures });
          else console.error("[mrpack install error]", modData);
        } catch { /* non-fatal */ } finally {
          setInstallingMods(false);
        }
      }

      setDeployed(true);
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ["#5b8cff", "#22c55e", "#a78bfa", "#fbbf24"] });
      setTimeout(() => {
        router.push(`/dashboard/services/${data.serverId}`);
      }, 2500);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setDeploying(false);
    }
  };

  if (deploying && installingMods) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-yellow-500/10 border-2 border-yellow-500/30">
          <Package className="h-10 w-10 text-yellow-400" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Installing Mods...</h2>
          <p className="text-[#8b92a8] text-sm">Downloading and uploading mods to your server.</p>
        </div>
        <Loader2 className="h-5 w-5 animate-spin text-yellow-400" />
      </div>
    );
  }

  if (deployed) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-green-500/10 border-2 border-green-500/30">
          <CheckCircle className="h-10 w-10 text-green-400" />
        </div>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">Server Deploying!</h2>
          {modResult && (
            <p className="text-[#8b92a8] text-sm mt-1">
              {modResult.modpack}: <span className="text-green-400">{modResult.installed} mods installed</span>
              {modResult.failed > 0 && <span className="text-red-400">, {modResult.failed} failed</span>}
            </p>
          )}
          <p className="text-[#8b92a8] text-sm mt-1">Redirecting to your server dashboard...</p>
        </div>
        <Loader2 className="h-5 w-5 animate-spin text-[#5b8cff]" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#5b8cff]/10 border border-[#5b8cff]/20">
            <Rocket className="h-6 w-6 text-[#5b8cff]" />
          </div>
        </div>
        <h1 className="text-2xl font-extrabold text-white">Set Up Your Server</h1>
        {serverName && (
          <p className="text-[#8b92a8] text-sm">
            Configuring <span className="text-white font-semibold">{serverName}</span>
          </p>
        )}
        <p className="text-[#8b92a8] text-sm">Choose your Minecraft version and server type to get started.</p>
      </div>

      {/* Step 1 — MC Version */}
      <div className="rounded-xl border border-white/[0.07] bg-[#232839] p-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#5b8cff]/20 text-[#5b8cff] text-xs font-bold">1</span>
          <h2 className="text-[15px] font-bold text-[#e2e8f0]">Minecraft Version</h2>
        </div>
        {loadingVersions ? (
          <div className="flex items-center gap-2 text-[#8b92a8] text-sm">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading versions...
          </div>
        ) : (
          <div className="relative">
            <select
              value={selectedVersion}
              onChange={(e) => setSelectedVersion(e.target.value)}
              className="w-full appearance-none rounded-lg border border-white/[0.07] bg-[#1a1e2e] px-4 py-3 text-[14px] text-[#e2e8f0] outline-none focus:border-[#5b8cff]/40 transition-colors pr-10"
            >
              {versions.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8b92a8]" />
          </div>
        )}
      </div>

      {/* Step 2 — Server Type */}
      <div className="rounded-xl border border-white/[0.07] bg-[#232839] p-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#5b8cff]/20 text-[#5b8cff] text-xs font-bold">2</span>
          <h2 className="text-[15px] font-bold text-[#e2e8f0]">Server Type</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SERVER_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-all ${
                selectedType === type.id
                  ? type.color
                  : "border-white/[0.07] bg-[#1a1e2e] hover:border-white/20 hover:bg-white/[0.03]"
              }`}
            >
              <div className={`mt-0.5 h-2.5 w-2.5 rounded-full shrink-0 ${selectedType === type.id ? type.dot : "bg-[#8b92a8]"}`} />
              <div>
                <p className={`text-[13px] font-bold ${selectedType === type.id ? "" : "text-[#e2e8f0]"}`}>{type.label}</p>
                <p className={`text-[11px] mt-0.5 ${selectedType === type.id ? "opacity-80" : "text-[#8b92a8]"}`}>{type.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Step 3 — Mrpack (Fabric/Forge only) */}
      {supportsMrpack && (
        <div className="rounded-xl border border-white/[0.07] bg-[#232839] p-6 space-y-4">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#5b8cff]/20 text-[#5b8cff] text-xs font-bold">3</span>
            <h2 className="text-[15px] font-bold text-[#e2e8f0]">Modpack <span className="text-[#8b92a8] font-normal text-[13px]">(optional)</span></h2>
          </div>
          <p className="text-[12px] text-[#8b92a8]">Upload a <code className="text-[#5b8cff]">.mrpack</code> file from Modrinth to automatically install all mods.</p>
          {mrpackFile ? (
            <div className="flex items-center gap-3 rounded-lg border border-green-500/20 bg-green-500/5 px-4 py-3">
              <Package className="h-4 w-4 text-green-400 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-green-300 truncate">{mrpackFile.name}</p>
                {mrpackMcVersion && <p className="text-[11px] text-green-400/70">MC {mrpackMcVersion} detected — version auto-set</p>}
              </div>
              <button onClick={() => { setMrpackFile(null); setMrpackMcVersion(null); }} className="text-[#8b92a8] hover:text-white transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-white/[0.07] bg-[#1a1e2e] px-6 py-8 cursor-pointer hover:border-[#5b8cff]/40 hover:bg-[#5b8cff]/5 transition-all group">
              <Upload className="h-5 w-5 text-[#8b92a8] group-hover:text-[#5b8cff] transition-colors" />
              <span className="text-[13px] text-[#8b92a8] group-hover:text-[#5b8cff] transition-colors">Click to upload .mrpack</span>
              <input
                ref={mrpackInputRef}
                type="file"
                accept=".mrpack"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleMrpackSelect(f); }}
              />
            </label>
          )}
        </div>
      )}

      {/* Summary + Deploy */}
      <div className="rounded-xl border border-white/[0.07] bg-[#232839] p-6 space-y-4">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#5b8cff]/20 text-[#5b8cff] text-xs font-bold">{supportsMrpack ? "4" : "3"}</span>
          <h2 className="text-[15px] font-bold text-[#e2e8f0]">Review & Deploy</h2>
        </div>
        <div className="flex items-center gap-4 rounded-lg bg-[#1a1e2e] border border-white/[0.07] px-4 py-3">
          <Server className="h-5 w-5 text-[#5b8cff] shrink-0" />
          <div className="text-[13px] text-[#8b92a8]">
            <span className="text-white font-semibold capitalize">{SERVER_TYPES.find((t) => t.id === selectedType)?.label}</span>
            {" "}{selectedVersion && <span className="font-mono">{selectedVersion}</span>}
          </div>
          <Sparkles className="h-4 w-4 text-[#fbbf24] ml-auto" />
        </div>

        {error && (
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-[13px] text-red-400">
            {error}
          </div>
        )}

        {!orderId && (
          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 px-4 py-3 text-[13px] text-yellow-400">
            Waiting for payment confirmation...
          </div>
        )}

        <button
          onClick={handleDeploy}
          disabled={deploying || !orderId || !selectedVersion}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#5b8cff] px-6 py-3.5 text-[14px] font-bold text-white hover:bg-[#4a7bef] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {deploying ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Deploying...</>
          ) : (
            <><Rocket className="h-4 w-4" /> Deploy Server</>
          )}
        </button>
      </div>
    </div>
  );
}

export default function SetupPage() {
  return (
    <Suspense>
      <SetupWizard />
    </Suspense>
  );
}
