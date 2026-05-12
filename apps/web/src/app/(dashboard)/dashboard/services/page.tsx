import { Suspense } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Server, Plus } from "lucide-react";
import Link from "next/link";
import { getServers, type PelicanServer } from "@/lib/pelican";
import { CheckoutSuccessBanner } from "@/components/checkout-success-banner";
import { requireAuth } from "@/lib/auth-server";
import { prisma } from "@/lib/db";

const statusConfig: Record<string, { label: string; className: string }> = {
  online: { label: "Online", className: "bg-green-500/10 text-green-400 border-green-500/20" },
  offline: { label: "Offline", className: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  suspended: { label: "Suspended", className: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  installing: { label: "Installing", className: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
};

const defaultStatus = { label: "Unknown", className: "bg-slate-500/10 text-slate-400 border-slate-500/20" };

function formatMemory(mb: number): string {
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`;
}

export default async function ServicesPage() {
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
    servers = all.filter((s: PelicanServer) => userServerIds.has(String(s.id)));
  } catch {
    // Pelican unreachable
  }

  return (
    <div className="space-y-6">
      <Suspense>
        <CheckoutSuccessBanner />
      </Suspense>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Servers</h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage all your game servers ({servers.length})
          </p>
        </div>
        <Link href="/dashboard/services/create">
          <Button className="bg-blue-600 text-white hover:bg-blue-500">
            <Plus className="mr-2 h-4 w-4" />
            New Server
          </Button>
        </Link>
      </div>

      {servers.length === 0 ? (
        <Card className="border-white/5 bg-white/[0.02]">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Server className="mb-4 h-12 w-12 text-slate-600" />
            <p className="text-lg font-medium text-slate-400">No servers yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Create your first server to get started
            </p>
            <Link href="/dashboard/services/create" className="mt-4">
              <Button className="bg-blue-600 text-white hover:bg-blue-500">
                <Plus className="mr-2 h-4 w-4" />
                Create Server
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {servers.map((server: PelicanServer) => {
            const statusKey = server.suspended ? "suspended" : (server.status ?? "offline");
            const status = statusConfig[statusKey] ?? defaultStatus;
            return (
              <Link key={server.id} href={`/dashboard/services/${server.identifier}`}>
                <Card className="border-white/5 bg-white/[0.02] transition-all hover:border-white/10 hover:bg-white/[0.04]">
                  <CardHeader className="flex flex-row items-center justify-between p-5 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                        <Server className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-white">{server.name}</p>
                        <p className="text-xs text-slate-500">{server.identifier}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className={status.className}>
                      {status.label}
                    </Badge>
                  </CardHeader>
                  <CardContent className="grid grid-cols-3 gap-4 border-t border-white/5 p-5 pt-4">
                    <div>
                      <p className="text-xs text-slate-500">Memory</p>
                      <p className="text-sm font-medium text-white">{formatMemory(server.limits.memory)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Disk</p>
                      <p className="text-sm font-medium text-white">{formatMemory(server.limits.disk)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">CPU</p>
                      <p className="text-sm font-medium text-white">{server.limits.cpu}%</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}

      {servers.length > 0 && (
        <p className="text-center text-sm text-slate-500">
          Showing {servers.length} server{servers.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}
