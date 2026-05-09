import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/db";

const statusConfig: Record<string, { label: string; className: string }> = {
  QUEUED: { label: "Queued", className: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  PROCESSING: { label: "Processing", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  COMPLETED: { label: "Completed", className: "bg-green-500/10 text-green-400 border-green-500/20" },
  FAILED: { label: "Failed", className: "bg-red-500/10 text-red-400 border-red-500/20" },
};

const actionColors: Record<string, string> = {
  CREATE: "text-green-400",
  SUSPEND: "text-orange-400",
  UNSUSPEND: "text-blue-400",
  DELETE: "text-red-400",
  RETRY: "text-yellow-400",
};

async function getProvisioningStats() {
  const [total, completed, failed, processing] = await Promise.all([
    prisma.provisioningLog.count(),
    prisma.provisioningLog.count({ where: { status: "COMPLETED" } }),
    prisma.provisioningLog.count({ where: { status: "FAILED" } }),
    prisma.provisioningLog.count({ where: { status: "PROCESSING" } }),
  ]);
  return { total, completed, failed, processing };
}

async function getRecentLogs() {
  return prisma.provisioningLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 30,
    include: {
      service: { select: { name: true, user: { select: { email: true } } } },
    },
  });
}

function formatDuration(start: Date | null, end: Date | null): string {
  if (!start || !end) return "—";
  const ms = end.getTime() - start.getTime();
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
}

export default async function AdminProvisioningPage() {
  const [stats, logs] = await Promise.all([getProvisioningStats(), getRecentLogs()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Provisioning Logs</h1>
        <p className="mt-1 text-sm text-slate-400">
          Monitor server provisioning jobs and troubleshoot failures
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Total Jobs", value: stats.total, color: "text-white" },
          { label: "Completed", value: stats.completed, color: "text-green-400" },
          { label: "Failed", value: stats.failed, color: "text-red-400" },
          { label: "Processing", value: stats.processing, color: "text-blue-400" },
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
                <TableHead className="text-slate-400">Action</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Attempt</TableHead>
                <TableHead className="text-slate-400">Duration</TableHead>
                <TableHead className="text-slate-400">Time</TableHead>
                <TableHead className="text-slate-400">Error</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow className="border-white/5">
                  <TableCell colSpan={8} className="py-12 text-center text-slate-500">
                    <Activity className="mx-auto mb-3 h-10 w-10 text-slate-600" />
                    No provisioning logs yet
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => {
                  const statusCfg = statusConfig[log.status] ?? statusConfig.QUEUED;
                  return (
                    <TableRow key={log.id} className="border-white/5 hover:bg-white/[0.02]">
                      <TableCell className="text-sm text-white">
                        {log.service.name}
                      </TableCell>
                      <TableCell className="text-xs text-slate-400">
                        {log.service.user.email}
                      </TableCell>
                      <TableCell className={`font-medium ${actionColors[log.action] ?? "text-white"}`}>
                        {log.action}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusCfg.className}>
                          {statusCfg.label}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-400">{log.attempt}/{log.maxRetries}</TableCell>
                      <TableCell className="text-slate-400">{formatDuration(log.startedAt, log.completedAt)}</TableCell>
                      <TableCell className="text-xs text-slate-500">
                        {log.createdAt.toLocaleString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-red-400">
                        {log.error ?? "—"}
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
