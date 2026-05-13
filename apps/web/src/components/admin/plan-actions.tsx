"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { MoreHorizontal, Pencil, Power, Trash2, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useConfirm } from "@/components/ui/confirm-dialog";

interface PlanData {
  id: string;
  name: string;
  type: string;
  eggId: number | null;
  description: string | null;
  ramMb: number;
  cpuPercent: number;
  diskMb: number;
  playerSlots: number;
  backupSlots: number;
  priceMonthly: number;
  trialDays: number;
  features: string[];
  isActive: boolean;
  sortOrder: number;
  hasServices: boolean;
}

export function PlanActions({ plan }: { plan: PlanData }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { confirm } = useConfirm();
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({
    name: plan.name,
    type: plan.type,
    eggId: plan.eggId ?? "",
    description: plan.description ?? "",
    ramMb: plan.ramMb,
    cpuPercent: plan.cpuPercent,
    diskMb: plan.diskMb,
    playerSlots: plan.playerSlots,
    backupSlots: plan.backupSlots,
    priceMonthly: plan.priceMonthly / 100,
    trialDays: plan.trialDays ?? 0,
    features: plan.features.join(", "),
    sortOrder: plan.sortOrder,
  });

  async function handleAction(action: string) {
    if (action === "delete") {
      const ok = await confirm({ title: "Delete Plan", description: `Delete plan "${plan.name}"? This cannot be undone.`, confirmLabel: "Delete", variant: "destructive" });
      if (!ok) return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id, action }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Action failed");
      }
      router.refresh();
    } catch {
      toast.error("Action failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    setLoading(true);
    try {
      const features = form.features.split(",").map((f) => f.trim()).filter(Boolean);
      const res = await fetch("/api/admin/plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: plan.id,
          action: "update",
          data: {
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
            trialDays: Number(form.trialDays),
            features,
            sortOrder: Number(form.sortOrder),
          },
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Save failed");
      } else {
        setEditOpen(false);
        router.refresh();
      }
    } catch {
      toast.error("Save failed");
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
    { key: "eggId", label: "Pelican Egg ID", type: "number" },
    { key: "description", label: "Description", type: "text" },
    { key: "ramMb", label: "RAM", type: "number", suffix: "MB" },
    { key: "cpuPercent", label: "CPU", type: "number", suffix: "%" },
    { key: "diskMb", label: "Disk", type: "number", suffix: "MB" },
    { key: "playerSlots", label: "Player Slots", type: "number" },
    { key: "backupSlots", label: "Backup Slots", type: "number" },
    { key: "priceMonthly", label: "Price", type: "number", suffix: "$" },
    { key: "trialDays", label: "Free Trial", type: "number", suffix: "days" },
    { key: "sortOrder", label: "Sort Order", type: "number" },
    { key: "features", label: "Features (comma-separated)", type: "text" },
  ];

  return (
    <>
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="sm:max-w-lg bg-[#1a1e2e] border-white/[0.07] text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Plan: {plan.name}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 py-2">
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
                ) : (
                  <div className="relative">
                    <Input
                      type={f.type}
                      value={form[f.key]}
                      onChange={(e) => setForm({ ...form, [f.key]: f.type === "number" ? Number(e.target.value) : e.target.value })}
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
            <Button onClick={handleSave} disabled={loading} className="bg-[#00c98d] text-white hover:bg-[#4a7aee]">
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#8b92a8] hover:text-white hover:bg-[#232839] transition-colors">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="bg-[#232839]">
          <DropdownMenuItem onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit Plan
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => handleAction("toggleActive")}>
            <Power className="mr-2 h-4 w-4" />
            {plan.isActive ? "Deactivate" : "Activate"}
          </DropdownMenuItem>
          {!plan.hasServices && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onClick={() => handleAction("delete")}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Plan
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}
