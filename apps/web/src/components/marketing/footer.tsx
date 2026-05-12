"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ArrowRight, Mail, MessageCircle, CheckCircle2 } from "lucide-react";

const footerSections = [
  {
    title: "Hosting",
    links: [
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
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
    setEmail("");
  };

  return (
    <footer className="bg-[#070a0f]">
      {/* Newsletter banner */}
      <div className="border-y border-white/[0.06] bg-[#0d1117]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#00c98d]/10">
                <Mail className="h-5 w-5 text-[#00c98d]" />
              </div>
              <div>
                <p className="font-bold text-white">Stay in the loop</p>
                <p className="mt-0.5 text-sm text-[#8b92a8]">
                  Get notified about new features, maintenance windows, and promotions. No spam, ever.
                </p>
              </div>
            </div>
            {submitted ? (
              <div className="flex shrink-0 items-center gap-2 rounded-xl border border-[#00c98d]/20 bg-[#00c98d]/10 px-5 py-3">
                <CheckCircle2 className="h-4 w-4 text-[#00c98d]" />
                <span className="text-sm font-semibold text-[#00c98d]">You&apos;re subscribed!</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex w-full shrink-0 gap-2 sm:w-auto">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-sm text-white placeholder:text-[#8b92a8]/60 outline-none focus:border-[#00c98d]/40 transition-colors sm:w-64"
                />
                <button
                  type="submit"
                  className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[#00c98d] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#00e0a0] transition-colors"
                >
                  Subscribe <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="mx-auto max-w-7xl px-4 pt-14 pb-8 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-6">
          {/* Brand col — spans 2 */}
          <div className="col-span-2">
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
              className="mt-5 inline-flex items-center gap-2.5 rounded-xl border border-[#5865F2]/30 bg-[#5865F2]/10 px-4 py-2.5 text-sm font-semibold text-[#7c85f5] transition-all hover:border-[#5865F2]/50 hover:bg-[#5865F2]/15 hover:text-white"
            >
              <MessageCircle className="h-4 w-4" />
              Join our Discord
              <ArrowRight className="h-3.5 w-3.5 ml-auto" />
            </Link>

            {/* Support email */}
            <a
              href="mailto:support@partnerhosting.com"
              className="mt-3 flex items-center gap-2 text-sm text-[#8b92a8] hover:text-[#00c98d] transition-colors"
            >
              <Mail className="h-3.5 w-3.5 shrink-0" />
              support@partnerhosting.com
            </a>
          </div>

          {/* Link columns */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                {section.title}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-[#8b92a8] transition-colors hover:text-white"
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
        <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-white/[0.06] pt-7 sm:flex-row">
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
