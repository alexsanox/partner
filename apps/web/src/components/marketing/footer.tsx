import Link from "next/link";
import { Server } from "lucide-react";

const footerSections = [
  {
    title: "Hosting",
    links: [
      { label: "Minecraft Hosting", href: "/#pricing" },
      { label: "Features", href: "/#features" },
      { label: "Server Locations", href: "/#features" },
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
    <footer className="border-t border-white/5 bg-[#070a0f]">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-5">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                <Server className="h-4 w-4 text-white" />
              </div>
              <span className="text-base font-bold text-white">
                Partner<span className="text-blue-400">Hosting</span>
              </span>
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Premium Minecraft server hosting with instant deployment and 24/7
              support.
            </p>
          </div>

          {/* Links */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-white">
                {section.title}
              </h3>
              <ul className="mt-3 space-y-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-slate-400 transition-colors hover:text-white"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 sm:flex-row">
          <p className="text-sm text-slate-500">
            &copy; {new Date().getFullYear()} Partner Hosting. All rights
            reserved.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="https://discord.gg"
              className="text-sm text-slate-500 transition-colors hover:text-white"
              target="_blank"
            >
              Discord
            </Link>
            <Link
              href="https://twitter.com"
              className="text-sm text-slate-500 transition-colors hover:text-white"
              target="_blank"
            >
              Twitter
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
