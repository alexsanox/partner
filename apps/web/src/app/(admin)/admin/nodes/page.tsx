import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HardDrive, MemoryStick, Database as DatabaseIcon, Server, Cpu, Globe } from "lucide-react";
import { getNodes, type PelicanNode } from "@/lib/pelican";

function ProgressBar({ used, total, color }: { used: number; total: number; color: string }) {
  const pct = total > 0 ? Math.min(Math.round((used / total) * 100), 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="h-2 flex-1 rounded-full bg-white/[0.06]">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-10 text-right text-xs font-medium text-slate-400">{pct}%</span>
    </div>
  );
}

function formatMb(mb: number): string {
  if (mb === 0) return "Unlimited";
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`;
}

function formatMbValue(mb: number): string {
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`;
}

interface NodeDisplay {
  id: number;
  name: string;
  fqdn: string;
  maintenance_mode: boolean;
  limitRam: number;
  limitDisk: number;
  limitCpu: number;
  allocatedRam: number;
  allocatedDisk: number;
  allocatedCpu: number;
  serverCount: number;
}

export default async function AdminNodesPage() {
  let nodes: NodeDisplay[] = [];
  let error = false;

  try {
    const nodesRes = await getNodes();
    nodes = nodesRes.data.map((n: { attributes: PelicanNode }): NodeDisplay => {
      const attr = n.attributes;
      const alloc = attr.allocated_resources ?? { memory: 0, disk: 0, cpu: 0 };
      const serverCount = attr.relationships?.servers?.data?.length ?? attr.servers_count ?? 0;
      return {
        id: attr.id,
        name: attr.name,
        fqdn: attr.fqdn,
        maintenance_mode: attr.maintenance_mode,
        limitRam: attr.memory,
        limitDisk: attr.disk,
        limitCpu: attr.cpu,
        allocatedRam: alloc.memory,
        allocatedDisk: alloc.disk,
        allocatedCpu: alloc.cpu,
        serverCount,
      };
    });
  } catch {
    error = true;
  }

  const totalAllocRam = nodes.reduce((s, n) => s + n.allocatedRam, 0);
  const totalAllocDisk = nodes.reduce((s, n) => s + n.allocatedDisk, 0);
  const totalAllocCpu = nodes.reduce((s, n) => s + n.allocatedCpu, 0);
  const totalServers = nodes.reduce((s, n) => s + n.serverCount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Node Management</h1>
        <p className="mt-1 text-sm text-slate-400">
          Monitor and manage game server nodes ({nodes.length} total)
        </p>
      </div>

      {/* Cluster summary */}
      {nodes.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-4">
          {[
            { label: "Nodes", value: nodes.length.toString(), icon: HardDrive, color: "text-cyan-400", bg: "bg-cyan-400/10" },
            { label: "Servers", value: totalServers.toString(), icon: Server, color: "text-blue-400", bg: "bg-blue-400/10" },
            { label: "RAM Allocated", value: formatMbValue(totalAllocRam), icon: MemoryStick, color: "text-purple-400", bg: "bg-purple-400/10" },
            { label: "Disk Allocated", value: formatMbValue(totalAllocDisk), icon: DatabaseIcon, color: "text-green-400", bg: "bg-green-400/10" },
          ].map((s) => (
            <Card key={s.label} className="border-white/5 bg-white/[0.02]">
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.bg}`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div>
                  <p className="text-xs text-[#8b92a8]">{s.label}</p>
                  <p className="text-sm font-bold text-white">{s.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {error ? (
        <Card className="border-white/5 bg-white/[0.02]">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <HardDrive className="mb-4 h-12 w-12 text-slate-600" />
            <p className="text-lg font-medium text-slate-400">Could not connect to Pelican</p>
            <p className="mt-1 text-sm text-slate-500">
              Check your PELICAN_URL and PELICAN_API_KEY in settings
            </p>
          </CardContent>
        </Card>
      ) : nodes.length === 0 ? (
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
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {nodes.map((node) => {
            const isUp = !node.maintenance_mode;
            const statusCfg = isUp
              ? { label: "Online", className: "bg-green-500/10 text-green-400 border-green-500/20" }
              : { label: "Maintenance", className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" };

            const hasRamLimit = node.limitRam > 0;
            const hasDiskLimit = node.limitDisk > 0;

            return (
              <Card key={node.id} className="border-white/5 bg-white/[0.02]">
                <CardHeader className="flex flex-row items-center justify-between p-5 pb-3">
                  <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isUp ? "bg-green-500/10" : "bg-yellow-500/10"}`}>
                      <HardDrive className={`h-5 w-5 ${isUp ? "text-green-400" : "text-yellow-400"}`} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{node.name}</p>
                      <div className="flex items-center gap-1.5 text-xs text-[#8b92a8]">
                        <Globe className="h-3 w-3" />
                        {node.fqdn}
                      </div>
                    </div>
                  </div>
                  <Badge variant="outline" className={statusCfg.className}>
                    {statusCfg.label}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4 border-t border-white/[0.07] p-5 pt-4">
                  {/* RAM */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-[#8b92a8]">
                        <MemoryStick className="h-3.5 w-3.5" /> RAM
                      </span>
                      <span className="font-mono text-white">
                        {formatMbValue(node.allocatedRam)}
                        {hasRamLimit && <span className="text-[#8b92a8]"> / {formatMbValue(node.limitRam)}</span>}
                        {!hasRamLimit && <span className="text-[#8b92a8]"> allocated</span>}
                      </span>
                    </div>
                    {hasRamLimit && (
                      <ProgressBar used={node.allocatedRam} total={node.limitRam} color="bg-[#5b8cff]" />
                    )}
                  </div>
                  {/* Disk */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-[#8b92a8]">
                        <DatabaseIcon className="h-3.5 w-3.5" /> Disk
                      </span>
                      <span className="font-mono text-white">
                        {formatMbValue(node.allocatedDisk)}
                        {hasDiskLimit && <span className="text-[#8b92a8]"> / {formatMbValue(node.limitDisk)}</span>}
                        {!hasDiskLimit && <span className="text-[#8b92a8]"> allocated</span>}
                      </span>
                    </div>
                    {hasDiskLimit && (
                      <ProgressBar used={node.allocatedDisk} total={node.limitDisk} color="bg-purple-500" />
                    )}
                  </div>
                  {/* CPU */}
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-[#8b92a8]">
                        <Cpu className="h-3.5 w-3.5" /> CPU Allocated
                      </span>
                      <span className="font-mono text-white">
                        {node.allocatedCpu}%
                        {node.limitCpu > 0 && <span className="text-[#8b92a8]"> / {node.limitCpu}%</span>}
                      </span>
                    </div>
                    {node.limitCpu > 0 && (
                      <ProgressBar used={node.allocatedCpu} total={node.limitCpu} color="bg-green-500" />
                    )}
                  </div>
                  {/* Servers */}
                  <div className="flex items-center justify-between rounded-lg bg-white/[0.03] px-3 py-2">
                    <span className="flex items-center gap-1.5 text-xs text-[#8b92a8]">
                      <Server className="h-3.5 w-3.5" /> Servers
                    </span>
                    <span className="text-sm font-bold text-white">{node.serverCount}</span>
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
