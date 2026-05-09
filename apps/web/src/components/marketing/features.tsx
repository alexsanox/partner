import { Card, CardContent } from "@/components/ui/card";
import {
  Zap,
  Shield,
  Cpu,
  HardDrive,
  Globe,
  Headphones,
  ArrowUpCircle,
  Clock,
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Instant Deployment",
    description:
      "Your Minecraft server is online in under 60 seconds. No waiting, no manual setup.",
    color: "text-yellow-400",
    bg: "bg-yellow-400/10",
  },
  {
    icon: Cpu,
    title: "High-Performance Hardware",
    description:
      "Powered by latest-gen AMD Ryzen processors and NVMe SSDs for zero-lag gameplay.",
    color: "text-blue-400",
    bg: "bg-blue-400/10",
  },
  {
    icon: Shield,
    title: "DDoS Protection",
    description:
      "Enterprise-grade DDoS mitigation keeps your server online no matter what.",
    color: "text-green-400",
    bg: "bg-green-400/10",
  },
  {
    icon: HardDrive,
    title: "NVMe Storage",
    description:
      "Ultra-fast NVMe drives ensure instant chunk loading and world saves.",
    color: "text-purple-400",
    bg: "bg-purple-400/10",
  },
  {
    icon: Globe,
    title: "Global Network",
    description:
      "Multiple server locations worldwide for the lowest latency possible.",
    color: "text-cyan-400",
    bg: "bg-cyan-400/10",
  },
  {
    icon: Headphones,
    title: "24/7 Expert Support",
    description:
      "Our Minecraft experts are available around the clock to help you.",
    color: "text-pink-400",
    bg: "bg-pink-400/10",
  },
  {
    icon: ArrowUpCircle,
    title: "One-Click Upgrades",
    description:
      "Scale your server instantly. Upgrade RAM, storage, or player slots with zero downtime.",
    color: "text-orange-400",
    bg: "bg-orange-400/10",
  },
  {
    icon: Clock,
    title: "99.9% Uptime SLA",
    description:
      "We guarantee your server stays online with our industry-leading uptime commitment.",
    color: "text-emerald-400",
    bg: "bg-emerald-400/10",
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-20 sm:py-28">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-0 top-1/2 h-[400px] w-[400px] -translate-y-1/2 rounded-full bg-blue-600/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Everything You Need to{" "}
            <span className="text-blue-400">Dominate</span>
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            Enterprise-grade infrastructure built specifically for Minecraft
            servers. No compromises.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group border-white/5 bg-white/[0.02] transition-all hover:border-white/10 hover:bg-white/[0.04]"
            >
              <CardContent className="p-6">
                <div
                  className={`mb-4 flex h-10 w-10 items-center justify-center rounded-lg ${feature.bg}`}
                >
                  <feature.icon className={`h-5 w-5 ${feature.color}`} />
                </div>
                <h3 className="text-base font-semibold text-white">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-400">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
