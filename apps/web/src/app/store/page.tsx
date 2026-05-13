import { prisma } from "@/lib/db";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Server, Bot, Check, HardDrive, Cpu, MemoryStick,
  Zap, ArrowRight, Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

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

function fmtRam(mb: number) { return mb >= 1024 ? `${mb / 1024} GB` : `${mb} MB`; }
function fmtDisk(mb: number) { return mb >= 1024 ? `${mb / 1024} GB` : `${mb} MB`; }

function PlanCard({ plan, accent, popular }: {
  plan: Plan;
  accent: { bar: string; text: string; badge: string; badgeBg: string; btn: string; btnPopular: string; check: string };
  popular?: boolean;
}) {
  return (
    <div className={cn(
      "relative flex flex-col rounded-2xl border bg-[#131720] overflow-hidden transition-all duration-300 hover:scale-[1.02]",
      popular ? `border-[#00c98d]/40 shadow-xl shadow-[#00c98d]/10` : "border-white/[0.07] hover:border-white/15"
    )}>
      <div className={`h-1 w-full bg-gradient-to-r ${accent.bar}`} />

      {popular && (
        <div className="absolute right-4 top-5">
          <Badge className="border-0 bg-[#00c98d] text-xs font-bold text-white shadow-lg shadow-[#00c98d]/30">
            <Zap className="mr-1 h-3 w-3" /> Most Popular
          </Badge>
        </div>
      )}

      <div className="p-6 flex-1 flex flex-col gap-4">
        <div>
          <p className={`text-xs font-semibold uppercase tracking-widest ${accent.text}`}>
            {plan.type === "MINECRAFT" ? "Minecraft" : "Discord Bot"}
          </p>
          <h3 className="mt-1 text-xl font-bold text-white">{plan.name}</h3>
          {plan.description && <p className="mt-1 text-sm text-[#8b92a8]">{plan.description}</p>}
        </div>

        <div className="flex items-baseline gap-1">
          <span className="text-5xl font-black text-white">${(plan.priceMonthly / 100).toFixed(0)}</span>
          <span className="text-base text-[#8b92a8]">/mo</span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: MemoryStick, label: "RAM", value: fmtRam(plan.ramMb) },
            { icon: HardDrive, label: "Disk", value: fmtDisk(plan.diskMb) },
            { icon: Cpu, label: "CPU", value: `${plan.cpuPercent}%` },
          ].map((s) => (
            <div key={s.label} className="rounded-lg bg-white/[0.03] p-2 text-center">
              <s.icon className={`mx-auto mb-1 h-3.5 w-3.5 ${accent.text}`} />
              <div className="text-xs font-bold text-white">{s.value}</div>
              <div className="text-[10px] text-[#8b92a8]">{s.label}</div>
            </div>
          ))}
        </div>

        {plan.features.length > 0 && (
          <ul className="space-y-2 flex-1">
            {plan.features.map((f) => (
              <li key={f} className="flex items-center gap-2 text-sm text-[#c8cdd8]">
                <Check className={`h-4 w-4 shrink-0 ${accent.check}`} />
                {f}
              </li>
            ))}
          </ul>
        )}

        <Link href="/register" className="mt-auto">
          <Button className={cn("w-full h-11 font-semibold transition-all", popular ? accent.btnPopular : accent.btn)}>
            {popular && <Sparkles className="mr-2 h-4 w-4" />}
            Get Started <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default async function StorePage() {
  const [mcPlans, discordPlans] = await Promise.all([
    prisma.plan.findMany({ where: { isActive: true, type: "MINECRAFT" }, orderBy: { sortOrder: "asc" } }),
    prisma.plan.findMany({ where: { isActive: true, type: "DISCORD_BOT" }, orderBy: { sortOrder: "asc" } }),
  ]);

  const mcAccent = {
    bar: "from-[#00c98d] to-[#4dd9ae]",
    text: "text-[#00c98d]",
    badge: "text-[#00c98d]",
    badgeBg: "bg-[#00c98d]/10",
    btn: "bg-white/[0.06] text-white hover:bg-white/10 border border-white/[0.08]",
    btnPopular: "bg-[#00c98d] text-white shadow-lg shadow-[#00c98d]/30 hover:bg-[#00e0a0]",
    check: "text-[#00c98d]",
  };

  const discordAccent = {
    bar: "from-[#5865F2] to-[#7c85f5]",
    text: "text-[#5865F2]",
    badge: "text-[#5865F2]",
    badgeBg: "bg-[#5865F2]/10",
    btn: "bg-white/[0.06] text-white hover:bg-white/10 border border-white/[0.08]",
    btnPopular: "bg-[#5865F2] text-white shadow-lg shadow-[#5865F2]/20 hover:bg-[#4752c4]",
    check: "text-[#5865F2]",
  };

  const midMc = Math.floor(mcPlans.length / 2);
  const midDc = Math.floor(discordPlans.length / 2);

  return (
    <main className="bg-[#0f1219] min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden pt-32 pb-16">
        <div className="absolute inset-0 -z-10">
          <div className="absolute left-1/4 top-0 h-[500px] w-[600px] rounded-full bg-[#00c98d]/5 blur-[100px]" />
          <div className="absolute right-1/4 bottom-0 h-[400px] w-[500px] rounded-full bg-[#5865F2]/5 blur-[100px]" />
        </div>
        <div className="mx-auto max-w-3xl px-4 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#00c98d]">Store</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
            Choose Your{" "}
            <span className="bg-gradient-to-r from-[#00c98d] to-[#4dd9ae] bg-clip-text text-transparent">
              Hosting Plan
            </span>
          </h1>
          <p className="mt-4 text-lg text-[#8b92a8]">
            Enterprise hardware, instant deployment, no hidden fees. Pick a plan and go live in under 60 seconds.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-24 space-y-20">

        {/* ── Minecraft ── */}
        {mcPlans.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#00c98d]/10">
                <Server className="h-5 w-5 text-[#00c98d]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Minecraft Server Hosting</h2>
                <p className="text-sm text-[#8b92a8]">NVMe SSD · DDoS protection · Deploy in 60 seconds</p>
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {mcPlans.map((plan, i) => (
                <PlanCard key={plan.id} plan={plan as Plan} accent={mcAccent} popular={i === midMc} />
              ))}
            </div>
          </section>
        )}

        {/* ── Discord Bot ── */}
        {discordPlans.length > 0 && (
          <section>
            <div className="flex items-center gap-3 mb-8">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5865F2]/10">
                <Bot className="h-5 w-5 text-[#5865F2]" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Discord Bot Hosting</h2>
                <p className="text-sm text-[#8b92a8]">Node.js · Python · Always-on uptime</p>
              </div>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {discordPlans.map((plan, i) => (
                <PlanCard key={plan.id} plan={plan as Plan} accent={discordAccent} popular={i === midDc} />
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {mcPlans.length === 0 && discordPlans.length === 0 && (
          <div className="flex flex-col items-center py-24 text-center">
            <Server className="h-16 w-16 text-[#8b92a8] mb-4" />
            <p className="text-xl font-bold text-white">Plans coming soon</p>
            <p className="mt-2 text-[#8b92a8]">Check back shortly or join our Discord for updates.</p>
          </div>
        )}
      </div>
    </main>
  );
}
