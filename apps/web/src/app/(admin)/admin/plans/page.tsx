import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PackageOpen } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/db";

function formatCents(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatMb(mb: number): string {
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`;
}

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Plan Management</h1>
        <p className="mt-1 text-sm text-slate-400">
          View and manage hosting plans ({plans.length} total)
        </p>
      </div>

      <Card className="border-white/5 bg-white/[0.02]">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-slate-400">Plan</TableHead>
                <TableHead className="text-slate-400">Type</TableHead>
                <TableHead className="text-slate-400">RAM</TableHead>
                <TableHead className="text-slate-400">CPU</TableHead>
                <TableHead className="text-slate-400">Disk</TableHead>
                <TableHead className="text-slate-400">Players</TableHead>
                <TableHead className="text-slate-400">Monthly</TableHead>
                <TableHead className="text-slate-400">Orders</TableHead>
                <TableHead className="text-slate-400">Services</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {plans.length === 0 ? (
                <TableRow className="border-white/5">
                  <TableCell colSpan={10} className="py-12 text-center text-slate-500">
                    <PackageOpen className="mx-auto mb-3 h-10 w-10 text-slate-600" />
                    No plans configured. Run the seed script to create plans.
                  </TableCell>
                </TableRow>
              ) : (
                plans.map((plan) => (
                  <TableRow key={plan.id} className="border-white/5 hover:bg-white/[0.02]">
                    <TableCell>
                      <div>
                        <p className="font-medium text-white">{plan.name}</p>
                        <p className="text-xs text-slate-500">{plan.slug}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
                        {plan.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-300">{formatMb(plan.ramMb)}</TableCell>
                    <TableCell className="text-slate-300">{plan.cpuPercent}%</TableCell>
                    <TableCell className="text-slate-300">{formatMb(plan.diskMb)}</TableCell>
                    <TableCell className="text-slate-300">{plan.playerSlots}</TableCell>
                    <TableCell className="font-medium text-white">{formatCents(plan.priceMonthly)}</TableCell>
                    <TableCell className="text-slate-400">{plan._count.orders}</TableCell>
                    <TableCell className="text-slate-400">{plan._count.services}</TableCell>
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
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Features detail */}
      {plans.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          {plans.filter((p) => p.isActive).map((plan) => (
            <Card key={plan.id} className="border-white/5 bg-white/[0.02]">
              <CardHeader className="p-5 pb-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold text-white">{plan.name}</h3>
                  <span className="text-lg font-bold text-white">{formatCents(plan.priceMonthly)}/mo</span>
                </div>
                {plan.description && (
                  <p className="mt-1 text-xs text-slate-500">{plan.description}</p>
                )}
              </CardHeader>
              <CardContent className="border-t border-white/5 p-5 pt-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500">RAM</span>
                    <p className="font-medium text-white">{formatMb(plan.ramMb)}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Disk</span>
                    <p className="font-medium text-white">{formatMb(plan.diskMb)}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">CPU</span>
                    <p className="font-medium text-white">{plan.cpuPercent}%</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Players</span>
                    <p className="font-medium text-white">{plan.playerSlots}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Backups</span>
                    <p className="font-medium text-white">{plan.backupSlots}</p>
                  </div>
                  <div>
                    <span className="text-slate-500">Databases</span>
                    <p className="font-medium text-white">{plan.databaseLimit}</p>
                  </div>
                </div>
                {plan.features.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {plan.features.map((f) => (
                      <Badge key={f} variant="outline" className="border-white/10 text-xs text-slate-400">
                        {f}
                      </Badge>
                    ))}
                  </div>
                )}
                <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
                  <span>{plan._count.services} active services</span>
                  <span>{plan._count.orders} orders</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
