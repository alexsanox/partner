import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Shield, Globe, Users, Clock, Gamepad2 } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[800px] w-[1000px] -translate-x-1/2 -translate-y-1/3 rounded-full bg-[#00c98d]/8 blur-[120px]" />
        <div className="absolute right-0 top-1/4 h-[500px] w-[500px] rounded-full bg-purple-600/5 blur-[100px]" />
        <div className="absolute left-0 bottom-0 h-[400px] w-[400px] rounded-full bg-emerald-600/5 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-16 pt-20 sm:px-6 sm:pb-24 sm:pt-28 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          <Badge
            variant="outline"
            className="mb-8 border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-emerald-300"
          >
            <Zap className="mr-1.5 h-3.5 w-3.5" />
            Instant Setup — Your Server in Under 60 Seconds
          </Badge>

          <h1 className="text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl">
            MINECRAFT{" "}
            <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-blue-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">
              SERVER HOSTING
            </span>
            <br className="hidden sm:block" />
            <span className="text-slate-300">AND MORE</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-400 sm:text-xl">
            Deploy your Minecraft server instantly with enterprise-grade
            hardware, DDoS protection, and 24/7 expert support. Built for
            performance, designed for gamers.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/#pricing">
              <Button
                size="lg"
                className="h-13 bg-emerald-600 px-10 text-base font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-500 hover:shadow-emerald-600/40 transition-all"
              >
                <Gamepad2 className="mr-2 h-5 w-5" />
                View Minecraft Plans
              </Button>
            </Link>
            <Link href="/#features">
              <Button
                variant="outline"
                size="lg"
                className="h-13 border-white/10 px-10 text-base text-slate-300 hover:bg-white/5 hover:text-white"
              >
                View All Features
              </Button>
            </Link>
          </div>

          {/* Stats row */}
          <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { icon: Shield, label: "DDoS Protected", value: "Enterprise", color: "text-green-400", bg: "bg-green-400/10" },
              { icon: Globe, label: "Global Locations", value: "Low Latency", color: "text-[#00c98d]", bg: "bg-blue-400/10" },
              { icon: Clock, label: "Uptime SLA", value: "99.9%", color: "text-yellow-400", bg: "bg-yellow-400/10" },
              { icon: Users, label: "Active Servers", value: "1,000+", color: "text-purple-400", bg: "bg-purple-400/10" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="flex flex-col items-center gap-2 rounded-xl border border-white/5 bg-white/[0.02] p-4 backdrop-blur-sm"
              >
                <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${stat.bg}`}>
                  <stat.icon className={`h-4 w-4 ${stat.color}`} />
                </div>
                <span className="text-lg font-bold text-white">{stat.value}</span>
                <span className="text-xs text-slate-500">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
