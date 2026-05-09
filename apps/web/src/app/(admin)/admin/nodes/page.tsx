import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HardDrive, Plus, Cpu, Database } from "lucide-react";

const mockNodes = [
  {
    id: "1",
    name: "node-us-east-1",
    location: "New York, US",
    status: "ACTIVE",
    memory: { used: 48, total: 64, unit: "GB" },
    disk: { used: 320, total: 500, unit: "GB" },
    cpu: { used: 65, total: 100, unit: "%" },
    servers: 24,
  },
  {
    id: "2",
    name: "node-eu-west-1",
    location: "Amsterdam, NL",
    status: "ACTIVE",
    memory: { used: 32, total: 64, unit: "GB" },
    disk: { used: 210, total: 500, unit: "GB" },
    cpu: { used: 45, total: 100, unit: "%" },
    servers: 18,
  },
  {
    id: "3",
    name: "node-us-west-1",
    location: "Los Angeles, US",
    status: "MAINTENANCE",
    memory: { used: 0, total: 64, unit: "GB" },
    disk: { used: 0, total: 500, unit: "GB" },
    cpu: { used: 0, total: 100, unit: "%" },
    servers: 0,
  },
];

const nodeStatusConfig: Record<string, { label: string; className: string }> = {
  ACTIVE: { label: "Active", className: "bg-green-500/10 text-green-400 border-green-500/20" },
  MAINTENANCE: { label: "Maintenance", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  OFFLINE: { label: "Offline", className: "bg-red-500/10 text-red-400 border-red-500/20" },
};

function ProgressBar({ used, total, color }: { used: number; total: number; color: string }) {
  const pct = total > 0 ? Math.round((used / total) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="h-1.5 flex-1 rounded-full bg-white/5">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-slate-400">{pct}%</span>
    </div>
  );
}

export default function AdminNodesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Node Management</h1>
          <p className="mt-1 text-sm text-slate-400">
            Monitor and manage game server nodes
          </p>
        </div>
        <Button className="bg-blue-600 text-white hover:bg-blue-500">
          <Plus className="mr-2 h-4 w-4" />
          Add Node
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {mockNodes.map((node) => {
          const status = nodeStatusConfig[node.status] ?? nodeStatusConfig.ACTIVE;
          return (
            <Card key={node.id} className="border-white/5 bg-white/[0.02]">
              <CardHeader className="flex flex-row items-center justify-between p-5 pb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
                    <HardDrive className="h-5 w-5 text-cyan-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">{node.name}</p>
                    <p className="text-xs text-slate-500">{node.location}</p>
                  </div>
                </div>
                <Badge variant="outline" className={status.className}>
                  {status.label}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4 border-t border-white/5 p-5 pt-4">
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Cpu className="h-3 w-3" /> RAM
                    </span>
                    <span className="text-slate-500">
                      {node.memory.used}/{node.memory.total} {node.memory.unit}
                    </span>
                  </div>
                  <ProgressBar used={node.memory.used} total={node.memory.total} color="bg-blue-500" />
                </div>
                <div>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-slate-400">
                      <Database className="h-3 w-3" /> Disk
                    </span>
                    <span className="text-slate-500">
                      {node.disk.used}/{node.disk.total} {node.disk.unit}
                    </span>
                  </div>
                  <ProgressBar used={node.disk.used} total={node.disk.total} color="bg-purple-500" />
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Active Servers</span>
                  <span className="font-medium text-white">{node.servers}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
