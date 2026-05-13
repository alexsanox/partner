import Link from "next/link";
import Image from "next/image";
import { Mail } from "lucide-react";

const footerSections = [
  {
    title: "Hosting",
    links: [
      { label: "Store", href: "/store" },
      { label: "Minecraft Hosting", href: "/#pricing" },
      { label: "Features", href: "/#features" },
      { label: "Server Locations", href: "/locations" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "/about" },
      { label: "Blog", href: "/blog" },
      { label: "Careers", href: "/careers" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Help Center", href: "/support" },
      { label: "Contact Us", href: "/support" },
      { label: "Status", href: "/status" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Terms of Service", href: "/legal/terms" },
      { label: "Privacy Policy", href: "/legal/privacy" },
      { label: "SLA", href: "/legal/sla" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-[#070a0f]">
      {/* Main footer */}
      <div className="mx-auto max-w-7xl px-4 pt-8 pb-5 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-6">
          {/* Brand col — spans 2 */}
          <div className="col-span-2 sm:col-span-3 md:col-span-2">
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/logo.webp" alt="PobbleHost" width={34} height={34} className="rounded-lg" />
              <span className="text-base font-bold text-white">
                Pobble<span className="text-[#00c98d]">Host</span>
              </span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-[#8b92a8]">
              Premium game server hosting with instant deployment, enterprise hardware, and 24/7 expert support.
            </p>

            {/* Discord CTA */}
            <Link
              href="https://discord.gg/ZhTWCJAkHv"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-2.5 rounded-xl bg-[#5865F2] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#5865F2]/20 transition-all hover:bg-[#4752c4] hover:shadow-[#5865F2]/30 hover:scale-[1.02] active:scale-100"
            >
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.042.03.052a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
              </svg>
              Join our Discord
              <span className="ml-auto rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-bold">FREE</span>
            </Link>

            {/* Support email */}
            <a
              href="mailto:support@pobble.host"
              className="mt-3 flex items-center gap-2 text-sm text-[#8b92a8] hover:text-[#00c98d] transition-colors"
            >
              <Mail className="h-3.5 w-3.5 shrink-0" />
              support@pobble.host
            </a>
          </div>

          {/* Link columns */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                {section.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-xs text-[#8b92a8] transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-8 flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] pt-5 sm:flex-row">
          <p className="text-xs text-[#8b92a8]">
            &copy; {new Date().getFullYear()} PobbleHost. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-5">
            <Link href="/legal/terms" className="text-xs text-[#8b92a8] hover:text-white transition-colors">Terms</Link>
            <Link href="/legal/privacy" className="text-xs text-[#8b92a8] hover:text-white transition-colors">Privacy</Link>
            <Link href="/legal/sla" className="text-xs text-[#8b92a8] hover:text-white transition-colors">SLA</Link>
            <Link href="/status" className="flex items-center gap-1.5 text-xs text-[#8b92a8] hover:text-white transition-colors">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              All Systems Operational
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
