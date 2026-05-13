import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PackageOpen, MemoryStick, Cpu, HardDrive, Users, Check, Egg } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { PlanActions } from "@/components/admin/plan-actions";
import { CreatePlanButton } from "@/components/admin/create-plan";

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatMb(mb: number): string {
  return mb >= 1024 ? `${(mb / 1024).toFixed(0)} GB` : `${mb} MB`;
}

const planTypeConfig: Record<string, { label: string; className: string }> = {
  MINECRAFT: { label: "Minecraft", className: "bg-green-500/10 text-green-400 border-green-500/20" },
  DISCORD_BOT: { label: "Discord Bot", className: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  CUSTOM: { label: "Custom", className: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
};

async function getPlans() {
  return prisma.plan.findMany({
    orderBy: { sortOrder: "asc" },
    include: {
      _count: { select: { orders: true, services: true } },
    },
  });
}

export default async function AdminPlansPage() {
  const plans = await getPlans();
  const activePlans = plans.filter((p) => p.isActive);
  const totalServices = plans.reduce((s, p) => s + p._count.services, 0);
  const totalOrders = plans.reduce((s, p) => s + p._count.orders, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Plan Management</h1>
          <p className="mt-1 text-sm text-[#8b92a8]">
            Manage hosting plans and pricing
          </p>
        </div>
        <CreatePlanButton />
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Total Plans", value: plans.length, color: "text-white" },
          { label: "Active", value: activePlans.length, color: "text-green-400" },
          { label: "Services", value: totalServices, color: "text-[#00c98d]" },
          { label: "Orders", value: totalOrders, color: "text-purple-400" },
        ].map((s) => (
          <Card key={s.label} className="border-white/5 bg-white/[0.02]">
            <CardContent className="p-5">
              <p className="text-xs text-[#8b92a8]">{s.label}</p>
              <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="border-white/5 bg-white/[0.02]">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-[#8b92a8]">Plan</TableHead>
                <TableHead className="text-[#8b92a8]">Type</TableHead>
                <TableHead className="text-[#8b92a8]">Resources</TableHead>
                <TableHead className="text-[#8b92a8]">Monthly</TableHead>
                <TableHead className="text-[#8b92a8]">Usage</TableHead>
                <TableHead className="text-[#8b92a8]">Status</TableHead>
                <TableHead className="text-right text-[#8b92a8]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.length === 0 ? (
                <TableRow className="border-white/5">
                  <TableCell colSpan={7} className="py-12 text-center text-[#8b92a8]">
                    <PackageOpen className="mx-auto mb-3 h-10 w-10 text-slate-600" />
                    No plans configured
                  </TableCell>
                </TableRow>
              ) : (
                plans.map((plan) => (
                  <TableRow key={plan.id} className="border-white/5 hover:bg-white/[0.02]">
                    <TableCell>
                      <div>
                        <p className="font-medium text-white">{plan.name}</p>
                        <p className="text-xs text-[#8b92a8]">
                          {plan.slug}
                          {plan.eggId && <span> &middot; Egg #{plan.eggId}</span>}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const tc = planTypeConfig[plan.type] ?? planTypeConfig.CUSTOM;
                        return <Badge variant="outline" className={tc.className}>{tc.label}</Badge>;
                      })()}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 text-xs">
                        <span className="flex items-center gap-1 text-[#8b92a8]">
                          <MemoryStick className="h-3 w-3 text-[#00c98d]" />
                          <span className="text-white">{formatMb(plan.ramMb)}</span>
                        </span>
                        <span className="flex items-center gap-1 text-[#8b92a8]">
                          <Cpu className="h-3 w-3 text-purple-400" />
                          <span className="text-white">{plan.cpuPercent}%</span>
                        </span>
                        <span className="flex items-center gap-1 text-[#8b92a8]">
                          <HardDrive className="h-3 w-3 text-green-400" />
                          <span className="text-white">{formatMb(plan.diskMb)}</span>
                        </span>
                        <span className="flex items-center gap-1 text-[#8b92a8]">
                          <Users className="h-3 w-3 text-cyan-400" />
                          <span className="text-white">{plan.playerSlots}</span>
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-lg font-bold text-white">{formatCents(plan.priceMonthly)}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3 text-xs text-[#8b92a8]">
                        <span><span className="font-medium text-white">{plan._count.services}</span> services</span>
                        <span><span className="font-medium text-white">{plan._count.orders}</span> orders</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          plan.isActive
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : "bg-slate-500/10 text-slate-500 border-slate-500/20"
                        }
                      >
                        {plan.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <PlanActions
                        plan={{
                          id: plan.id,
                          name: plan.name,
                          type: plan.type,
                          eggId: plan.eggId,
                          description: plan.description,
                          ramMb: plan.ramMb,
                          cpuPercent: plan.cpuPercent,
                          diskMb: plan.diskMb,
                          playerSlots: plan.playerSlots,
                          backupSlots: plan.backupSlots,
                          priceMonthly: plan.priceMonthly,
                          trialDays: (plan as unknown as { trialDays?: number }).trialDays ?? 0,
                          features: plan.features,
                          isActive: plan.isActive,
                          sortOrder: plan.sortOrder,
                          hasServices: plan._count.services > 0,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Active plan cards */}
      {activePlans.length > 0 && (
        <>
          <h2 className="text-lg font-semibold text-white">Active Plans</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {activePlans.map((plan) => (
              <Card key={plan.id} className="overflow-hidden border-white/5 bg-white/[0.02]">
                {/* Header with price */}
                <div className="flex items-center justify-between border-b border-white/[0.07] p-5">
                  <div>
                    <h3 className="font-semibold text-white">{plan.name}</h3>
                    {plan.description && (
                      <p className="mt-0.5 text-xs text-[#8b92a8]">{plan.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-white">{formatCents(plan.priceMonthly)}</span>
                    <span className="text-xs text-[#8b92a8]">/mo</span>
                  </div>
                </div>

                {/* Resources grid */}
                <div className="grid grid-cols-3 gap-px bg-white/[0.03]">
                  {[
                    { label: "RAM", value: formatMb(plan.ramMb), icon: MemoryStick, color: "text-[#00c98d]" },
                    { label: "CPU", value: `${plan.cpuPercent}%`, icon: Cpu, color: "text-purple-400" },
                    { label: "Disk", value: formatMb(plan.diskMb), icon: HardDrive, color: "text-green-400" },
                  ].map((r) => (
                    <div key={r.label} className="bg-[#1a1e2e] px-4 py-3 text-center">
                      <r.icon className={`mx-auto h-4 w-4 ${r.color}`} />
                      <p className="mt-1 text-sm font-bold text-white">{r.value}</p>
                      <p className="text-[10px] uppercase tracking-wider text-[#8b92a8]">{r.label}</p>
                    </div>
                  ))}
                </div>

                {/* Features */}
                <div className="p-5">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center gap-2 text-[#8b92a8]">
                      <Users className="h-3 w-3 text-cyan-400" />
                      <span className="text-white">{plan.playerSlots}</span> players
                    </div>
                    <div className="flex items-center gap-2 text-[#8b92a8]">
                      <span className="text-white">{plan.backupSlots}</span> backups
                    </div>
                  </div>
                  {plan.features.length > 0 && (
                    <ul className="mt-3 space-y-1.5 border-t border-white/[0.05] pt-3">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-center gap-2 text-xs text-[#c8cdd8]">
                          <Check className="h-3.5 w-3.5 text-green-400" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-3 flex items-center justify-between border-t border-white/[0.05] pt-3 text-xs text-[#8b92a8]">
                    <span>{plan._count.services} active services</span>
                    <span>{plan._count.orders} orders</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
