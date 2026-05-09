"use client";

import Link from "next/link";
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
  Zap,
  HelpCircle,
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

export function DashboardSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex h-screen flex-col border-r border-white/[0.07] bg-[#171b29] transition-all duration-200",
        collapsed ? "w-[52px]" : "w-[220px]"
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center justify-between px-3 border-b border-white/[0.07]">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center">
            <Zap className="h-5 w-5 text-[#5b8cff]" />
          </div>
          {!collapsed && (
            <span className="text-sm font-bold tracking-wide text-white uppercase">
              Partner
            </span>
          )}
        </Link>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="rounded p-1 text-[#8b92a8] hover:text-white transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
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
              className={cn(
                "group relative flex items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium transition-all duration-150",
                isActive
                  ? "bg-[#232839] text-white"
                  : "text-[#8b92a8] hover:bg-[#1e2336] hover:text-[#c8cdd8]"
              )}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-[#5b8cff]" />
              )}
              <item.icon className={cn("h-[18px] w-[18px] shrink-0", isActive ? "text-[#5b8cff]" : "")} />
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-white/[0.07] p-2 space-y-0.5">
        <button
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium text-[#8b92a8] transition-colors hover:bg-[#1e2336] hover:text-white"
          onClick={async () => {
            await signOut();
            router.push("/");
          }}
        >
          <LogOut className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>

        <Link
          href="/dashboard/support"
          className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-[13px] font-medium text-[#8b92a8] transition-colors hover:bg-[#1e2336] hover:text-white"
        >
          <HelpCircle className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Help & Feedback</span>}
        </Link>
      </div>
    </aside>
  );
}
