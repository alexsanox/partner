"use client";

import { useState, useEffect, useCallback } from "react";
import { Database, Plus, Trash2, RefreshCcw, Eye, EyeOff, Copy, Check, Loader2, AlertCircle } from "lucide-react";

interface DbEntry {
  id: string;
  name: string;
  username: string;
  remote: string;
  host: string;
  port: number;
  password?: string;
}

export function DatabaseManager({ serverId }: { serverId: string }) {
  const [databases, setDatabases] = useState<DbEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newDbName, setNewDbName] = useState("");
  const [createError, setCreateError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [rotatingId, setRotatingId] = useState<string | null>(null);
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set());
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const fetchDatabases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/pelican/servers/${serverId}/databases`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to load databases");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items: DbEntry[] = (data.data ?? []).map((item: any) => {
        const a = item.attributes;
        const rel = item.relationships?.password?.attributes;
        return {
          id: item.id ?? a.id,
          name: a.name ?? a.database,
          username: a.username,
          remote: a.remote ?? "%",
          host: a.host ?? a.jdbc_connection_string ?? "",
          port: a.port ?? 3306,
          password: rel?.password ?? undefined,
        };
      });
      setDatabases(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [serverId]);

  useEffect(() => { fetchDatabases(); }, [fetchDatabases]);

  const handleCreate = async () => {
    const name = newDbName.trim();
    if (!name) return;
    setCreating(true);
    setCreateError(null);
    try {
      const res = await fetch(`/api/pelican/servers/${serverId}/databases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", database: name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to create database");
      setNewDbName("");
      await fetchDatabases();
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : "Failed to create database");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (dbId: string) => {
    setDeletingId(dbId);
    try {
      const res = await fetch(`/api/pelican/servers/${serverId}/databases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", databaseId: dbId }),
      });
      if (!res.ok) throw new Error("Failed to delete");
      setDatabases((prev) => prev.filter((d) => d.id !== dbId));
    } catch { /* ignore */ }
    setDeletingId(null);
  };

  const handleRotate = async (dbId: string) => {
    setRotatingId(dbId);
    try {
      const res = await fetch(`/api/pelican/servers/${serverId}/databases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rotate", databaseId: dbId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to rotate");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newPw = data.attributes?.relationships?.password?.attributes?.password ?? (data as any).attributes?.password;
      if (newPw) {
        setDatabases((prev) => prev.map((d) => d.id === dbId ? { ...d, password: newPw } : d));
        setRevealedIds((prev) => new Set([...prev, dbId]));
      }
    } catch { /* ignore */ }
    setRotatingId(null);
  };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(key);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[#00c98d]" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Create */}
      <div className="rounded-xl border border-white/[0.06] bg-[#1e2235] p-5">
        <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
          <Plus className="h-4 w-4 text-[#00c98d]" /> Create Database
        </h3>
        <div className="flex gap-2">
          <input
            value={newDbName}
            onChange={(e) => setNewDbName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            placeholder="database_name"
            className="flex-1 rounded-lg border border-white/[0.08] bg-[#171b29] px-4 py-2 text-sm text-white placeholder:text-[#8b92a8] outline-none focus:border-[#00c98d]/40 transition-colors font-mono max-w-xs"
            spellCheck={false}
          />
          <button
            onClick={handleCreate}
            disabled={creating || !newDbName.trim()}
            className="flex items-center gap-2 rounded-lg bg-[#00c98d] px-4 py-2 text-sm font-bold text-white hover:bg-[#00e0a0] hover:text-white transition-colors disabled:opacity-40"
          >
            {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Create
          </button>
        </div>
        {createError && (
          <p className="mt-2 text-xs text-red-400 flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 shrink-0" /> {createError}
          </p>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-400 shrink-0" />
          <p className="text-sm text-red-400">{error}</p>
          <button onClick={fetchDatabases} className="ml-auto text-xs text-[#8b92a8] hover:text-white transition-colors">
            Retry
          </button>
        </div>
      )}

      {/* List */}
      {databases.length === 0 && !error ? (
        <div className="rounded-xl border border-white/[0.06] bg-[#1e2235] flex flex-col items-center justify-center py-14 gap-2">
          <Database className="h-8 w-8 text-[#8b92a8]/30" />
          <p className="text-sm text-[#8b92a8]">No databases yet</p>
          <p className="text-xs text-[#8b92a8]/60">Create one above to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {databases.map((db) => {
            const revealed = revealedIds.has(db.id);
            return (
              <div key={db.id} className="rounded-xl border border-white/[0.06] bg-[#1e2235] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/[0.05]">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#00c98d]/10">
                      <Database className="h-4 w-4 text-[#00c98d]" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white font-mono">{db.name}</p>
                      <p className="text-[11px] text-[#8b92a8]">User: <span className="font-mono">{db.username}</span></p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleRotate(db.id)}
                      disabled={rotatingId === db.id}
                      title="Rotate password"
                      className="rounded-lg p-1.5 text-[#8b92a8] hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-40"
                    >
                      {rotatingId === db.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(db.id)}
                      disabled={deletingId === db.id}
                      title="Delete database"
                      className="rounded-lg p-1.5 text-[#8b92a8] hover:text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                    >
                      {deletingId === db.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Details */}
                <div className="px-5 py-4 grid gap-3 sm:grid-cols-2">
                  <CredRow label="Host" value={`${db.host}:${db.port}`} onCopy={() => copy(`${db.host}:${db.port}`, `${db.id}-host`)} copied={copiedField === `${db.id}-host`} />
                  <CredRow label="Database" value={db.name} onCopy={() => copy(db.name, `${db.id}-name`)} copied={copiedField === `${db.id}-name`} mono />
                  <CredRow label="Username" value={db.username} onCopy={() => copy(db.username, `${db.id}-user`)} copied={copiedField === `${db.id}-user`} mono />
                  {db.password !== undefined && (
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-[#8b92a8] mb-1">Password</p>
                      <div className="flex items-center gap-2">
                        <code className="text-[13px] text-[#e2e8f0] font-mono tracking-wide">
                          {revealed ? db.password : "••••••••••••"}
                        </code>
                        <button onClick={() => toggleReveal(db.id)} className="text-[#8b92a8] hover:text-white transition-colors">
                          {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                        {revealed && (
                          <button onClick={() => copy(db.password!, `${db.id}-pw`)} className="text-[#8b92a8] hover:text-white transition-colors">
                            {copiedField === `${db.id}-pw` ? <Check className="h-3.5 w-3.5 text-[#00c98d]" /> : <Copy className="h-3.5 w-3.5" />}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CredRow({ label, value, onCopy, copied, mono = false }: {
  label: string; value: string; onCopy: () => void; copied: boolean; mono?: boolean;
}) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-wider text-[#8b92a8] mb-1">{label}</p>
      <div className="flex items-center gap-2">
        <span className={`text-[13px] text-[#e2e8f0] ${mono ? "font-mono" : ""}`}>{value}</span>
        <button onClick={onCopy} className="text-[#8b92a8] hover:text-white transition-colors shrink-0">
          {copied ? <Check className="h-3.5 w-3.5 text-[#00c98d]" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>
    </div>
  );
}
