"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Folder,
  FileText,
  ArrowUp,
  RefreshCcw,
  Save,
  X,
  Trash2,
  FolderPlus,
  Loader2,
  Pencil,
  FolderInput,
  MoreHorizontal,
  CheckSquare,
  Square,
  FileCode,
  Search,
} from "lucide-react";

interface FileObject {
  name: string;
  size: number;
  is_file: boolean;
  mimetype: string;
  modified_at: string;
}

interface FileManagerProps {
  serverId: string;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "-";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
  } catch {
    return "-";
  }
}

export function FileManager({ serverId }: FileManagerProps) {
  const [cwd, setCwd] = useState("/");
  const [files, setFiles] = useState<FileObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [renamingFile, setRenamingFile] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [movingFile, setMovingFile] = useState<string | null>(null);
  const [moveTarget, setMoveTarget] = useState("");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; name: string; isFile: boolean } | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const renameInputRef = useRef<HTMLInputElement>(null);

  const fetchFiles = useCallback(async (dir: string) => {
    setLoading(true);
    setSelected(new Set());
    try {
      const res = await fetch(
        `/api/pelican/servers/${serverId}/files?directory=${encodeURIComponent(dir)}`
      );
      if (res.ok) setFiles(await res.json());
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [serverId]);

  useEffect(() => { fetchFiles(cwd); }, [cwd, fetchFiles]);
  useEffect(() => {
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const navigateTo = (name: string) => setCwd(cwd === "/" ? `/${name}` : `${cwd}/${name}`);
  const goUp = () => { const p = cwd.split("/").filter(Boolean); p.pop(); setCwd(p.length === 0 ? "/" : `/${p.join("/")}`); };

  const openFile = async (name: string) => {
    const filePath = cwd === "/" ? `/${name}` : `${cwd}/${name}`;
    try {
      const res = await fetch(`/api/pelican/servers/${serverId}/files?file=${encodeURIComponent(filePath)}`);
      if (res.ok) { setEditContent(await res.text()); setEditingFile(filePath); }
    } catch { /* ignore */ }
  };

  const saveFile = async () => {
    if (!editingFile) return;
    setSaving(true);
    try {
      await fetch(`/api/pelican/servers/${serverId}/files`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "write", file: editingFile, content: editContent }),
      });
      setEditingFile(null);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const deleteItems = async (names: string[]) => {
    if (!confirm(`Delete ${names.length} item${names.length > 1 ? "s" : ""}?`)) return;
    try {
      await fetch(`/api/pelican/servers/${serverId}/files`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete", root: cwd, files: names }),
      });
      setSelected(new Set()); fetchFiles(cwd);
    } catch { /* ignore */ }
  };

  const renameItem = async (oldName: string, newName: string) => {
    if (!newName.trim() || newName === oldName) { setRenamingFile(null); return; }
    try {
      await fetch(`/api/pelican/servers/${serverId}/files`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rename", root: cwd, from: oldName, to: newName.trim() }),
      });
      setRenamingFile(null); fetchFiles(cwd);
    } catch { setRenamingFile(null); }
  };

  const moveItem = async (name: string, targetDir: string) => {
    if (!targetDir.trim()) { setMovingFile(null); return; }
    const to = targetDir.endsWith("/") ? `${targetDir}${name}` : `${targetDir}/${name}`;
    try {
      await fetch(`/api/pelican/servers/${serverId}/files`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "rename", root: cwd, from: name, to }),
      });
      setMovingFile(null); fetchFiles(cwd);
    } catch { setMovingFile(null); }
  };

  const createFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await fetch(`/api/pelican/servers/${serverId}/files`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create-folder", root: cwd, name: newFolderName.trim() }),
      });
      setNewFolderName(""); setShowNewFolder(false); fetchFiles(cwd);
    } catch { /* ignore */ }
  };

  const toggleSelect = (name: string) => {
    setSelected((prev) => { const n = new Set(prev); if (n.has(name)) n.delete(name); else n.add(name); return n; });
  };
  const toggleSelectAll = () => {
    setSelected(selected.size === files.length ? new Set() : new Set(files.map((f) => f.name)));
  };
  const startRename = (name: string) => { setRenamingFile(name); setRenameValue(name); setContextMenu(null); setTimeout(() => renameInputRef.current?.focus(), 50); };
  const startMove = (name: string) => { setMovingFile(name); setMoveTarget(cwd === "/" ? "/" : cwd + "/"); setContextMenu(null); };
  const handleContextMenu = (e: React.MouseEvent, file: FileObject) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY, name: file.name, isFile: file.is_file }); };

  // Breadcrumb
  const pathParts = cwd.split("/").filter(Boolean);
  const breadcrumb = cwd === "/" ? "Home" : pathParts[pathParts.length - 1];

  // --- Editor view ---
  if (editingFile) {
    return (
      <div className="rounded-xl border border-white/[0.07] bg-[#232839] overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2 text-sm">
            <FileCode className="h-4 w-4 text-[#8b92a8]" />
            <span className="font-mono text-[13px] text-[#e2e8f0]">{editingFile}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={saveFile} disabled={saving}
              className="flex items-center gap-1.5 rounded-lg bg-[#5b8cff] px-4 py-1.5 text-[12px] font-bold text-white transition-colors hover:bg-[#4a7bee] disabled:opacity-50">
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              Save
            </button>
            <button onClick={() => setEditingFile(null)}
              className="rounded-lg p-1.5 text-[#8b92a8] transition-colors hover:bg-white/5 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
        <textarea
          value={editContent} onChange={(e) => setEditContent(e.target.value)}
          className="h-[500px] w-full resize-none bg-[#1a1e2e] p-5 font-mono text-[13px] leading-[1.7] text-[#c8ccd4] outline-none"
          spellCheck={false}
        />
      </div>
    );
  }

  // --- Move modal ---
  if (movingFile) {
    return (
      <div className="rounded-xl border border-white/[0.07] bg-[#232839] p-5">
        <h3 className="text-[15px] font-bold text-[#e2e8f0] mb-4">
          Move <span className="font-mono text-[#5b8cff]">{movingFile}</span>
        </h3>
        <div className="space-y-3">
          <div>
            <label className="text-[11px] uppercase tracking-wider text-[#8b92a8] mb-1.5 block">Destination directory</label>
            <input value={moveTarget} onChange={(e) => setMoveTarget(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && moveItem(movingFile, moveTarget)}
              className="w-full rounded-lg border border-white/[0.07] bg-[#1a1e2e] px-4 py-2.5 font-mono text-[13px] text-[#e2e8f0] outline-none focus:border-[#5b8cff]/40"
              placeholder="/target/directory/" autoFocus />
          </div>
          <div className="flex gap-2">
            <button onClick={() => moveItem(movingFile, moveTarget)}
              className="rounded-lg bg-[#5b8cff] px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-[#4a7bee]">Move</button>
            <button onClick={() => setMovingFile(null)}
              className="rounded-lg px-4 py-2 text-[13px] text-[#8b92a8] transition-colors hover:bg-white/5 hover:text-white">Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  // --- File list ---
  const sorted = [...files].sort((a, b) => {
    if (a.is_file === b.is_file) return a.name.localeCompare(b.name);
    return a.is_file ? 1 : -1;
  });
  const filtered = searchQuery ? sorted.filter((f) => f.name.toLowerCase().includes(searchQuery.toLowerCase())) : sorted;
  const folderCount = files.filter((f) => !f.is_file).length;
  const fileCount = files.filter((f) => f.is_file).length;

  return (
    <div className="rounded-xl border border-white/[0.07] bg-[#232839] overflow-hidden">
      {/* Header bar — Shockbyte style */}
      <div className="flex items-center justify-between px-5 py-3">
        <div className="flex items-center gap-2">
          <button onClick={toggleSelectAll} className="shrink-0 text-[#8b92a8] hover:text-white transition-colors">
            {selected.size === files.length && files.length > 0 ? <CheckSquare className="h-4 w-4 text-[#5b8cff]" /> : <Square className="h-4 w-4" />}
          </button>
          <span className="text-[15px] font-bold text-[#e2e8f0]">File Manager</span>
          <span className="text-[13px] text-[#8b92a8] ml-1">{breadcrumb}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-white/[0.07] bg-[#1a1e2e] px-3 py-1.5">
            <Search className="h-3.5 w-3.5 text-[#8b92a8]" />
            <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search here" className="w-28 bg-transparent text-[12px] text-[#e2e8f0] outline-none placeholder:text-[#6b7280]" />
          </div>
          <button onClick={() => fetchFiles(cwd)} className="rounded-lg p-1.5 text-[#8b92a8] transition-colors hover:bg-white/5 hover:text-white" title="Refresh">
            <RefreshCcw className="h-4 w-4" />
          </button>
          {cwd !== "/" && (
            <button onClick={goUp} className="rounded-lg p-1.5 text-[#8b92a8] transition-colors hover:bg-white/5 hover:text-white" title="Go up">
              <ArrowUp className="h-4 w-4" />
            </button>
          )}
          <button onClick={() => { setShowNewFolder(!showNewFolder); setNewFolderName(""); }}
            className="rounded-lg bg-[#5b8cff] px-3 py-1.5 text-[12px] font-bold text-white transition-colors hover:bg-[#4a7bee]">
            New Folder
          </button>
        </div>
      </div>

      {/* New folder input */}
      {showNewFolder && (
        <div className="flex items-center gap-2 border-t border-white/[0.07] px-5 py-2.5 bg-[#1a1e2e]">
          <FolderPlus className="h-4 w-4 text-[#8b92a8] shrink-0" />
          <input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") createFolder(); if (e.key === "Escape") setShowNewFolder(false); }}
            placeholder="New folder name..." className="flex-1 bg-transparent text-[13px] text-[#e2e8f0] outline-none placeholder:text-[#6b7280]" autoFocus />
          <button onClick={createFolder} className="rounded-lg bg-[#5b8cff] px-3 py-1 text-[12px] font-bold text-white">Create</button>
        </div>
      )}

      {/* Table header */}
      {!loading && files.length > 0 && (
        <div className="grid grid-cols-[40px_1fr_100px_80px_140px_40px] items-center border-t border-b border-white/[0.07] px-5 py-2 bg-[#1e2335]">
          <div />
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8b92a8]">Name</span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8b92a8]">Type</span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8b92a8] text-center">Size</span>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8b92a8] text-right">Last Modified</span>
          <div />
        </div>
      )}

      {/* File rows */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-5 w-5 animate-spin text-[#8b92a8]" />
        </div>
      ) : files.length === 0 ? (
        <div className="py-20 text-center text-[13px] text-[#8b92a8]">Empty directory</div>
      ) : (
        <div className="max-h-[480px] overflow-y-auto">
          {filtered.map((file) => {
            const isSelected = selected.has(file.name);
            const isRenaming = renamingFile === file.name;
            return (
              <div key={file.name} onContextMenu={(e) => handleContextMenu(e, file)}
                className={`grid grid-cols-[40px_1fr_100px_80px_140px_40px] items-center px-5 py-2.5 border-b border-white/[0.04] transition-colors cursor-default ${
                  isSelected ? "bg-[#5b8cff]/[0.06]" : "hover:bg-white/[0.02]"
                }`}>
                {/* Checkbox */}
                <button onClick={(e) => { e.stopPropagation(); toggleSelect(file.name); }} className="text-[#8b92a8] hover:text-white transition-colors">
                  {isSelected ? <CheckSquare className="h-4 w-4 text-[#5b8cff]" /> : <Square className="h-4 w-4" />}
                </button>

                {/* Name */}
                <button onClick={() => file.is_file ? openFile(file.name) : navigateTo(file.name)} className="flex items-center gap-2.5 min-w-0 text-left">
                  {file.is_file ? <FileText className="h-4 w-4 shrink-0 text-[#8b92a8]" /> : <Folder className="h-4 w-4 shrink-0 text-[#5b8cff]" />}
                  {isRenaming ? (
                    <input ref={renameInputRef} value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") renameItem(file.name, renameValue); if (e.key === "Escape") setRenamingFile(null); }}
                      onBlur={() => renameItem(file.name, renameValue)} onClick={(e) => e.stopPropagation()}
                      className="min-w-0 flex-1 rounded border border-[#5b8cff]/30 bg-[#1a1e2e] px-2 py-0.5 text-[13px] text-white outline-none" autoFocus />
                  ) : (
                    <span className="truncate text-[13px] text-[#e2e8f0] hover:text-white transition-colors">{file.name}</span>
                  )}
                </button>

                {/* Type */}
                <span className="text-[12px] text-[#8b92a8]">{file.is_file ? "File" : "Directory"}</span>

                {/* Size */}
                <span className="text-[12px] text-[#8b92a8] text-center">{file.is_file ? formatSize(file.size) : "-"}</span>

                {/* Modified */}
                <span className="text-[12px] text-[#8b92a8] text-right">{formatDate(file.modified_at)}</span>

                {/* Actions */}
                <button onClick={(e) => { e.stopPropagation(); const r = e.currentTarget.getBoundingClientRect(); setContextMenu({ x: r.left, y: r.bottom + 4, name: file.name, isFile: file.is_file }); }}
                  className="text-[#8b92a8] hover:text-white transition-colors justify-self-center">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* File count */}
      {!loading && files.length > 0 && (
        <div className="px-5 py-2 text-[12px] text-[#5b8cff] border-t border-white/[0.07]">
          {folderCount} Folder{folderCount !== 1 ? "s" : ""}, {fileCount} File{fileCount !== 1 ? "s" : ""}
        </div>
      )}

      {/* Bottom action bar — Shockbyte style */}
      {!loading && files.length > 0 && (
        <div className="flex items-center justify-between border-t border-white/[0.07] px-5 py-3 bg-[#1e2335]">
          <div className="flex items-center gap-2">
            <ActionBtn label="Move" disabled={selected.size === 0} onClick={() => { if (selected.size === 1) startMove([...selected][0]); }} />
            <ActionBtn label="Delete" disabled={selected.size === 0} danger onClick={() => deleteItems([...selected])} />
          </div>
          <div className="flex items-center gap-2">
            {/* placeholder right-side actions */}
          </div>
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (
        <div className="fixed z-50 w-44 rounded-lg border border-white/[0.07] bg-[#232839] py-1 shadow-xl"
          style={{ left: contextMenu.x, top: contextMenu.y }} onClick={(e) => e.stopPropagation()}>
          {contextMenu.isFile && (
            <CtxMenuItem icon={FileCode} label="Edit" onClick={() => { openFile(contextMenu.name); setContextMenu(null); }} />
          )}
          {!contextMenu.isFile && (
            <CtxMenuItem icon={Folder} label="Open" onClick={() => { navigateTo(contextMenu.name); setContextMenu(null); }} />
          )}
          <CtxMenuItem icon={Pencil} label="Rename" onClick={() => startRename(contextMenu.name)} />
          <CtxMenuItem icon={FolderInput} label="Move" onClick={() => startMove(contextMenu.name)} />
          <div className="my-1 border-t border-white/[0.07]" />
          <CtxMenuItem icon={Trash2} label="Delete" onClick={() => { deleteItems([contextMenu.name]); setContextMenu(null); }} danger />
        </div>
      )}
    </div>
  );
}

function ActionBtn({ label, onClick, disabled = false, danger = false }: { label: string; onClick?: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`rounded-lg border px-4 py-1.5 text-[12px] font-semibold transition-colors disabled:opacity-30 ${
        danger ? "border-[#e74c4c]/30 text-[#e74c4c] hover:bg-[#e74c4c]/10" : "border-white/[0.07] text-[#e2e8f0] hover:bg-white/[0.04]"
      }`}>
      {label}
    </button>
  );
}

function CtxMenuItem({ icon: Icon, label, onClick, danger = false }: { icon: React.ComponentType<{ className?: string }>; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-3 py-2 text-[13px] transition-colors ${
        danger ? "text-[#e74c4c] hover:bg-[#e74c4c]/10" : "text-[#e2e8f0] hover:bg-white/[0.06]"
      }`}>
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
