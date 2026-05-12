import {
  Zap,
  Shield,
  Cpu,
  HardDrive,
  Globe,
  Headphones,
  ArrowUpCircle,
  Clock,
  Wrench,
  Terminal,
} from "lucide-react";
import { PanelMockup } from "./panel-mockup";

const features = [
  {
    icon: Zap,
    title: "Instant Setup",
    description:
      "Start hosting in seconds after purchasing your game server. No waiting around.",
    color: "text-yellow-400",
    borderColor: "border-yellow-500/20",
    bg: "bg-yellow-400/10",
  },
  {
    icon: Clock,
    title: "99% Uptime",
    description:
      "That's not a typo. All network outages are covered by our SLA.",
    color: "text-emerald-400",
    borderColor: "border-emerald-500/20",
    bg: "bg-emerald-400/10",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description:
      "Our support team is available around-the-clock to assist you with any issue.",
    color: "text-pink-400",
    borderColor: "border-pink-500/20",
    bg: "bg-pink-400/10",
  },
  {
    icon: Shield,
    title: "DDoS Protection",
    description:
      "We guarantee full protection against DDoS attacks under our SLA.",
    color: "text-[#00c98d]",
    borderColor: "border-[#00c98d]/20",
    bg: "bg-blue-400/10",
  },
  {
    icon: Globe,
    title: "Free Subdomain",
    description:
      "Get a custom IP address for free using our subdomain creator.",
    color: "text-cyan-400",
    borderColor: "border-cyan-500/20",
    bg: "bg-cyan-400/10",
  },
  {
    icon: Cpu,
    title: "High-Performance Hardware",
    description:
      "Latest-gen AMD Ryzen processors and NVMe SSDs for zero-lag gameplay.",
    color: "text-purple-400",
    borderColor: "border-purple-500/20",
    bg: "bg-purple-400/10",
  },
];

const detailFeatures = [
  {
    icon: Terminal,
    title: "Full Console Access",
    description: "Real-time server console with command execution and log streaming.",
  },
  {
    icon: Wrench,
    title: "Modpack Installer",
    description: "One-click installation for hundreds of popular modpacks and plugins.",
  },
  {
    icon: HardDrive,
    title: "NVMe Storage",
    description: "Ultra-fast NVMe drives ensure instant chunk loading and world saves.",
  },
  {
    icon: ArrowUpCircle,
    title: "One-Click Upgrades",
    description: "Scale your server instantly. Upgrade RAM, storage, or player slots with zero downtime.",
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-20 sm:py-28">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-0 top-1/3 h-[500px] w-[500px] rounded-full bg-[#00c98d]/5 blur-[100px]" />
        <div className="absolute right-0 bottom-1/3 h-[400px] w-[400px] rounded-full bg-purple-600/5 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#00c98d]">
            Exclusive Features
          </p>
          <h2 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-[#00c98d] to-[#4dd9ae] bg-clip-text text-transparent">
              Dominate
            </span>
          </h2>
          <p className="mt-4 text-lg text-[#a8b0c4]">
            We offer a wide variety of features that enhance your gaming
            experience and provide the most powerful hardware at the best price.
          </p>
        </div>

        {/* Feature grid */}
        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className={`group relative rounded-xl border ${feature.borderColor} bg-[#131720] p-6 transition-all hover:bg-[#181d2e] hover:border-white/15`}
            >
              <div className="flex items-start gap-4">
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${feature.bg}`}>
                  <feature.icon className={`h-5 w-5 ${feature.color}`} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">{feature.title}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[#8b92a8]">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Control Panel showcase */}
        <div className="mt-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#00c98d]">
              Control Panel
            </p>
            <h3 className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Powerful &amp; Easy to{" "}
              <span className="bg-gradient-to-r from-[#00c98d] to-[#4dd9ae] bg-clip-text text-transparent">
                Use
              </span>
            </h3>
            <p className="mt-4 text-lg text-[#a8b0c4]">
              Our panel has all the features you need and more. Get a new
              server today and discover them all.
            </p>
          </div>

          <div className="mt-12">
            <PanelMockup />
          </div>
        </div>

        {/* Detail features row */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {detailFeatures.map((f) => (
            <div key={f.title} className="rounded-xl border border-white/[0.06] bg-[#131720] p-6 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#00c98d]/10">
                <f.icon className="h-5 w-5 text-[#00c98d]" />
              </div>
              <h4 className="mt-4 text-sm font-bold text-white">{f.title}</h4>
              <p className="mt-2 text-sm leading-relaxed text-[#8b92a8]">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
