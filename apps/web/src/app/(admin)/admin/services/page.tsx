import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MoreHorizontal, Server } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getServers, type PelicanServer } from "@/lib/pelican";

const statusConfig: Record<string, { label: string; className: string }> = {
  running: { label: "Running", className: "bg-green-500/10 text-green-400 border-green-500/20" },
  suspended: { label: "Suspended", className: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  installing: { label: "Installing", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  offline: { label: "Offline", className: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
};

const defaultStatus = { label: "Unknown", className: "bg-slate-500/10 text-slate-400 border-slate-500/20" };

export default async function AdminServicesPage() {
  let servers: PelicanServer[] = [];
  try {
    const res = await getServers();
    servers = res.data.map((s: { attributes: PelicanServer }) => s.attributes);
  } catch {
    // Pelican unreachable
  }
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Service Management</h1>
        <p className="mt-1 text-sm text-slate-400">
          View and manage all provisioned services
        </p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder="Search by name, ID, or user..."
            className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-slate-500"
          />
        </div>
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
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Created</TableHead>
                <TableHead className="text-right text-slate-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {servers.length === 0 ? (
                <TableRow className="border-white/5">
                  <TableCell colSpan={7} className="text-center text-slate-500 py-12">
                    <Server className="mx-auto mb-3 h-10 w-10 text-slate-600" />
                    No servers found. Create one from the Pelican panel.
                  </TableCell>
                </TableRow>
              ) : (
                servers.map((svc: PelicanServer) => {
                  const status = statusConfig[svc.status ?? "offline"] ?? defaultStatus;
                  return (
                    <TableRow key={svc.id} className="border-white/5 hover:bg-white/[0.02]">
                      <TableCell>
                        <div>
                          <p className="font-medium text-white">{svc.name}</p>
                          <p className="font-mono text-xs text-slate-500">{svc.uuid.slice(0, 8)}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-400">User #{svc.user_id}</TableCell>
                      <TableCell>
                        <span className="text-sm text-white">{svc.limits.memory} MB</span>
                        <span className="ml-1 text-xs text-slate-500">RAM</span>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-slate-400">Node #{svc.node_id}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={status.className}>{status.label}</Badge>
                      </TableCell>
                      <TableCell className="text-slate-500 text-xs">{new Date(svc.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
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
