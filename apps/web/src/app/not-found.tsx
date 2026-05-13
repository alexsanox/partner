import Link from "next/link";
import { Home, Search } from "lucide-react";
import { BackButton } from "@/components/ui/back-button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-0">
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00c98d]/6 blur-[120px]" />
        <div className="absolute right-1/4 top-1/2 h-[300px] w-[400px] rounded-full bg-blue-500/5 blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-4 text-center">
        {/* Error code */}
        <div className="relative mb-6 select-none">
          <p className="text-[180px] sm:text-[220px] font-black leading-none text-white/[0.03] tracking-tighter">
            404
          </p>
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-7xl sm:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/30 tracking-tighter">
              404
            </p>
          </div>
        </div>

        {/* Icon */}
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/[0.08] bg-white/[0.03]">
          <Search className="h-7 w-7 text-[#8b92a8]" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3">
          Page not found
        </h1>
        <p className="text-[#8b92a8] text-base max-w-md leading-relaxed mb-10">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Double-check the URL or head back home.
        </p>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl bg-[#00c98d] px-6 py-3 text-sm font-bold text-white hover:bg-[#00b07d] transition-colors"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Link>
          <BackButton />
        </div>

        {/* Helpful links */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-6 text-xs text-[#8b92a8]">
          {[
            { href: "/dashboard", label: "Dashboard" },
            { href: "/dashboard/services/create", label: "Create Server" },
            { href: "/support", label: "Support" },
            { href: "/blog", label: "Blog" },
          ].map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-white transition-colors">
              {link.label}
            </Link>
          ))}
        </div>
      </div>

      {/* Footer line */}
      <div className="relative z-10 border-t border-white/[0.04] py-5 text-center text-xs text-[#8b92a8]/50">
        PobbleHost &copy; {new Date().getFullYear()}
      </div>
    </div>
  );
}
