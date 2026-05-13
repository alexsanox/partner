"use client";

import { useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Server, Bot, Check, HardDrive, Cpu, MemoryStick,
  Zap, ArrowRight, Sparkles, Shield, Clock, Headphones,
} from "lucide-react";

type Plan = {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string | null;
  ramMb: number;
  cpuPercent: number;
  diskMb: number;
  playerSlots: number;
  priceMonthly: number;
  features: string[];
};

function fmtRam(mb: number) {
  if (mb >= 1024) {
    const gb = mb / 1024;
    return Number.isInteger(gb) ? `${gb} GB` : `${gb.toFixed(1)} GB`;
  }
  return `${mb} MB`;
}

function fmtDisk(mb: number) {
  if (mb >= 1024) {
    const gb = mb / 1024;
    return Number.isInteger(gb) ? `${gb} GB` : `${gb.toFixed(1)} GB`;
  }
  return `${mb} MB`;
}

const PERKS = [
  { icon: Zap, label: "60-second deploy", sub: "Instant provisioning" },
  { icon: Shield, label: "DDoS protection", sub: "Always-on mitigation" },
  { icon: Clock, label: "99.9% uptime SLA", sub: "Enterprise reliability" },
  { icon: Headphones, label: "24/7 expert support", sub: "Real humans, fast response" },
];

