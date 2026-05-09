"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Server,
  LayoutDashboard,
  Users,
  CreditCard,
  HardDrive,
  Activity,
  Settings,
  ArrowLeft,
  Shield,
} from "lucide-react";

const navItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Overview" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/services", icon: Server, label: "Services" },
  { href: "/admin/nodes", icon: HardDrive, label: "Nodes" },
  { href: "/admin/billing", icon: CreditCard, label: "Billing" },
  { href: "/admin/provisioning", icon: Activity, label: "Provisioning" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-60 flex-col border-r border-white/5 bg-[#0f1219]">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-white/5 px-4">
        <Link href="/admin" className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-red-500 to-orange-500">
            <Shield className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-bold text-white">
            Admin<span className="text-red-400">Panel</span>
          </span>
        </Link>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 space-y-1 p-3">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-red-600/10 text-red-400"
                  : "text-slate-400 hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className="h-4.5 w-4.5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Back to Dashboard */}
      <div className="border-t border-white/5 p-3">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-400 transition-colors hover:bg-white/5 hover:text-white"
        >
          <ArrowLeft className="h-4.5 w-4.5 shrink-0" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    </aside>
  );
}
