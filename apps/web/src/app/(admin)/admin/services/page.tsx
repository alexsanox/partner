import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MoreHorizontal } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const mockServices = [
  { id: "srv_abc123", name: "Survival SMP", user: "alex@example.com", plan: "Pro", ram: "8 GB", status: "ACTIVE", node: "node-us-east-1", created: "Jan 20, 2026" },
  { id: "srv_def456", name: "Creative Build", user: "sarah@example.com", plan: "Essential", ram: "4 GB", status: "ACTIVE", node: "node-eu-west-1", created: "Feb 15, 2026" },
  { id: "srv_ghi789", name: "Modded Fabric", user: "mike@example.com", plan: "Enterprise", ram: "16 GB", status: "SUSPENDED", node: "node-us-east-1", created: "Mar 1, 2026" },
  { id: "srv_jkl012", name: "Vanilla Server", user: "emma@example.com", plan: "Starter", ram: "2 GB", status: "FAILED", node: "node-us-west-1", created: "Apr 5, 2026" },
  { id: "srv_mno345", name: "Pixelmon", user: "david@example.com", plan: "Pro", ram: "8 GB", status: "PROVISIONING", node: "node-eu-west-1", created: "May 9, 2026" },
];

const statusConfig: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: "Active", className: "bg-green-500/10 text-green-400 border-green-500/20" },
  SUSPENDED: { label: "Suspended", className: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  PROVISIONING: { label: "Provisioning", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  FAILED: { label: "Failed", className: "bg-red-500/10 text-red-400 border-red-500/20" },
  PENDING: { label: "Pending", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  CANCELLED: { label: "Cancelled", className: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
};

export default function AdminServicesPage() {
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
              {mockServices.map((svc) => {
                const status = statusConfig[svc.status] ?? statusConfig.PENDING;
                return (
                  <TableRow key={svc.id} className="border-white/5 hover:bg-white/[0.02]">
                    <TableCell>
                      <div>
                        <p className="font-medium text-white">{svc.name}</p>
                        <p className="font-mono text-xs text-slate-500">{svc.id}</p>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-400">{svc.user}</TableCell>
                    <TableCell>
                      <span className="text-sm text-white">{svc.plan}</span>
                      <span className="ml-1 text-xs text-slate-500">{svc.ram}</span>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-slate-400">{svc.node}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className={status.className}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 text-xs">{svc.created}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
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
