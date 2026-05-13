"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Loader2 } from "lucide-react";

type Plan = { id: string; name: string; type: string; priceMonthly: number; trialDays: number };
type User = { id: string; name: string; email: string };

export function CreateFreeServiceButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState("");
  const [form, setForm] = useState({
    userId: "",
    planId: "",
    serverName: "",
    serviceType: "free" as "free" | "trial",
    trialDays: 7,
    mcVersion: "latest",
    serverType: "paper",
  });

  useEffect(() => {
    if (!open) return;
    Promise.all([
      fetch("/api/admin/plans?all=1").then((r) => r.json()),
      fetch("/api/admin/users?limit=50").then((r) => r.json()),
    ]).then(([p, u]) => {
      setPlans(Array.isArray(p) ? p : p.plans ?? []);
      setUsers(Array.isArray(u) ? u : u.users ?? []);
    }).catch(() => {});
  }, [open]);

  const selectedPlan = plans.find((p) => p.id === form.planId);
  const isMc = selectedPlan?.type === "MINECRAFT";
  const filteredUsers = users.filter(
    (u) => !userSearch || u.name.toLowerCase().includes(userSearch.toLowerCase()) || u.email.toLowerCase().includes(userSearch.toLowerCase())
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.userId || !form.planId || !form.serverName) {
      toast.error("Fill in all required fields");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/services/free", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: form.userId,
          planId: form.planId,
          serverName: form.serverName,
          isTrial: form.serviceType === "trial",
          trialDays: form.serviceType === "trial" ? form.trialDays : 0,
          mcVersion: isMc ? form.mcVersion : undefined,
          serverType: isMc ? form.serverType : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      toast.success("Service created successfully!");
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create service");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="bg-[#5865F2] text-white hover:bg-[#4752c4]">
        <Plus className="mr-2 h-4 w-4" /> Create Free Service
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg bg-[#1a1e2e] border-white/[0.07] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Create Free / Trial Service</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            {/* Service type */}
            <div>
              <label className="block text-xs font-semibold text-[#8b92a8] uppercase tracking-wide mb-1.5">Service Type</label>
              <div className="flex gap-2">
                {(["free", "trial"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, serviceType: t }))}
                    className={`flex-1 rounded-lg border py-2 text-sm font-semibold capitalize transition-all ${
                      form.serviceType === t
                        ? "border-[#00c98d]/50 bg-[#00c98d]/10 text-[#00c98d]"
                        : "border-white/[0.08] bg-white/[0.03] text-[#8b92a8] hover:border-white/20"
                    }`}
                  >
                    {t === "free" ? "Free (Permanent)" : "Free Trial"}
                  </button>
                ))}
              </div>
            </div>

            {/* Trial duration */}
            {form.serviceType === "trial" && (
              <div>
                <label className="block text-xs font-semibold text-[#8b92a8] uppercase tracking-wide mb-1.5">
                  Trial Duration (days)
                </label>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={form.trialDays}
                  onChange={(e) => setForm((f) => ({ ...f, trialDays: Number(e.target.value) }))}
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder-[#8b92a8] focus:border-[#00c98d]/50 focus:outline-none"
                />
              </div>
            )}

            {/* User select */}
            <div>
              <label className="block text-xs font-semibold text-[#8b92a8] uppercase tracking-wide mb-1.5">User</label>
              <input
                type="text"
                placeholder="Search by name or email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full rounded-t-lg border border-b-0 border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder-[#8b92a8] focus:outline-none"
              />
              <select
                required
                value={form.userId}
                onChange={(e) => setForm((f) => ({ ...f, userId: e.target.value }))}
                className="w-full rounded-b-lg border border-white/[0.08] bg-[#1a1e2e] px-3 py-2 text-sm text-white focus:border-[#00c98d]/50 focus:outline-none"
                size={4}
              >
                <option value="" className="text-[#8b92a8]">— Select user —</option>
                {filteredUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                ))}
              </select>
            </div>

            {/* Plan select */}
            <div>
              <label className="block text-xs font-semibold text-[#8b92a8] uppercase tracking-wide mb-1.5">Plan</label>
              <select
                required
                value={form.planId}
                onChange={(e) => setForm((f) => ({ ...f, planId: e.target.value }))}
                className="w-full rounded-lg border border-white/[0.08] bg-[#1a1e2e] px-3 py-2 text-sm text-white focus:border-[#00c98d]/50 focus:outline-none"
              >
                <option value="">— Select plan —</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.type}] {p.name} — ${(p.priceMonthly / 100).toFixed(2)}/mo
                    {p.trialDays > 0 ? ` (${p.trialDays}d trial)` : ""}
                  </option>
                ))}
              </select>
            </div>

            {/* Server name */}
            <div>
              <label className="block text-xs font-semibold text-[#8b92a8] uppercase tracking-wide mb-1.5">Server / Bot Name</label>
              <input
                required
                type="text"
                placeholder="e.g. My Trial Server"
                value={form.serverName}
                onChange={(e) => setForm((f) => ({ ...f, serverName: e.target.value }))}
                className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder-[#8b92a8] focus:border-[#00c98d]/50 focus:outline-none"
              />
            </div>

            {/* Minecraft-specific */}
            {isMc && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#8b92a8] uppercase tracking-wide mb-1.5">MC Version</label>
                  <input
                    type="text"
                    placeholder="latest"
                    value={form.mcVersion}
                    onChange={(e) => setForm((f) => ({ ...f, mcVersion: e.target.value }))}
                    className="w-full rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder-[#8b92a8] focus:border-[#00c98d]/50 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#8b92a8] uppercase tracking-wide mb-1.5">Server Type</label>
                  <select
                    value={form.serverType}
                    onChange={(e) => setForm((f) => ({ ...f, serverType: e.target.value }))}
                    className="w-full rounded-lg border border-white/[0.08] bg-[#1a1e2e] px-3 py-2 text-sm text-white focus:border-[#00c98d]/50 focus:outline-none"
                  >
                    {["paper", "fabric", "forge", "purpur", "vanilla", "bungeecord", "velocity"].map((t) => (
                      <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-white/10 text-[#8b92a8] hover:text-white">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="bg-[#00c98d] text-white hover:bg-[#00e0a0]">
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Provisioning…</> : "Create Service"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
