import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HardDrive, Plus, MemoryStick, Database as DatabaseIcon } from "lucide-react";
import { getNodes, type PelicanNode } from "@/lib/pelican";

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

function formatMb(mb: number): string {
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`;
}

export default async function AdminNodesPage() {
  let nodes: PelicanNode[] = [];
  try {
    const res = await getNodes();
    nodes = res.data.map((n: { attributes: PelicanNode }) => n.attributes);
  } catch {
    // Pelican unreachable
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Node Management</h1>
          <p className="mt-1 text-sm text-slate-400">
            Monitor and manage game server nodes ({nodes.length} total)
          </p>
        </div>
        <Button className="bg-blue-600 text-white hover:bg-blue-500">
          <Plus className="mr-2 h-4 w-4" />
          Add Node
        </Button>
      </div>

      {nodes.length === 0 ? (
        <Card className="border-white/5 bg-white/[0.02]">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <HardDrive className="mb-4 h-12 w-12 text-slate-600" />
            <p className="text-lg font-medium text-slate-400">No nodes found</p>
            <p className="mt-1 text-sm text-slate-500">
              Add a node in your Pelican panel to get started
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          {nodes.map((node: PelicanNode) => {
            const isUp = !node.maintenance_mode;
            const statusCfg = isUp
              ? { label: "Active", className: "bg-green-500/10 text-green-400 border-green-500/20" }
              : { label: "Maintenance", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" };

            return (
              <Card key={node.id} className="border-white/5 bg-white/[0.02]">
                <CardHeader className="flex flex-row items-center justify-between p-5 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
                      <HardDrive className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{node.name}</p>
                      <p className="text-xs text-slate-500">{node.fqdn}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={statusCfg.className}>
                    {statusCfg.label}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4 border-t border-white/5 p-5 pt-4">
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-slate-400">
                        <MemoryStick className="h-3 w-3" /> RAM
                      </span>
                      <span className="text-slate-500">{formatMb(node.memory)}</span>
                    </div>
                    <ProgressBar used={0} total={node.memory} color="bg-blue-500" />
                  </div>
                  <div>
                    <div className="mb-1 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-slate-400">
                        <DatabaseIcon className="h-3 w-3" /> Disk
                      </span>
                      <span className="text-slate-500">{formatMb(node.disk)}</span>
                    </div>
                    <ProgressBar used={0} total={node.disk} color="bg-purple-500" />
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Servers</span>
                    <span className="font-medium text-white">{node.servers_count ?? 0}</span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
