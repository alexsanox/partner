"use client";

import { useState } from "react";
import { Save, Loader2, RotateCcw, Copy, Check } from "lucide-react";

interface StartupVariable {
  name: string;
  description: string;
  env_variable: string;
  default_value: string;
  server_value: string;
  is_editable: boolean;
  rules: string;
}

interface ServerConfigProps {
  serverId: string;
  serverName: string;
  description: string;
  variables: StartupVariable[];
  sftpDetails: { ip: string; alias: string | null; port: number };
  allocation: { id: number; ip: string; ip_alias: string | null; port: number } | null;
}

export function ServerConfig({
  serverId,
  serverName,
  description,
  variables,
  sftpDetails,
  allocation,
}: ServerConfigProps) {
  const safeVars = variables ?? [];
  const [vars, setVars] = useState<Record<string, string>>(() => {
    const map: Record<string, string> = {};
    for (const v of safeVars) {
      map[v.env_variable] = v.server_value || v.default_value;
    }
    return map;
  });
  const [dirty, setDirty] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState<string | null>(null);
  const [saved, setSaved] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [showRestart, setShowRestart] = useState(false);

  const [name, setName] = useState(serverName);
  const [desc, setDesc] = useState(description);
  const [nameDirty, setNameDirty] = useState(false);
  const [nameSaving, setNameSaving] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  const [reinstalling, setReinstalling] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const handleVarChange = (key: string, value: string) => {
    setVars((prev) => ({ ...prev, [key]: value }));
    setDirty((prev) => new Set(prev).add(key));
    setSaved((prev) => {
      const next = new Set(prev);
      next.delete(key);
      return next;
    });
  };

  const saveVariable = async (key: string) => {
    setSaving(key);
    setError(null);
    try {
      const res = await fetch(`/api/pelican/servers/${serverId}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update-variable", key, value: vars[key] }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save");
      } else {
        setDirty((prev) => {
          const next = new Set(prev);
          next.delete(key);
          return next;
        });
        setSaved((prev) => new Set(prev).add(key));
        setShowRestart(true);
        setTimeout(() => setSaved((prev) => { const n = new Set(prev); n.delete(key); return n; }), 2000);
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(null);
    }
  };

  const saveName = async () => {
    setNameSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/pelican/servers/${serverId}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rename", name, description: desc }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to rename");
      } else {
        setNameDirty(false);
        setNameSaved(true);
        setTimeout(() => setNameSaved(false), 2000);
      }
    } catch {
      setError("Network error");
    } finally {
      setNameSaving(false);
    }
  };

  const handleReinstall = async () => {
    if (!confirm("Are you sure you want to reinstall? This will erase all server data!")) return;
    setReinstalling(true);
    try {
      await fetch(`/api/pelican/servers/${serverId}/settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reinstall" }),
      });
    } catch {
      // ignore
    } finally {
      setReinstalling(false);
    }
  };

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const editableVars = safeVars.filter((v) => v.is_editable);

  return (
    <div className="space-y-5">
      {error && (
        <div className="rounded-lg border border-[#e74c4c]/20 bg-[#e74c4c]/5 px-4 py-3 text-[13px] text-[#e74c4c]">
          {error}
        </div>
      )}

      {showRestart && (
        <div className="flex items-center justify-between rounded-lg border border-[#FFAA00]/20 bg-[#FFAA00]/5 px-4 py-3">
          <span className="text-[13px] text-[#FFAA00]">Changes saved. Restart your server for them to take effect.</span>
          <button onClick={() => setShowRestart(false)} className="text-[12px] text-[#8b92a8] hover:text-white transition-colors ml-4 shrink-0">Dismiss</button>
        </div>
      )}

      {/* Server Name */}
      <div className="rounded-xl border border-white/[0.07] bg-[#232839] p-5">
        <h3 className="text-[15px] font-bold text-[#e2e8f0] mb-4">Server Details</h3>
        <div className="space-y-4">
          <div>
            <label className="text-[11px] uppercase tracking-wider text-[#8b92a8] mb-1.5 block">Server Name</label>
            <div className="flex gap-2">
              <input
                value={name}
                onChange={(e) => { setName(e.target.value); setNameDirty(true); }}
                className="flex-1 rounded-lg border border-white/[0.07] bg-[#1a1e2e] px-3 py-2.5 text-[13px] text-[#e2e8f0] outline-none transition-colors focus:border-[#5b8cff]/40"
              />
              {nameDirty && (
                <button
                  onClick={saveName}
                  disabled={nameSaving}
                  className="flex items-center gap-1.5 rounded-lg bg-[#5b8cff] px-4 py-2.5 text-[12px] font-bold text-white transition-colors hover:bg-[#4a7bee] disabled:opacity-50"
                >
                  {nameSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : nameSaved ? <Check className="h-3 w-3" /> : <Save className="h-3 w-3" />}
                  Save
                </button>
              )}
              {nameSaved && !nameDirty && (
                <span className="flex items-center gap-1 text-[12px] text-green-400"><Check className="h-3 w-3" /> Saved</span>
              )}
            </div>
          </div>
          <div>
            <label className="text-[11px] uppercase tracking-wider text-[#8b92a8] mb-1.5 block">Description</label>
            <input
              value={desc}
              onChange={(e) => { setDesc(e.target.value); setNameDirty(true); }}
              placeholder="Optional description..."
              className="w-full rounded-lg border border-white/[0.07] bg-[#1a1e2e] px-3 py-2.5 text-[13px] text-[#e2e8f0] outline-none transition-colors focus:border-[#5b8cff]/40 placeholder:text-[#6b7280]"
            />
          </div>
        </div>
      </div>

      {/* Connection Info */}
      <div className="rounded-xl border border-white/[0.07] bg-[#232839] p-5">
        <h3 className="text-[15px] font-bold text-[#e2e8f0] mb-4">Connection</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          {allocation && (
            <CopyableField
              label="Server Address"
              value={`${allocation.ip_alias ?? allocation.ip}:${allocation.port}`}
              copied={copied === "addr"}
              onCopy={() => copyText(`${allocation.ip_alias ?? allocation.ip}:${allocation.port}`, "addr")}
            />
          )}
          <CopyableField
            label="SFTP Address"
            value={`${sftpDetails.alias ?? sftpDetails.ip}:${sftpDetails.port}`}
            copied={copied === "sftp"}
            onCopy={() => copyText(`${sftpDetails.alias ?? sftpDetails.ip}:${sftpDetails.port}`, "sftp")}
          />
        </div>
      </div>

      {/* Startup Variables */}
      {editableVars.length > 0 && (
        <div className="rounded-xl border border-white/[0.07] bg-[#232839] p-5">
          <h3 className="text-[15px] font-bold text-[#e2e8f0] mb-1">Startup Configuration</h3>
          <p className="text-[12px] text-[#8b92a8] mb-4">These settings control how your server starts. Changes require a restart to take effect.</p>
          <div className="space-y-4">
            {editableVars.map((v) => {
              const isDirty = dirty.has(v.env_variable);
              const isSaving = saving === v.env_variable;
              const isSaved = saved.has(v.env_variable);

              return (
                <div key={v.env_variable}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <label className="text-[11px] uppercase tracking-wider text-[#8b92a8]">{v.name}</label>
                    <span className="text-[10px] font-mono text-[#8b92a8]/60">{v.env_variable}</span>
                  </div>
                  {v.description && (
                    <p className="text-[12px] text-[#8b92a8] mb-1.5">{v.description}</p>
                  )}
                  <div className="flex gap-2">
                    <input
                      value={vars[v.env_variable] ?? ""}
                      onChange={(e) => handleVarChange(v.env_variable, e.target.value)}
                      placeholder={v.default_value || "Enter value..."}
                      className="flex-1 rounded-lg border border-white/[0.07] bg-[#1a1e2e] px-3 py-2.5 font-mono text-[13px] text-[#e2e8f0] outline-none transition-colors focus:border-[#5b8cff]/40 placeholder:text-[#6b7280]"
                    />
                    {isDirty && (
                      <button
                        onClick={() => saveVariable(v.env_variable)}
                        disabled={isSaving}
                        className="flex items-center gap-1.5 rounded-lg bg-[#5b8cff] px-4 py-2.5 text-[12px] font-bold text-white transition-colors hover:bg-[#4a7bee] disabled:opacity-50"
                      >
                        {isSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                        Save
                      </button>
                    )}
                    {isSaved && !isDirty && (
                      <span className="flex items-center gap-1 text-[12px] text-green-400 shrink-0"><Check className="h-3 w-3" /> Saved</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Danger Zone */}
      <div className="rounded-xl border border-[#e74c4c]/15 bg-[#232839] p-5">
        <h3 className="text-[15px] font-bold text-[#e74c4c] mb-1">Danger Zone</h3>
        <p className="text-[12px] text-[#8b92a8] mb-4">Reinstalling will wipe all server data and reset to a fresh install.</p>
        <button
          onClick={handleReinstall}
          disabled={reinstalling}
          className="flex items-center gap-2 rounded-lg border border-[#e74c4c]/20 bg-[#e74c4c]/5 px-4 py-2 text-[13px] font-semibold text-[#e74c4c] transition-colors hover:bg-[#e74c4c]/10 disabled:opacity-50"
        >
          {reinstalling ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
          Reinstall Server
        </button>
      </div>
    </div>
  );
}

function CopyableField({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <div>
      <label className="text-[11px] uppercase tracking-wider text-[#8b92a8] mb-1.5 block">{label}</label>
      <div className="flex items-center gap-2 rounded-lg border border-white/[0.07] bg-[#1a1e2e] px-3 py-2.5">
        <span className="flex-1 font-mono text-[13px] text-[#e2e8f0] truncate">{value}</span>
        <button onClick={onCopy} className="shrink-0 text-[#8b92a8] transition-colors hover:text-white">
          {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}
