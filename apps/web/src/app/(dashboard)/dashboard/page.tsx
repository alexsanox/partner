import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Server,
  Cpu,
  HardDrive,
  MemoryStick,
  Plus,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";
import { getServers, type PelicanServer } from "@/lib/pelican";
import { requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

const statusConfig: Record<string, { label: string; className: string }> = {
  online: { label: "Online", className: "bg-green-500/10 text-green-400 border-green-500/20" },
  offline: { label: "Offline", className: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  suspended: { label: "Suspended", className: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  installing: { label: "Installing", className: "bg-[#00b07d]/10 text-[#00c98d] border-[#00c98d]/20" },
};

const defaultStatus = { label: "Unknown", className: "bg-slate-500/10 text-slate-400 border-slate-500/20" };

function formatMemory(mb: number): string {
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`;
}

export default async function DashboardPage() {
  const session = await requireAuth();
  let servers: PelicanServer[] = [];

  try {
    const userServices = await prisma.service.findMany({
      where: { userId: session.user.id, deletedAt: null, externalServerId: { not: null } },
      select: { externalServerId: true },
    });
    const userServerIds = new Set(userServices.map((s: { externalServerId: string | null }) => String(s.externalServerId)));
    const res = await getServers();
    const all = res.data.map((s: { attributes: PelicanServer }) => s.attributes);
    servers = all.filter((s: PelicanServer) => userServerIds.has(s.identifier));
  } catch {
    // Pelican unreachable
  }

  const totalRam = servers.reduce((sum: number, s: PelicanServer) => sum + s.limits.memory, 0);
  const totalDisk = servers.reduce((sum: number, s: PelicanServer) => sum + s.limits.disk, 0);

  const stats = [
    { label: "Active Servers", value: servers.length.toString(), icon: Server, color: "text-[#00c98d]", bg: "bg-blue-400/10" },
    { label: "Total RAM", value: formatMemory(totalRam), icon: MemoryStick, color: "text-purple-400", bg: "bg-purple-400/10" },
    { label: "Total Disk", value: formatMemory(totalDisk), icon: HardDrive, color: "text-cyan-400", bg: "bg-cyan-400/10" },
    { label: "CPU Limit", value: `${servers.reduce((sum: number, s: PelicanServer) => sum + s.limits.cpu, 0)}%`, icon: Cpu, color: "text-green-400", bg: "bg-green-400/10" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">
            Welcome back, {session.user.name}! Here&apos;s an overview of your servers.
          </p>
        </div>
        <Link href="/dashboard/services/create">
          <Button className="w-full sm:w-auto bg-[#00c98d] text-white hover:bg-[#00e0a0]">
            <Plus className="mr-2 h-4 w-4" />
            New Server
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="border-white/5 bg-white/[0.02]">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg}`}>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-slate-400">{stat.label}</p>
                <p className="text-xl font-bold text-white">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Servers */}
      <Card className="border-white/5 bg-white/[0.02]">
        <CardHeader className="flex flex-row items-center justify-between p-5 pb-0">
          <h2 className="text-lg font-semibold text-white">My Servers</h2>
          <Link href="/dashboard/services">
            <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
              View All
              <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-5">
          {servers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Server className="mb-4 h-12 w-12 text-slate-600" />
              <p className="text-lg font-medium text-slate-400">No servers yet</p>
              <p className="mt-1 text-sm text-slate-500">Create your first server to get started</p>
              <Link href="/dashboard/services/create" className="mt-4">
                <Button className="bg-[#00c98d] text-white hover:bg-[#00e0a0]">
                  <Plus className="mr-2 h-4 w-4" />
                  Create Server
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {servers.map((server: PelicanServer) => {
                const statusKey = server.suspended ? "suspended" : (server.status ?? "offline");
                const status = statusConfig[statusKey] ?? defaultStatus;
                return (
                  <Link
                    key={server.id}
                    href={`/dashboard/services/${server.identifier}`}
                    className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-4 transition-colors hover:border-white/10 hover:bg-white/[0.04]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#00b07d]/10">
                        <Server className="h-5 w-5 text-[#00c98d]" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{server.name}</p>
                        <p className="text-xs text-slate-500">{server.identifier}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="hidden text-right sm:block">
                        <p className="text-xs text-slate-500">RAM</p>
                        <p className="text-sm font-medium text-white">{formatMemory(server.limits.memory)}</p>
                      </div>
                      <div className="hidden text-right sm:block">
                        <p className="text-xs text-slate-500">Disk</p>
                        <p className="text-sm font-medium text-white">{formatMemory(server.limits.disk)}</p>
                      </div>
                      <Badge variant="outline" className={status.className}>
                        {status.label}
                      </Badge>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
