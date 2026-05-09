"use client";

import { useEffect, useState, useCallback, useRef, type MouseEvent as ReactMouseEvent } from "react";
import {
  Archive,
  Plus,
  Download,
  Trash2,
  RotateCcw,
  Lock,
  Unlock,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  MoreHorizontal,
} from "lucide-react";

interface Backup {
  uuid: string;
  is_successful: boolean;
  is_locked: boolean;
  name: string;
  bytes: number;
  created_at: string;
  completed_at: string | null;
}

interface BackupManagerProps {
  serverId: string;
  backupLimit: number;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function timeAgo(iso: string): string {
  try {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
  } catch {
    return "";
  }
}

export function BackupManager({ serverId, backupLimit }: BackupManagerProps) {
  const [backups, setBackups] = useState<Backup[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);

  const initialLoadDone = useRef(false);

  const fetchBackups = useCallback(async () => {
    if (!initialLoadDone.current) setLoading(true);
    try {
      const res = await fetch(`/api/pelican/servers/${serverId}/backups`);
      if (res.ok) {
        setBackups(await res.json());
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
      initialLoadDone.current = true;
    }
  }, [serverId]);

  useEffect(() => {
    fetchBackups();
  }, [fetchBackups]);

  // Poll while any backup is still pending (completed_at === null)
  useEffect(() => {
    const hasPending = backups.some((b) => !b.completed_at);
    if (!hasPending) return;
    const timer = setInterval(() => {
      fetchBackups();
    }, 3000);
    return () => clearInterval(timer);
  }, [backups, fetchBackups]);

  const doAction = async (action: string, uuid: string, extra?: Record<string, unknown>) => {
    setActionLoading(uuid);
    setError(null);
    setMenuOpen(null);
    setMenuPos(null);
    try {
      const res = await fetch(`/api/pelican/servers/${serverId}/backups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, uuid, ...extra }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Operation failed");
      } else if (action === "download") {
        const data = await res.json();
        window.open(data.url, "_blank");
      } else {
        fetchBackups();
      }
    } catch {
      setError("Network error");
    } finally {
      setActionLoading(null);
    }
  };

  const handleCreate = async () => {
    if (backupLimit > 0 && backups.length >= backupLimit) {
      setError(`Backup limit reached (${backupLimit})`);
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const res = await fetch(`/api/pelican/servers/${serverId}/backups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create", name: newName.trim() || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create backup");
      } else {
        setShowCreate(false);
        setNewName("");
        fetchBackups();
      }
    } catch {
      setError("Network error");
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = (uuid: string, name: string) => {
    if (!confirm(`Restore backup "${name}"? This will overwrite current server files.`)) return;
    doAction("restore", uuid);
  };

  const handleDelete = (uuid: string, name: string) => {
    if (!confirm(`Delete backup "${name}"? This cannot be undone.`)) return;
    doAction("delete", uuid);
  };

  const canCreate = backupLimit === 0 || backups.length < backupLimit;

  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#232839]">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-2.5">
          <span className="text-[15px] font-bold text-[#e2e8f0]">Backups</span>
          <span className="text-[12px] text-[#8b92a8]">
            {backups.length}{backupLimit > 0 ? ` / ${backupLimit}` : ""}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {canCreate && (
            <button
              onClick={() => setShowCreate(!showCreate)}
              className="flex items-center gap-1.5 rounded-lg bg-[#5b8cff] px-3 py-1.5 text-[12px] font-bold text-white transition-colors hover:bg-[#4a7bee]"
            >
              <Plus className="h-3 w-3" />
              New Backup
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="border-b border-[#e74c4c]/10 bg-[#e74c4c]/5 px-5 py-2.5 text-[13px] text-[#e74c4c]">
          {error}
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="flex items-center gap-2 border-t border-white/[0.07] px-5 py-2.5 bg-[#1a1e2e]">
          <input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
              if (e.key === "Escape") setShowCreate(false);
            }}
            placeholder="Backup name (optional)..."
            className="flex-1 bg-transparent text-[13px] text-[#e2e8f0] outline-none placeholder:text-[#6b7280]"
            autoFocus
          />
          <button
            onClick={handleCreate}
            disabled={creating}
            className="flex items-center gap-1.5 rounded-lg bg-[#5b8cff] px-3 py-1.5 text-[12px] font-bold text-white transition-colors hover:bg-[#4a7bee] disabled:opacity-50"
          >
            {creating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
            Create
          </button>
        </div>
      )}

      {/* Backup list */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-5 w-5 animate-spin text-[#8b92a8]" />
        </div>
      ) : backups.length === 0 ? (
        <div className="py-16 text-center">
          <Archive className="mx-auto h-8 w-8 text-[#8b92a8]/40 mb-3" />
          <p className="text-[13px] text-[#8b92a8]">No backups yet</p>
          <p className="text-[12px] text-[#8b92a8]/60 mt-1">Create a backup to save your server state</p>
        </div>
      ) : (
        <div>
          {backups.map((backup) => {
            const isLoading = actionLoading === backup.uuid;
            const isPending = !backup.completed_at;

            return (
              <div
                key={backup.uuid}
                className="flex items-center gap-3 border-b border-white/[0.04] px-5 py-3 last:border-0 hover:bg-white/[0.02] transition-colors"
              >
                {/* Status icon */}
                <div className="shrink-0">
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin text-yellow-400" />
                  ) : backup.is_successful ? (
                    <CheckCircle className="h-4 w-4 text-green-400" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-400" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] text-[#e2e8f0] truncate font-medium">
                      {backup.name}
                    </span>
                    {backup.is_locked && (
                      <Lock className="h-3 w-3 text-yellow-500 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[12px] text-[#8b92a8]">
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {timeAgo(backup.created_at)}
                    </span>
                    <span>{formatSize(backup.bytes)}</span>
                    {isPending && <span className="text-yellow-500">In progress...</span>}
                  </div>
                </div>

                {/* Actions */}
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-slate-500 shrink-0" />
                ) : (
                  <div className="relative shrink-0">
                    <button
                      onClick={(e: ReactMouseEvent<HTMLButtonElement>) => {
                        e.stopPropagation();
                        if (menuOpen === backup.uuid) {
                          setMenuOpen(null);
                          setMenuPos(null);
                        } else {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setMenuPos({ top: rect.bottom + 4, left: rect.right - 176 });
                          setMenuOpen(backup.uuid);
                        }
                      }}
                      className="rounded-md p-1.5 text-[#8b92a8] transition-colors hover:bg-white/5 hover:text-white"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </button>

                    {menuOpen === backup.uuid && menuPos && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setMenuOpen(null); setMenuPos(null); }} />
                        <div
                          className="fixed z-50 w-44 rounded-lg border border-white/[0.07] bg-[#232839] py-1 shadow-xl"
                          style={{ top: menuPos.top, left: menuPos.left }}
                          onClick={(e) => e.stopPropagation()}
                        >
                        {backup.is_successful && !isPending && (
                          <>
                            <MenuBtn
                              icon={Download}
                              label="Download"
                              onClick={() => doAction("download", backup.uuid)}
                            />
                            <MenuBtn
                              icon={RotateCcw}
                              label="Restore"
                              onClick={() => handleRestore(backup.uuid, backup.name)}
                            />
                          </>
                        )}
                        <MenuBtn
                          icon={backup.is_locked ? Unlock : Lock}
                          label={backup.is_locked ? "Unlock" : "Lock"}
                          onClick={() => doAction("lock", backup.uuid)}
                        />
                        {!backup.is_locked && (
                          <>
                            <div className="my-1 border-t border-white/[0.07]" />
                            <MenuBtn
                              icon={Trash2}
                              label="Delete"
                              onClick={() => handleDelete(backup.uuid, backup.name)}
                              danger
                            />
                          </>
                        )}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function MenuBtn({
  icon: Icon,
  label,
  onClick,
  danger = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-3 py-2 text-[13px] transition-colors ${
        danger ? "text-[#e74c4c] hover:bg-[#e74c4c]/10" : "text-[#e2e8f0] hover:bg-white/[0.06]"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
