"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Loader2, Save, Egg } from "lucide-react";
import { toast } from "sonner";

interface EggOption {
  id: number;
  name: string;
}

const defaultForm = {
  name: "",
  type: "MINECRAFT",
  eggId: "",
  description: "",
  ramMb: 2048,
  cpuPercent: 100,
  diskMb: 10240,
  playerSlots: 20,
  backupSlots: 1,
  priceMonthly: 5,
  features: "",
  sortOrder: 0,
};

export function CreatePlanButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [eggs, setEggs] = useState<EggOption[]>([]);
  const [form, setForm] = useState({ ...defaultForm });

  useEffect(() => {
    if (!open) return;
    fetch("/api/admin/eggs")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setEggs(data.map((e: { id: number; name: string }) => ({ id: e.id, name: e.name })));
      })
      .catch(() => {});
  }, [open]);

  async function handleCreate() {
    if (!form.name.trim()) {
      toast.error("Plan name is required");
      return;
    }
    setLoading(true);
    try {
      const features = form.features.split(",").map((f) => f.trim()).filter(Boolean);
      const res = await fetch("/api/admin/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          type: form.type,
          eggId: form.eggId ? Number(form.eggId) : null,
          description: form.description || null,
          ramMb: Number(form.ramMb),
          cpuPercent: Number(form.cpuPercent),
          diskMb: Number(form.diskMb),
          playerSlots: Number(form.playerSlots),
          backupSlots: Number(form.backupSlots),
          priceMonthly: Math.round(Number(form.priceMonthly) * 100),
          features,
          sortOrder: Number(form.sortOrder),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to create plan");
      } else {
        toast.success("Plan created");
        setOpen(false);
        setForm({ ...defaultForm });
        router.refresh();
      }
    } catch {
      toast.error("Failed to create plan");
    } finally {
      setLoading(false);
    }
  }

  const fields: { key: keyof typeof form; label: string; type: string; suffix?: string; options?: { value: string; label: string }[] }[] = [
    { key: "name", label: "Name", type: "text" },
    { key: "type", label: "Product Type", type: "select", options: [
      { value: "MINECRAFT", label: "Minecraft" },
      { value: "DISCORD_BOT", label: "Discord Bot" },
      { value: "CUSTOM", label: "Custom" },
    ] },
    { key: "eggId", label: "Pelican Egg", type: "egg-select" },
    { key: "description", label: "Description", type: "text" },
    { key: "ramMb", label: "RAM", type: "number", suffix: "MB" },
    { key: "cpuPercent", label: "CPU", type: "number", suffix: "%" },
    { key: "diskMb", label: "Disk", type: "number", suffix: "MB" },
    { key: "playerSlots", label: "Player Slots", type: "number" },
    { key: "backupSlots", label: "Backup Slots", type: "number" },
    { key: "priceMonthly", label: "Price", type: "number", suffix: "$" },
    { key: "sortOrder", label: "Sort Order", type: "number" },
    { key: "features", label: "Features (comma-separated)", type: "text" },
  ];

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        className="bg-[#00c98d] text-white hover:bg-[#4a7aee]"
      >
        <Plus className="mr-2 h-4 w-4" />
        Create Plan
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg bg-[#1a1e2e] border-white/[0.07] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Create New Plan</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2 max-h-[60vh] overflow-y-auto pr-1">
            {fields.map((f) => (
              <div key={f.key} className={f.key === "features" || f.key === "description" ? "col-span-2" : ""}>
                <Label className="text-xs text-[#8b92a8]">{f.label}</Label>
                {f.type === "select" && f.options ? (
                  <select
                    value={String(form[f.key])}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    className="mt-1 w-full rounded-md border border-white/[0.07] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none"
                  >
                    {f.options.map((o) => (
                      <option key={o.value} value={o.value} className="bg-[#1a1e2e]">{o.label}</option>
                    ))}
                  </select>
                ) : f.type === "egg-select" ? (
                  <select
                    value={String(form[f.key])}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                    className="mt-1 w-full rounded-md border border-white/[0.07] bg-white/[0.04] px-3 py-2 text-sm text-white outline-none"
                  >
                    <option value="" className="bg-[#1a1e2e]">Default (auto-detect)</option>
                    {eggs.map((e) => (
                      <option key={e.id} value={String(e.id)} className="bg-[#1a1e2e]">
                        #{e.id} — {e.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="relative">
                    <Input
                      type={f.type}
                      value={form[f.key]}
                      onChange={(e) =>
                        setForm({ ...form, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value })
                      }
                      className="mt-1 border-white/[0.07] bg-white/[0.04] text-white placeholder:text-[#8b92a8]"
                    />
                    {f.suffix && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8b92a8] mt-0.5">{f.suffix}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose
              render={
                <Button variant="outline" className="border-white/[0.07] text-[#8b92a8] hover:text-white hover:bg-white/[0.04]" />
              }
            >
              Cancel
            </DialogClose>
            <Button onClick={handleCreate} disabled={loading} className="bg-[#00c98d] text-white hover:bg-[#4a7aee]">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Create Plan
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
