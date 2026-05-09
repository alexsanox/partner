import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/db";
import { ServiceActions } from "@/components/admin/service-actions";

const dbStatusConfig: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: "Active", className: "bg-green-500/10 text-green-400 border-green-500/20" },
  PENDING: { label: "Pending", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  PROVISIONING: { label: "Provisioning", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  SUSPENDED: { label: "Suspended", className: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  CANCELLED: { label: "Cancelled", className: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  FAILED: { label: "Failed", className: "bg-red-500/10 text-red-400 border-red-500/20" },
};

async function getServiceStats() {
  const [total, active, pending, suspended, failed] = await Promise.all([
    prisma.service.count(),
    prisma.service.count({ where: { status: "ACTIVE" } }),
    prisma.service.count({ where: { status: { in: ["PENDING", "PROVISIONING"] } } }),
    prisma.service.count({ where: { status: "SUSPENDED" } }),
    prisma.service.count({ where: { status: "FAILED" } }),
  ]);
  return { total, active, pending, suspended, failed };
}

async function getServices() {
  return prisma.service.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      user: { select: { name: true, email: true } },
      plan: { select: { name: true, ramMb: true } },
      node: { select: { name: true } },
    },
  });
}

export default async function AdminServicesPage() {
  const [stats, services] = await Promise.all([getServiceStats(), getServices()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Service Management</h1>
        <p className="mt-1 text-sm text-slate-400">
          View and manage all provisioned services ({stats.total} total)
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-5">
        {[
          { label: "Total", value: stats.total, color: "text-white" },
          { label: "Active", value: stats.active, color: "text-green-400" },
          { label: "Pending", value: stats.pending, color: "text-yellow-400" },
          { label: "Suspended", value: stats.suspended, color: "text-orange-400" },
          { label: "Failed", value: stats.failed, color: "text-red-400" },
        ].map((s) => (
          <Card key={s.label} className="border-white/5 bg-white/[0.02]">
            <CardContent className="p-5">
              <p className="text-sm text-slate-400">{s.label}</p>
              <p className={`mt-1 text-2xl font-bold ${s.color}`}>{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-white/5 bg-white/[0.02]">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-slate-400">Service</TableHead>
                <TableHead className="text-slate-400">User</TableHead>
                <TableHead className="text-slate-400">Plan</TableHead>
                <TableHead className="text-slate-400">Node</TableHead>
                <TableHead className="text-slate-400">IP</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Created</TableHead>
                <TableHead className="text-right text-slate-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {services.length === 0 ? (
                <TableRow className="border-white/5">
                  <TableCell colSpan={8} className="py-12 text-center text-slate-500">
                    <Server className="mx-auto mb-3 h-10 w-10 text-slate-600" />
                    No services yet. Users can create servers from the dashboard.
                  </TableCell>
                </TableRow>
              ) : (
                services.map((svc) => {
                  const statusCfg = dbStatusConfig[svc.status] ?? dbStatusConfig.PENDING;
                  return (
                    <TableRow key={svc.id} className="border-white/5 hover:bg-white/[0.02]">
                      <TableCell>
                        <div>
                          <p className="font-medium text-white">{svc.name}</p>
                          <p className="font-mono text-xs text-slate-600">{svc.id.slice(0, 10)}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-sm text-white">{svc.user.name}</p>
                          <p className="text-xs text-slate-500">{svc.user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-white">{svc.plan.name}</span>
                        <span className="ml-1 text-xs text-slate-500">
                          ({svc.plan.ramMb >= 1024 ? `${(svc.plan.ramMb / 1024).toFixed(0)} GB` : `${svc.plan.ramMb} MB`})
                        </span>
                      </TableCell>
                      <TableCell className="text-xs text-slate-400">
                        {svc.node?.name ?? "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-400">
                        {svc.ipAddress ? `${svc.ipAddress}:${svc.port}` : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusCfg.className}>
                          {statusCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {svc.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </TableCell>
                      <TableCell className="text-right">
                        <ServiceActions
                          serviceId={svc.id}
                          serviceName={svc.name}
                          currentStatus={svc.status}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
