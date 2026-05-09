import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const mockLogs = [
  { id: "1", serviceId: "srv_abc123", action: "CREATE", status: "COMPLETED", attempt: 1, duration: "12s", createdAt: "May 9, 2026 12:34 PM", error: null },
  { id: "2", serviceId: "srv_def456", action: "SUSPEND", status: "COMPLETED", attempt: 1, duration: "3s", createdAt: "May 9, 2026 11:20 AM", error: null },
  { id: "3", serviceId: "srv_ghi789", action: "CREATE", status: "FAILED", attempt: 3, duration: "45s", createdAt: "May 9, 2026 10:15 AM", error: "No available allocations on node-3" },
  { id: "4", serviceId: "srv_jkl012", action: "UNSUSPEND", status: "COMPLETED", attempt: 1, duration: "4s", createdAt: "May 8, 2026 03:45 PM", error: null },
  { id: "5", serviceId: "srv_mno345", action: "DELETE", status: "COMPLETED", attempt: 1, duration: "8s", createdAt: "May 8, 2026 02:10 PM", error: null },
  { id: "6", serviceId: "srv_pqr678", action: "CREATE", status: "PROCESSING", attempt: 1, duration: "—", createdAt: "May 9, 2026 12:40 PM", error: null },
];

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

export default function AdminProvisioningPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Provisioning Logs</h1>
          <p className="mt-1 text-sm text-slate-400">
            Monitor server provisioning jobs and troubleshoot failures
          </p>
        </div>
        <Button variant="outline" className="border-white/10 text-slate-300">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Total Jobs", value: "1,847", color: "text-white" },
          { label: "Completed", value: "1,792", color: "text-green-400" },
          { label: "Failed", value: "43", color: "text-red-400" },
          { label: "Processing", value: "12", color: "text-blue-400" },
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
                <TableHead className="text-slate-400">Action</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Attempt</TableHead>
                <TableHead className="text-slate-400">Duration</TableHead>
                <TableHead className="text-slate-400">Time</TableHead>
                <TableHead className="text-slate-400">Error</TableHead>
                <TableHead className="text-right text-slate-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockLogs.map((log) => {
                const status = statusConfig[log.status] ?? statusConfig.QUEUED;
                return (
                  <TableRow key={log.id} className="border-white/5 hover:bg-white/[0.02]">
                    <TableCell className="font-mono text-xs text-slate-300">
                      {log.serviceId}
                    </TableCell>
                    <TableCell className={`font-medium ${actionColors[log.action] ?? "text-white"}`}>
                      {log.action}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={status.className}>
                        {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-400">{log.attempt}/3</TableCell>
                    <TableCell className="text-slate-400">{log.duration}</TableCell>
                    <TableCell className="text-slate-500 text-xs">{log.createdAt}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-xs text-red-400">
                      {log.error ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      {log.status === "FAILED" && (
                        <Button size="sm" variant="outline" className="border-white/10 text-slate-300 text-xs">
                          <RefreshCw className="mr-1 h-3 w-3" />
                          Retry
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
