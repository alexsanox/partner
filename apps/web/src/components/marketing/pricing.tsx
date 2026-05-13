import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Dirt",
    slug: "dirt",
    ram: "2 GB",
    price: 3,
    players: "10",
    storage: "10 GB NVMe",
    cpu: "100%",
    popular: false,
    accent: "from-amber-700 to-amber-500",
    accentText: "text-amber-400",
    accentBg: "bg-amber-500/10",
    accentBorder: "border-amber-500/30",
    accentGlow: "shadow-amber-500/10",
    checkColor: "text-amber-400",
    description: "A humble start — perfect for playing with a few friends",
    features: [
      "2 GB DDR5 RAM",
      "10 Player Slots",
      "10 GB NVMe SSD",
      "1 Backup Slot",
      "DDoS Protection",
      "24/7 Support",
    ],
  },
  {
    name: "Iron",
    slug: "iron",
    ram: "4 GB",
    price: 8,
    players: "30",
    storage: "25 GB NVMe",
    cpu: "200%",
    popular: true,
    accent: "from-slate-400 to-slate-200",
    accentText: "text-slate-300",
    accentBg: "bg-slate-400/10",
    accentBorder: "border-[#00c98d]/40",
    accentGlow: "shadow-[#00c98d]/20",
    checkColor: "text-[#00c98d]",
    description: "Solid and reliable — built for growing communities",
    features: [
      "4 GB DDR5 RAM",
      "30 Player Slots",
      "25 GB NVMe SSD",
      "3 Backup Slots",
      "DDoS Protection",
      "Priority Support",
      "1 MySQL Database",
    ],
  },
  {
    name: "Diamond",
    slug: "diamond",
    ram: "8 GB",
    price: 20,
    players: "100",
    storage: "50 GB NVMe",
    cpu: "400%",
    popular: false,
    accent: "from-cyan-400 to-cyan-300",
    accentText: "text-cyan-400",
    accentBg: "bg-cyan-400/10",
    accentBorder: "border-cyan-500/30",
    accentGlow: "shadow-cyan-500/10",
    checkColor: "text-cyan-400",
    description: "Maximum power for large networks and serious players",
    features: [
      "8 GB DDR5 RAM",
      "100 Player Slots",
      "50 GB NVMe SSD",
      "5 Backup Slots",
      "DDoS Protection",
      "Priority Support",
      "Custom Domain",
    ],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative py-20 sm:py-28">
      <div className="absolute inset-0 -z-10">
        <div className="absolute right-1/4 top-0 h-[500px] w-[600px] rounded-full bg-[#00c98d]/5 blur-[100px]" />
        <div className="absolute left-1/4 bottom-0 h-[400px] w-[500px] rounded-full bg-cyan-600/5 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#00c98d]">
            Pricing
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Choose Your{" "}
            <span className="bg-gradient-to-r from-[#00c98d] to-[#4dd9ae] bg-clip-text text-transparent">
              Tier
            </span>
          </h2>
          <p className="mt-4 text-lg text-[#a8b0c4]">
            No hidden fees. No surprise charges. Pick a plan and start playing
            in under 60 seconds.
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.slug}
              className={cn(
                "group relative flex flex-col overflow-hidden rounded-2xl border bg-[#131720] transition-all duration-300 hover:scale-[1.02] hover:bg-[#181d2e]",
                plan.popular
                  ? `${plan.accentBorder} shadow-xl ${plan.accentGlow}`
                  : "border-white/[0.07] hover:border-white/12"
              )}
            >
              {/* Colored top accent bar */}
              <div className={`h-1 w-full bg-gradient-to-r ${plan.accent}`} />

              {plan.popular && (
                <div className="absolute right-4 top-5">
                  <Badge className="border-0 bg-[#00c98d] text-xs font-bold text-white shadow-lg shadow-[#00c98d]/30 hover:bg-[#00c98d]">
                    <Zap className="mr-1 h-3 w-3" />
                    Most Popular
                  </Badge>
                </div>
              )}

              {/* Header */}
              <div className="p-6 pb-0">
                {/* Plan name + RAM badge */}
                <div className="flex items-center gap-3">
                  <h3 className={`text-lg font-bold ${plan.accentText}`}>
                    {plan.name}
                  </h3>
                  <span className={`rounded-md ${plan.accentBg} px-2 py-0.5 text-xs font-semibold ${plan.accentText}`}>
                    {plan.ram} RAM
                  </span>
                </div>
                <p className="mt-1.5 text-sm text-[#8b92a8]">
                  {plan.description}
                </p>

                {/* Price */}
                <div className="mt-5 flex items-baseline gap-1">
                  <span className="text-4xl sm:text-5xl font-black tracking-tight text-white">
                    ${plan.price}
                  </span>
                  <span className="text-base text-[#8b92a8]">/mo</span>
                </div>

                {/* Quick stats */}
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { label: "Players", value: plan.players },
                    { label: "Storage", value: plan.storage.replace(" NVMe", "") },
                    { label: "CPU", value: plan.cpu },
                  ].map((stat) => (
                    <div
                      key={stat.label}
                      className="rounded-lg bg-white/[0.03] px-3 py-2 text-center"
                    >
                      <div className="text-sm font-bold text-white">{stat.value}</div>
                      <div className="text-[10px] uppercase tracking-wider text-[#8b92a8]">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="mx-6 mt-5 border-t border-white/5" />

              {/* Features */}
              <div className="flex flex-1 flex-col p-6">
                <ul className="flex-1 space-y-2.5">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-center gap-2.5 text-sm text-[#c8cdd8]"
                    >
                      <Check className={`h-4 w-4 shrink-0 ${plan.checkColor}`} />
                      {feature}
                    </li>
                  ))}
                </ul>

                <Link href="/register" className="mt-6 block">
                  <Button
                    className={cn(
                      "w-full h-11 font-semibold transition-all",
                      plan.popular
                        ? "bg-[#00c98d] text-white shadow-lg shadow-[#00c98d]/30 hover:bg-[#00e0a0] hover:text-white hover:shadow-[#00c98d]/40"
                        : "bg-white/[0.06] text-white hover:bg-white/10 border border-white/[0.08]"
                    )}
                  >
                    {plan.popular && <Sparkles className="mr-2 h-4 w-4" />}
                    Get Started
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
