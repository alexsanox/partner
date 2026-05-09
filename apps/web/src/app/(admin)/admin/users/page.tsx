import { Card, CardContent, CardHeader } from "@/components/ui/card";
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

const mockUsers = [
  { id: "1", name: "Alex Martinez", email: "alex@example.com", role: "USER", services: 3, joined: "Jan 15, 2026", status: "Active" },
  { id: "2", name: "Sarah Kim", email: "sarah@example.com", role: "USER", services: 1, joined: "Feb 20, 2026", status: "Active" },
  { id: "3", name: "James Rogers", email: "james@example.com", role: "ADMIN", services: 2, joined: "Mar 5, 2026", status: "Active" },
  { id: "4", name: "Emma Liu", email: "emma@example.com", role: "USER", services: 0, joined: "Apr 10, 2026", status: "Suspended" },
  { id: "5", name: "David Wilson", email: "david@example.com", role: "USER", services: 1, joined: "May 1, 2026", status: "Active" },
];

export default function AdminUsersPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">User Management</h1>
        <p className="mt-1 text-sm text-slate-400">
          View and manage all registered users
        </p>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <Input
            placeholder="Search users by name or email..."
            className="border-white/10 bg-white/5 pl-10 text-white placeholder:text-slate-500"
          />
        </div>
      </div>

      <Card className="border-white/5 bg-white/[0.02]">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="text-slate-400">User</TableHead>
                <TableHead className="text-slate-400">Role</TableHead>
                <TableHead className="text-slate-400">Services</TableHead>
                <TableHead className="text-slate-400">Joined</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-right text-slate-400">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockUsers.map((user) => (
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
                  <TableCell className="text-slate-300">{user.services}</TableCell>
                  <TableCell className="text-slate-400">{user.joined}</TableCell>
                  <TableCell>
                    <Badge
                      variant="outline"
                      className={
                        user.status === "Active"
                          ? "bg-green-500/10 text-green-400 border-green-500/20"
                          : "bg-orange-500/10 text-orange-400 border-orange-500/20"
                      }
                    >
                      {user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
