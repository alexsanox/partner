"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import Image from "next/image";
import {
  Menu,
  Zap,
  LayoutDashboard,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";

const navLinks = [
  { href: "/#features", label: "Features" },
  { href: "/store", label: "Store" },
  { href: "/#pricing", label: "Pricing" },
  { href: "/#faq", label: "FAQ" },
  { href: "/support", label: "Support" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <Image src="/logo.webp" alt="Pobble" width={36} height={36} className="rounded-lg" />
          <span className="text-lg font-bold tracking-tight text-white">
            Pobble<span className="text-[#00c98d]">Host</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3.5 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Desktop CTA */}
        <div className="hidden items-center gap-3 md:flex">
          {session ? (
            <Link href="/dashboard">
              <Button size="sm" className="bg-[#00c98d] hover:bg-[#00e0a0] text-white shadow-lg shadow-[#00c98d]/20">
                <LayoutDashboard className="mr-1.5 h-3.5 w-3.5" />
                Dashboard
              </Button>
            </Link>
          ) : (
            <>
              <Link href="/login">
                <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white hover:bg-white/5">
                  Sign In
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="bg-[#00c98d] hover:bg-[#00e0a0] text-white shadow-lg shadow-[#00c98d]/20">
                  <Zap className="mr-1.5 h-3.5 w-3.5" />
                  Get Started
                </Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger
            className="md:hidden"
            render={
              <Button variant="ghost" size="icon" className="text-slate-300" />
            }
          >
            <Menu className="h-5 w-5" />
          </SheetTrigger>
          <SheetContent side="right" className="w-72 bg-[#0f1219] border-white/5">
            <nav className="mt-8 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="rounded-md px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
                >
                  {link.label}
                </Link>
              ))}
              <div className="mt-4 flex flex-col gap-2 px-4">
                {session ? (
                  <Link href="/dashboard" onClick={() => setOpen(false)}>
                    <Button className="w-full bg-[#00c98d] hover:bg-[#00e0a0] text-white">
                      <LayoutDashboard className="mr-1.5 h-3.5 w-3.5" />
                      Dashboard
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setOpen(false)}>
                      <Button variant="outline" className="w-full border-white/10 text-slate-300">
                        Sign In
                      </Button>
                    </Link>
                    <Link href="/register" onClick={() => setOpen(false)}>
                      <Button className="w-full bg-[#00c98d] hover:bg-[#00e0a0] text-white">
                        <Zap className="mr-1.5 h-3.5 w-3.5" />
                        Get Started
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
