"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { signOut } from "@/lib/auth-client";
import {
  Server,
  LayoutDashboard,
  Users,
  CreditCard,
  HardDrive,
  Activity,
  Settings,
  Shield,
  MessageSquare,
  PackageOpen,
  Egg,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ArrowLeft,
  Menu,
  X,
} from "lucide-react";

const navItems = [
  { href: "/admin", icon: LayoutDashboard, label: "Overview" },
  { href: "/admin/users", icon: Users, label: "Users" },
  { href: "/admin/services", icon: Server, label: "Services" },
  { href: "/admin/nodes", icon: HardDrive, label: "Nodes" },
  { href: "/admin/billing", icon: CreditCard, label: "Billing" },
  { href: "/admin/plans", icon: PackageOpen, label: "Plans" },
  { href: "/admin/eggs", icon: Egg, label: "Eggs" },
  { href: "/admin/tickets", icon: MessageSquare, label: "Tickets" },
  { href: "/admin/provisioning", icon: Activity, label: "Provisioning" },
  { href: "/admin/settings", icon: Settings, label: "Settings" },
];

function AdminSidebarContent({
  collapsed,
  setCollapsed,
  onNavClick,
}: {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  onNavClick?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className={`flex h-14 items-center border-b border-white/[0.07] px-3 ${collapsed ? "justify-center" : "justify-between"}`}>
        {!collapsed && (
          <Link href="/admin" className="flex items-center gap-2" onClick={onNavClick}>
            <div className="flex h-7 w-7 shrink-0 items-center justify-center">
              <Shield className="h-5 w-5 text-[#00c98d]" />
            </div>
            <span className="text-sm font-bold tracking-wide text-white uppercase">Admin</span>
          </Link>
        )}
        {collapsed && (
          <Link href="/admin" onClick={onNavClick}>
            <Shield className="h-5 w-5 text-[#00c98d]" />
          </Link>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex rounded p-1 text-[#8b92a8] hover:text-white transition-colors shrink-0"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavClick}
              className={cn(
                "group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] font-medium transition-all duration-150",
                isActive
                  ? "bg-[#232839] text-white"
                  : "text-[#8b92a8] hover:bg-[#1e2336] hover:text-[#c8cdd8]"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-[#00c98d]" />
              )}
              <item.icon className={cn("h-[18px] w-[18px] shrink-0", isActive ? "text-[#00c98d]" : "")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/[0.07] p-2 space-y-0.5">
        <Link
          href="/dashboard"
          onClick={onNavClick}
          className="flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium text-[#8b92a8] transition-colors hover:bg-[#1e2336] hover:text-white"
        >
          <ArrowLeft className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Back to Dashboard</span>}
        </Link>
        <button
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium text-[#8b92a8] transition-colors hover:bg-[#1e2336] hover:text-white"
          onClick={async () => { await signOut(); router.push("/"); }}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );
}

export function AdminSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={cn(
          "hidden md:flex h-screen flex-col border-r border-white/[0.07] bg-[#171b29] transition-all duration-200",
          collapsed ? "w-[52px]" : "w-[220px]"
        )}
      >
        <AdminSidebarContent collapsed={collapsed} setCollapsed={setCollapsed} />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b border-white/[0.07] bg-[#171b29] px-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-[#00c98d]" />
          <span className="text-sm font-bold tracking-wide text-white uppercase">Admin</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-[#8b92a8] hover:bg-white/[0.05] hover:text-white"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative z-10 flex w-[260px] flex-col bg-[#171b29] border-r border-white/[0.07]">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-[#8b92a8] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            <AdminSidebarContent
              collapsed={false}
              setCollapsed={() => {}}
              onNavClick={() => setMobileOpen(false)}
            />
          </aside>
        </div>
      )}
    </>
  );
}
