import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Server, Plus, Search, Filter } from "lucide-react";
import Link from "next/link";

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
};

const mockServers = [
  {
    id: "1",
    name: "Survival SMP",
    game: "Minecraft",
    status: "ACTIVE",
    ram: "4 GB",
    players: "12/25",
    ip: "play.example.com:25565",
    plan: "Essential",
  },
  {
    id: "2",
    name: "Creative Build",
    game: "Minecraft",
    status: "ACTIVE",
    ram: "8 GB",
    players: "3/50",
    ip: "play.example.com:25566",
    plan: "Pro",
  },
  {
    id: "3",
    name: "Modded Fabric",
    game: "Minecraft",
    status: "SUSPENDED",
    ram: "4 GB",
    players: "0/25",
    ip: "play.example.com:25567",
    plan: "Essential",
  },
];

export default function ServicesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Servers</h1>
          <p className="mt-1 text-sm text-slate-400">
            Manage all your Minecraft servers
          </p>
        </div>
        <Link href="/#pricing">
          <Button className="bg-blue-600 text-white hover:bg-blue-500">
            <Plus className="mr-2 h-4 w-4" />
            New Server
          </Button>
        </Link>
      </div>

      {/* Search/Filter bar */}
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder="Search servers..."
            className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-slate-500"
          />
        </div>
        <Button variant="outline" className="border-white/10 text-slate-400">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
      </div>

      {/* Server Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {mockServers.map((server) => {
          const status = statusConfig[server.status] ?? statusConfig.ACTIVE;
          return (
            <Link key={server.id} href={`/dashboard/services/${server.id}`}>
              <Card className="border-white/5 bg-white/[0.02] transition-all hover:border-white/10 hover:bg-white/[0.04]">
                <CardHeader className="flex flex-row items-center justify-between p-5 pb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                      <Server className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">
                        {server.name}
                      </p>
                      <p className="text-xs text-slate-500">{server.ip}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className={status.className}>
                    {status.label}
                  </Badge>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4 border-t border-white/5 p-5 pt-4">
                  <div>
                    <p className="text-xs text-slate-500">Players</p>
                    <p className="text-sm font-medium text-white">
                      {server.players}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Memory</p>
                    <p className="text-sm font-medium text-white">
                      {server.ram}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Plan</p>
                    <p className="text-sm font-medium text-white">
                      {server.plan}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <p className="text-center text-sm text-slate-500">
        Showing {mockServers.length} servers
      </p>
    </div>
  );
}
