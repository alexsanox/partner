"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Server,
  LayoutDashboard,
  CreditCard,
  LifeBuoy,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/auth-client";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/services", icon: Server, label: "My Servers" },
  { href: "/dashboard/billing", icon: CreditCard, label: "Billing" },
  { href: "/dashboard/support", icon: LifeBuoy, label: "Support" },
  { href: "/dashboard/settings", icon: Settings, label: "Settings" },
];

function SidebarContent({
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
      <div className="flex h-14 items-center justify-between px-3 border-b border-white/[0.07]">
        <Link href="/" className="flex items-center gap-2" onClick={onNavClick}>
          <Image src="/logo.webp" alt="Pobble" width={28} height={28} className="rounded-md shrink-0" />
          {!collapsed && (
            <span className="text-sm font-bold tracking-wide text-white">
              Pobble<span className="text-[#00c98d]">Host</span>
            </span>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex rounded p-1 text-[#8b92a8] hover:text-white transition-colors"
        >
          {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 py-3 px-2 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));
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
        <button
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium text-[#8b92a8] transition-colors hover:bg-[#1e2336] hover:text-white"
          onClick={async () => { await signOut(); router.push("/"); }}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
        <Link
          href="/dashboard/support"
          onClick={onNavClick}
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium text-[#8b92a8] transition-colors hover:bg-[#1e2336] hover:text-white"
        >
          <HelpCircle className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Help & Feedback</span>}
        </Link>
      </div>
    </div>
  );
}

export function DashboardSidebar() {
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
        <SidebarContent collapsed={collapsed} setCollapsed={setCollapsed} />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b border-white/[0.07] bg-[#171b29] px-4">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo.webp" alt="Pobble" width={28} height={28} className="rounded-md" />
          <span className="text-sm font-bold text-white">Pobble<span className="text-[#00c98d]">Host</span></span>
        </Link>
        <button
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-[#8b92a8] hover:bg-white/[0.05] hover:text-white"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Mobile drawer overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 flex w-[260px] flex-col bg-[#171b29] border-r border-white/[0.07]">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 rounded-lg p-1.5 text-[#8b92a8] hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarContent
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
