"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Plus, Pencil, Trash2, Eye, EyeOff, Loader2, X, Upload, ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  coverImage: string | null;
  tags: string[];
  published: boolean;
  publishedAt: string | null;
  readMinutes: number;
  author: { name: string; email: string };
  createdAt: string;
}

const emptyForm = {
  id: "",
  title: "",
  excerpt: "",
  content: "",
  coverImage: "",
  tags: "",
  readMinutes: 5,
  published: false,
};

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/blog");
    if (res.ok) setPosts(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() {
    setForm(emptyForm);
    setEditing(true);
  }

  function openEdit(p: BlogPost) {
    setForm({
      id: p.id,
      title: p.title,
      excerpt: p.excerpt ?? "",
      content: p.content,
      coverImage: p.coverImage ?? "",
      tags: p.tags.join(", "),
      readMinutes: p.readMinutes,
      published: p.published,
    });
    setEditing(true);
  }

  async function save() {
    if (!form.title.trim() || !form.content.trim()) {
      toast.error("Title and content are required");
      return;
    }
    setSaving(true);
    const payload = {
      id: form.id || undefined,
      title: form.title,
      excerpt: form.excerpt || null,
      content: form.content,
      coverImage: form.coverImage || null,
      tags: form.tags.split(",").map((t) => t.trim()).filter(Boolean),
      readMinutes: form.readMinutes,
      published: form.published,
    };
    const res = await fetch("/api/admin/blog", {
      method: form.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) { toast.error(data.error || "Failed"); }
    else { toast.success(form.id ? "Post updated!" : "Post created!"); setEditing(false); load(); }
    setSaving(false);
  }

  async function togglePublish(post: BlogPost) {
    const res = await fetch("/api/admin/blog", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: post.id, published: !post.published }),
    });
    if (res.ok) { toast.success(!post.published ? "Published!" : "Unpublished"); load(); }
    else toast.error("Failed");
  }

  async function deletePost(id: string) {
    setDeleting(id);
    const res = await fetch("/api/admin/blog", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) { toast.success("Post deleted"); load(); }
    else toast.error("Failed to delete");
    setDeleting(null);
  }

  async function uploadImage(file: File) {
    setUploading(true);
    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type, sizeBytes: file.size, folder: "blog" }),
      });
      const { uploadUrl, publicUrl } = await res.json();
      await fetch(uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
      setForm((f) => ({ ...f, coverImage: publicUrl }));
      toast.success("Image uploaded!");
    } catch { toast.error("Upload failed"); }
    setUploading(false);
  }

  if (editing) {
    return (
      <div className="max-w-4xl mx-auto space-y-5 pb-10">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">{form.id ? "Edit Post" : "New Post"}</h1>
          <button onClick={() => setEditing(false)} className="text-[#8b92a8] hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid gap-4">
          {/* Cover Image */}
          <div className="rounded-xl border border-white/[0.06] bg-[#1a1e2e] p-5">
            <label className="block text-xs font-semibold text-[#8b92a8] mb-3 uppercase tracking-wide">Cover Image</label>
            {form.coverImage ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.coverImage} alt="Cover" className="w-full h-48 object-cover rounded-lg" />
                <button
                  onClick={() => setForm((f) => ({ ...f, coverImage: "" }))}
                  className="absolute top-2 right-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-white/10 py-10 text-[#8b92a8] hover:border-[#00c98d]/30 hover:text-[#00c98d] transition-colors"
              >
                {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImageIcon className="h-6 w-6" />}
                <span className="text-xs">{uploading ? "Uploading…" : "Click to upload cover image"}</span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); }}
            />
            <div className="mt-2 flex items-center gap-2">
              <span className="text-[10px] text-[#8b92a8]">Or paste URL:</span>
              <input
                value={form.coverImage}
                onChange={(e) => setForm((f) => ({ ...f, coverImage: e.target.value }))}
                placeholder="https://..."
                className="flex-1 rounded-lg border border-white/[0.08] bg-[#111520] px-3 py-1.5 text-xs text-white placeholder:text-[#8b92a8] outline-none focus:border-[#00c98d]/40"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[#8b92a8] mb-1.5 uppercase tracking-wide">Title *</label>
            <input
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="Post title"
              className="w-full rounded-xl border border-white/[0.08] bg-[#1a1e2e] px-4 py-3 text-lg font-bold text-white placeholder:text-[#8b92a8] outline-none focus:border-[#00c98d]/40"
            />
          </div>

          {/* Excerpt */}
          <div>
            <label className="block text-xs font-semibold text-[#8b92a8] mb-1.5 uppercase tracking-wide">Excerpt</label>
            <textarea
              value={form.excerpt}
              onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))}
              placeholder="Short summary shown on blog listing..."
              rows={2}
              className="w-full rounded-xl border border-white/[0.08] bg-[#1a1e2e] px-4 py-3 text-sm text-white placeholder:text-[#8b92a8] outline-none focus:border-[#00c98d]/40 resize-none"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-semibold text-[#8b92a8] mb-1.5 uppercase tracking-wide">Content * (Markdown)</label>
            <textarea
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              placeholder="Write your post in Markdown...&#10;&#10;## Heading&#10;**bold** *italic*&#10;&#10;![Alt text](image-url)"
              rows={20}
              className="w-full rounded-xl border border-white/[0.08] bg-[#1a1e2e] px-4 py-3 text-sm text-white font-mono placeholder:text-[#8b92a8] outline-none focus:border-[#00c98d]/40 resize-y"
            />
          </div>

          {/* Meta row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-[#8b92a8] mb-1.5 uppercase tracking-wide">Tags (comma-separated)</label>
              <input
                value={form.tags}
                onChange={(e) => setForm((f) => ({ ...f, tags: e.target.value }))}
                placeholder="minecraft, guide, tips"
                className="w-full rounded-xl border border-white/[0.08] bg-[#1a1e2e] px-4 py-2.5 text-sm text-white placeholder:text-[#8b92a8] outline-none focus:border-[#00c98d]/40"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#8b92a8] mb-1.5 uppercase tracking-wide">Read Time (minutes)</label>
              <input
                type="number"
                value={form.readMinutes}
                onChange={(e) => setForm((f) => ({ ...f, readMinutes: parseInt(e.target.value) || 5 }))}
                min={1}
                className="w-full rounded-xl border border-white/[0.08] bg-[#1a1e2e] px-4 py-2.5 text-sm text-white outline-none focus:border-[#00c98d]/40"
              />
            </div>
          </div>

          {/* Publish toggle + save */}
          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setForm((f) => ({ ...f, published: !f.published }))}
                className={`relative h-6 w-11 rounded-full transition-colors ${form.published ? "bg-[#00c98d]" : "bg-white/10"}`}
              >
                <div className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${form.published ? "translate-x-5" : ""}`} />
              </div>
              <span className="text-sm text-white">{form.published ? "Published" : "Draft"}</span>
            </label>
            <div className="flex items-center gap-3">
              <button onClick={() => setEditing(false)} className="rounded-xl border border-white/[0.08] px-5 py-2.5 text-sm font-semibold text-[#8b92a8] hover:text-white transition-colors">
                Cancel
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="flex items-center gap-2 rounded-xl bg-[#00c98d] px-6 py-2.5 text-sm font-bold text-white hover:bg-[#00b07d] transition-colors disabled:opacity-60"
              >
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {form.id ? "Save Changes" : "Publish Post"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Blog</h1>
          <p className="text-sm text-[#8b92a8] mt-1">{posts.length} posts total</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-xl bg-[#00c98d] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#00b07d] transition-colors"
        >
          <Plus className="h-4 w-4" /> New Post
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-[#00c98d]" /></div>
      ) : posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 py-20 gap-3">
          <p className="text-sm text-[#8b92a8]">No posts yet</p>
          <button onClick={openNew} className="flex items-center gap-2 rounded-xl bg-[#00c98d] px-4 py-2 text-sm font-bold text-white">
            <Plus className="h-4 w-4" /> Create First Post
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-white/[0.06] bg-[#1a1e2e] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-[#8b92a8] text-xs">
                <th className="px-5 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Tags</th>
                <th className="px-4 py-3 text-center">Read time</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-semibold text-white truncate max-w-xs">{post.title}</p>
                    <p className="text-[11px] text-[#8b92a8] mt-0.5">/{post.slug}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {post.tags.slice(0, 3).map((t) => (
                        <span key={t} className="rounded-full bg-white/[0.05] px-2 py-0.5 text-[10px] text-[#8b92a8]">{t}</span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-[#8b92a8] text-xs">{post.readMinutes} min</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => togglePublish(post)}
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold transition-colors ${post.published ? "bg-green-500/10 text-green-400 hover:bg-red-500/10 hover:text-red-400" : "bg-white/[0.05] text-[#8b92a8] hover:bg-green-500/10 hover:text-green-400"}`}
                    >
                      {post.published ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {post.published ? "Published" : "Draft"}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <a
                        href={`/blog/${post.slug}`}
                        target="_blank"
                        className="rounded-lg p-1.5 text-[#8b92a8] hover:text-white hover:bg-white/[0.05] transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </a>
                      <button
                        onClick={() => openEdit(post)}
                        className="rounded-lg p-1.5 text-[#8b92a8] hover:text-[#00c98d] hover:bg-[#00c98d]/5 transition-colors"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deletePost(post.id)}
                        disabled={deleting === post.id}
                        className="rounded-lg p-1.5 text-[#8b92a8] hover:text-red-400 hover:bg-red-500/5 transition-colors"
                      >
                        {deleting === post.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