function PlanCard({ plan, accent, popular }: {
  plan: Plan;
  accent: {
    gradientBar: string;
    accentText: string;
    accentBg: string;
    accentBorder: string;
    accentGlow: string;
    checkColor: string;
    btnPrimary: string;
    btnSecondary: string;
    badgeBg: string;
  };
  popular?: boolean;
}) {
  return (
    <div className={cn(
      "group relative flex flex-col overflow-hidden rounded-2xl border bg-[#131720] transition-all duration-300 hover:scale-[1.02] hover:bg-[#181d2e]",
      popular
        ? `${accent.accentBorder} shadow-xl ${accent.accentGlow}`
        : "border-white/[0.07] hover:border-white/[0.12]"
    )}>
      {/* Top gradient bar */}
      <div className={`h-1 w-full bg-gradient-to-r ${accent.gradientBar}`} />

      {popular && (
        <div className="absolute right-4 top-5">
          <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold text-white shadow-lg ${accent.badgeBg}`}>
            <Zap className="h-3 w-3" /> Most Popular
          </span>
        </div>
      )}

      <div className="flex flex-1 flex-col p-6">
        {/* Header */}
        <div className="mb-5">
          <p className={`text-xs font-bold uppercase tracking-widest ${accent.accentText}`}>
            {plan.type === "MINECRAFT" ? "Minecraft" : "Discord Bot"}
          </p>
          <h3 className="mt-1.5 text-2xl font-black text-white">{plan.name}</h3>
          {plan.description && (
            <p className="mt-1.5 text-sm leading-relaxed text-[#8b92a8]">{plan.description}</p>
          )}
        </div>

        {/* Price */}
        <div className="mb-5 flex items-end gap-1.5">
          <span className="text-5xl font-black tracking-tight text-white">
            ${(plan.priceMonthly / 100).toFixed(0)}
          </span>
          <div className="mb-1.5">
            <span className="block text-sm text-[#8b92a8]">/month</span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="mb-5 grid grid-cols-3 gap-2">
          {[
            { icon: MemoryStick, label: "RAM", value: fmtRam(plan.ramMb) },
            { icon: HardDrive, label: "Disk", value: fmtDisk(plan.diskMb) },
            { icon: Cpu, label: "CPU", value: `${plan.cpuPercent}%` },
          ].map((s) => (
            <div key={s.label} className={cn(
              "rounded-xl p-3 text-center",
              popular ? `${accent.accentBg} border ${accent.accentBorder}` : "bg-white/[0.03] border border-white/[0.05]"
            )}>
              <s.icon className={`mx-auto mb-1 h-4 w-4 ${accent.accentText}`} />
              <div className="text-sm font-bold text-white">{s.value}</div>
              <div className="text-[10px] uppercase tracking-wide text-[#8b92a8]">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Divider */}
        <div className="mb-4 border-t border-white/[0.05]" />

        {/* Features */}
        <ul className="mb-6 flex-1 space-y-2.5">
          {plan.features.map((f) => (
            <li key={f} className="flex items-center gap-2.5 text-sm text-[#c8cdd8]">
              <Check className={`h-4 w-4 shrink-0 ${accent.checkColor}`} />
              {f}
            </li>
          ))}
          {plan.features.length === 0 && (
            <>
              {["DDoS Protection", "24/7 Support", "Daily Backups", "Instant Deploy"].map((f) => (
                <li key={f} className="flex items-center gap-2.5 text-sm text-[#c8cdd8]">
                  <Check className={`h-4 w-4 shrink-0 ${accent.checkColor}`} />
                  {f}
                </li>
              ))}
            </>
          )}
        </ul>

        {/* CTA */}
        <Link href="/register" className="block">
          <button className={cn(
            "w-full rounded-xl py-3 text-sm font-bold transition-all flex items-center justify-center gap-2",
            popular ? accent.btnPrimary : accent.btnSecondary
          )}>
            {popular && <Sparkles className="h-4 w-4" />}
            Get Started
            <ArrowRight className="h-4 w-4" />
          </button>
        </Link>
      </div>
    </div>
  );
}

const MC_ACCENT = {
  gradientBar: "from-[#00c98d] to-[#4dd9ae]",
  accentText: "text-[#00c98d]",
  accentBg: "bg-[#00c98d]/5",
  accentBorder: "border-[#00c98d]/30",
  accentGlow: "shadow-[#00c98d]/15",
  checkColor: "text-[#00c98d]",
  btnPrimary: "bg-[#00c98d] text-white shadow-lg shadow-[#00c98d]/30 hover:bg-[#00e0a0] hover:shadow-[#00c98d]/40",
  btnSecondary: "bg-white/[0.06] text-white border border-white/[0.08] hover:bg-white/[0.10] hover:border-white/[0.15]",
  badgeBg: "bg-[#00c98d] shadow-[#00c98d]/30",
};

const DC_ACCENT = {
  gradientBar: "from-[#5865F2] to-[#7c85f5]",
  accentText: "text-[#7c85f5]",
  accentBg: "bg-[#5865F2]/5",
  accentBorder: "border-[#5865F2]/30",
  accentGlow: "shadow-[#5865F2]/15",
  checkColor: "text-[#7c85f5]",
  btnPrimary: "bg-[#5865F2] text-white shadow-lg shadow-[#5865F2]/25 hover:bg-[#4752c4] hover:shadow-[#5865F2]/35",
  btnSecondary: "bg-white/[0.06] text-white border border-white/[0.08] hover:bg-white/[0.10] hover:border-white/[0.15]",
  badgeBg: "bg-[#5865F2] shadow-[#5865F2]/30",
};

const CATEGORIES = [
  { id: "minecraft", label: "Minecraft Hosting", icon: Server },
  { id: "discord", label: "Discord Bot Hosting", icon: Bot },
];

export function StoreClient({ mcPlans, discordPlans }: { mcPlans: Plan[]; discordPlans: Plan[] }) {
  const hasDiscard = discordPlans.length > 0;
  const [active, setActive] = useState("minecraft");

  const plans = active === "minecraft" ? mcPlans : discordPlans;
  const accent = active === "minecraft" ? MC_ACCENT : DC_ACCENT;
  const midIdx = Math.floor(plans.length / 2);

  return (
    <main className="bg-[#0f1219] min-h-screen">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-32 pb-20">
        <div className="pointer-events-none absolute inset-0 -z-10">
          <div className="absolute left-1/3 top-0 h-[600px] w-[700px] -translate-x-1/2 rounded-full bg-[#00c98d]/5 blur-[120px]" />
          <div className="absolute right-1/4 bottom-0 h-[400px] w-[500px] rounded-full bg-[#5865F2]/5 blur-[100px]" />
        </div>

        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#00c98d]/30 bg-[#00c98d]/10 px-4 py-1.5">
            <Zap className="h-3.5 w-3.5 text-[#00c98d]" />
            <span className="text-sm font-semibold text-[#00c98d]">Instant Deployment</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
            Hosting for{" "}
            <span className="bg-gradient-to-r from-[#00c98d] to-[#4dd9ae] bg-clip-text text-transparent">
              Every Game
            </span>
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-[#a8b0c4]">
            Enterprise NVMe hardware, DDoS protection, and 24/7 expert support.
            No hidden fees — go live in under 60 seconds.
          </p>
        </div>

        {/* Perks bar */}
        <div className="mx-auto mt-12 max-w-5xl px-4 sm:px-6">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {PERKS.map((p) => (
              <div key={p.label} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] px-4 py-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#00c98d]/10">
                  <p.icon className="h-4 w-4 text-[#00c98d]" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{p.label}</p>
                  <p className="text-[10px] text-[#8b92a8]">{p.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Category Tabs ── */}
      <div className="sticky top-0 z-20 border-b border-white/[0.06] bg-[#0f1219]/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-3 scrollbar-none">
            {CATEGORIES.filter((c) => c.id === "minecraft" || hasDiscard).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActive(cat.id)}
                className={cn(
                  "flex shrink-0 items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold transition-all",
                  active === cat.id
                    ? cat.id === "minecraft"
                      ? "bg-[#00c98d]/15 text-[#00c98d] border border-[#00c98d]/30"
                      : "bg-[#5865F2]/15 text-[#7c85f5] border border-[#5865F2]/30"
                    : "text-[#8b92a8] hover:text-white border border-transparent hover:border-white/[0.08] hover:bg-white/[0.04]"
                )}
              >
                <cat.icon className="h-4 w-4" />
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Plans ── */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Section header */}
        <div className="mb-10 text-center">
          <div className={cn(
            "mb-3 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5",
            active === "minecraft" ? "border-[#00c98d]/30 bg-[#00c98d]/10" : "border-[#5865F2]/30 bg-[#5865F2]/10"
          )}>
            {active === "minecraft"
              ? <Server className="h-3.5 w-3.5 text-[#00c98d]" />
              : <Bot className="h-3.5 w-3.5 text-[#7c85f5]" />
            }
            <span className={cn("text-sm font-semibold", active === "minecraft" ? "text-[#00c98d]" : "text-[#7c85f5]")}>
              {active === "minecraft" ? "Minecraft Hosting" : "Discord Bot Hosting"}
            </span>
          </div>
          <h2 className="text-3xl font-black text-white sm:text-4xl">
            {active === "minecraft" ? "Choose Your Server" : "Host Your Bot"}
          </h2>
          <p className="mt-3 text-[#a8b0c4]">
            {active === "minecraft"
              ? "From small friend groups to massive networks — we have a plan for every scale."
              : "Keep your Discord bot online 24/7 with rock-solid infrastructure."}
          </p>
        </div>

        {plans.length === 0 ? (
          <div className="flex flex-col items-center py-24 text-center">
            {active === "minecraft"
              ? <Server className="h-16 w-16 text-[#8b92a8] mb-4 opacity-40" />
              : <Bot className="h-16 w-16 text-[#8b92a8] mb-4 opacity-40" />
            }
            <p className="text-xl font-bold text-white">Plans coming soon</p>
            <p className="mt-2 text-[#8b92a8]">Check back shortly or join our Discord for updates.</p>
            <a
              href="https://discord.gg/ZhTWCJAkHv"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#5865F2] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#4752c4] transition-colors"
            >
              Join Discord
            </a>
          </div>
        ) : (
          <div className={cn(
            "grid gap-6",
            plans.length === 1 ? "sm:max-w-sm mx-auto" :
            plans.length === 2 ? "sm:grid-cols-2 max-w-3xl mx-auto" :
            "sm:grid-cols-2 lg:grid-cols-3"
          )}>
            {plans.map((plan, i) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                accent={accent}
                popular={plans.length >= 3 && i === midIdx}
              />
            ))}
          </div>
        )}
      </section>

      {/* ── Bottom CTA ── */}
      <section className="border-t border-white/[0.06] bg-[#0d1117] py-16">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-2xl font-black text-white sm:text-3xl">
            Not sure which plan?
          </h2>
          <p className="mt-3 text-[#a8b0c4]">
            Our team is happy to help you choose. Join our Discord or reach out via email.
          </p>
          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <a
              href="https://discord.gg/ZhTWCJAkHv"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#5865F2] px-6 py-3 text-sm font-bold text-white shadow-lg shadow-[#5865F2]/20 hover:bg-[#4752c4] transition-all hover:scale-[1.02]"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057c.002.022.015.042.03.052a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
              </svg>
              Chat on Discord
            </a>
            <a
              href="mailto:support@pobble.host"
              className="inline-flex items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.04] px-6 py-3 text-sm font-bold text-white hover:bg-white/[0.08] transition-all"
            >
              Email Support
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
