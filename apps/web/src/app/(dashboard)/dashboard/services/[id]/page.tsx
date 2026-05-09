import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Server,
  MemoryStick,
  HardDrive,
  Cpu,
  ArrowLeft,
  Play,
  Square,
  RotateCcw,
  Terminal,
  Globe,
} from "lucide-react";
import Link from "next/link";
import { getServers, type PelicanServer } from "@/lib/pelican";
import { notFound } from "next/navigation";

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

export default async function ServerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let server: PelicanServer | null = null;
  try {
    const res = await getServers();
    const match = res.data.find(
      (s: { attributes: PelicanServer }) => s.attributes.identifier === id
    );
    if (match) server = match.attributes;
  } catch {
    // Pelican unreachable
  }

  if (!server) {
    notFound();
  }

  const statusKey = server.suspended ? "suspended" : (server.status ?? "offline");
  const status = statusConfig[statusKey] ?? defaultStatus;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/services">
          <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{server.name}</h1>
            <Badge variant="outline" className={status.className}>
              {status.label}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            {server.identifier} &middot; {server.description || "No description"}
          </p>
        </div>
      </div>

      {/* Power Controls */}
      <Card className="border-white/5 bg-white/[0.02]">
        <CardContent className="flex items-center gap-3 p-5">
          <a
            href={`${process.env.PELICAN_URL}/server/${server.identifier}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="bg-blue-600 text-white hover:bg-blue-500">
              <Terminal className="mr-2 h-4 w-4" />
              Open Console
            </Button>
          </a>
          <a
            href={`${process.env.PELICAN_URL}/server/${server.identifier}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="border-white/10 text-slate-300 hover:text-white">
              <Globe className="mr-2 h-4 w-4" />
              Manage on Panel
            </Button>
          </a>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="icon" className="border-green-500/20 text-green-400 hover:bg-green-500/10">
              <Play className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="border-yellow-500/20 text-yellow-400 hover:bg-yellow-500/10">
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="border-red-500/20 text-red-400 hover:bg-red-500/10">
              <Square className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resource Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-white/5 bg-white/[0.02]">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <MemoryStick className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Memory</p>
                <p className="text-lg font-bold text-white">{formatMemory(server.limits.memory)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/5 bg-white/[0.02]">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-500/10">
                <HardDrive className="h-5 w-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Disk</p>
                <p className="text-lg font-bold text-white">{formatMemory(server.limits.disk)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/5 bg-white/[0.02]">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <Cpu className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">CPU Limit</p>
                <p className="text-lg font-bold text-white">{server.limits.cpu}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-white/5 bg-white/[0.02]">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Server className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-xs text-slate-500">Node</p>
                <p className="text-lg font-bold text-white">#{server.node_id}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Server Info */}
      <Card className="border-white/5 bg-white/[0.02]">
        <CardHeader className="p-5 pb-0">
          <h2 className="text-lg font-semibold text-white">Server Details</h2>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500">Server UUID</p>
                <p className="font-mono text-sm text-white">{server.uuid}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Docker Image</p>
                <p className="font-mono text-sm text-white">{server.container.image}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Startup Command</p>
                <p className="font-mono text-sm text-white break-all">{server.container.startup_command}</p>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-slate-500">Created</p>
                <p className="text-sm text-white">{new Date(server.created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Last Updated</p>
                <p className="text-sm text-white">{new Date(server.updated_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Swap</p>
                <p className="text-sm text-white">{server.limits.swap} MB</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
