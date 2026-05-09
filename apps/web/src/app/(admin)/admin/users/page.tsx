import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, ShieldCheck, UserX } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { prisma } from "@/lib/db";

async function getUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { services: true, orders: true } },
    },
  });
  return users;
}

async function getUserStats() {
  const [total, admins, verified, recent] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "ADMIN" } }),
    prisma.user.count({ where: { emailVerified: true } }),
    prisma.user.count({
      where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
    }),
  ]);
  return { total, admins, verified, recent };
}

export default async function AdminUsersPage() {
  const [users, stats] = await Promise.all([getUsers(), getUserStats()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <p className="mt-1 text-sm text-slate-400">
          View and manage all registered users ({stats.total} total)
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-4">
        {[
          { label: "Total Users", value: stats.total, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
          { label: "Admins", value: stats.admins, icon: ShieldCheck, color: "text-red-400", bg: "bg-red-400/10" },
          { label: "Verified", value: stats.verified, icon: Users, color: "text-green-400", bg: "bg-green-400/10" },
          { label: "New (30d)", value: stats.recent, icon: UserX, color: "text-purple-400", bg: "bg-purple-400/10" },
        ].map((s) => (
          <Card key={s.label} className="border-white/5 bg-white/[0.02]">
            <CardContent className="flex items-center gap-4 p-5">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.bg}`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-sm text-slate-400">{s.label}</p>
                <p className="text-xl font-bold text-white">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-white/5 bg-white/[0.02]">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-slate-400">User</TableHead>
                <TableHead className="text-slate-400">Role</TableHead>
                <TableHead className="text-slate-400">Services</TableHead>
                <TableHead className="text-slate-400">Orders</TableHead>
                <TableHead className="text-slate-400">Verified</TableHead>
                <TableHead className="text-slate-400">2FA</TableHead>
                <TableHead className="text-slate-400">Joined</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow className="border-white/5">
                  <TableCell colSpan={7} className="py-12 text-center text-slate-500">
                    <Users className="mx-auto mb-3 h-10 w-10 text-slate-600" />
                    No users yet
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className="border-white/5 hover:bg-white/[0.02]">
                    <TableCell>
                      <div>
                        <p className="font-medium text-white">{user.name}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          user.role === "ADMIN"
                            ? "bg-red-500/10 text-red-400 border-red-500/20"
                            : "bg-slate-500/10 text-slate-400 border-slate-500/20"
                        }
                      >
                        {user.role}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-300">{user._count.services}</TableCell>
                    <TableCell className="text-slate-300">{user._count.orders}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          user.emailVerified
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                        }
                      >
                        {user.emailVerified ? "Yes" : "No"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          (user as any).twoFactorEnabled
                            ? "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            : "bg-slate-500/10 text-slate-500 border-slate-500/20"
                        }
                      >
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {(user as any).twoFactorEnabled ? "On" : "Off"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {user.createdAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
