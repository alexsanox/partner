import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Server,
  Cpu,
  HardDrive,
  Users,
  Plus,
  ArrowUpRight,
} from "lucide-react";
import Link from "next/link";

const stats = [
  {
    label: "Active Servers",
    value: "3",
    icon: Server,
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    label: "Total RAM",
    value: "16 GB",
    icon: Cpu,
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
  {
    label: "Storage Used",
    value: "45 GB",
    icon: HardDrive,
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
  },
  {
    label: "Total Players",
    value: "128",
    icon: Users,
    color: "text-green-400",
    bg: "bg-green-400/10",
  },
];

const mockServers = [
  {
    id: "1",
    name: "Survival SMP",
    game: "Minecraft",
    status: "ACTIVE" as const,
    ram: "4 GB",
    players: "12/25",
    ip: "play.example.com:25565",
  },
  {
    id: "2",
    name: "Creative Build",
    game: "Minecraft",
    status: "ACTIVE" as const,
    ram: "8 GB",
    players: "3/50",
    ip: "play.example.com:25566",
  },
  {
    id: "3",
    name: "Modded Fabric",
    game: "Minecraft",
    status: "SUSPENDED" as const,
    ram: "4 GB",
    players: "0/25",
    ip: "play.example.com:25567",
  },
];

const statusConfig: Record<string, { label: string; className: string }> = {
  ACTIVE: {
    label: "Online",
    className: "bg-green-500/10 text-green-400 border-green-500/20",
  },
  SUSPENDED: {
    label: "Suspended",
    className: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  },
  PROVISIONING: {
    label: "Provisioning",
    className: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  },
  FAILED: {
    label: "Failed",
    className: "bg-red-500/10 text-red-400 border-red-500/20",
  },
  PENDING: {
    label: "Pending",
    className: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  },
};

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">
            Welcome back! Here&apos;s an overview of your servers.
          </p>
        </div>
        <Link href="/#pricing">
          <Button className="bg-blue-600 text-white hover:bg-blue-500">
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
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.bg}`}
              >
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
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white"
            >
              View All
              <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </Link>
        </CardHeader>
        <CardContent className="p-5">
          <div className="space-y-3">
            {mockServers.map((server) => {
              const status =
                statusConfig[server.status] ?? statusConfig.PENDING;
              return (
                <Link
                  key={server.id}
                  href={`/dashboard/services/${server.id}`}
                  className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] p-4 transition-colors hover:border-white/10 hover:bg-white/[0.04]"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                      <Server className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">
                        {server.name}
                      </p>
                      <p className="text-xs text-slate-500">{server.ip}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="hidden text-right sm:block">
                      <p className="text-xs text-slate-500">Players</p>
                      <p className="text-sm font-medium text-white">
                        {server.players}
                      </p>
                    </div>
                    <div className="hidden text-right sm:block">
                      <p className="text-xs text-slate-500">RAM</p>
                      <p className="text-sm font-medium text-white">
                        {server.ram}
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={status.className}
                    >
                      {status.label}
                    </Badge>
                  </div>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
