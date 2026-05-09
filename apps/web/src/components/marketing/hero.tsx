import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Zap, Shield, Globe } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-600/10 blur-3xl" />
        <div className="absolute right-0 top-1/3 h-[400px] w-[400px] rounded-full bg-purple-600/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 sm:pb-28 sm:pt-32 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <Badge
            variant="outline"
            className="mb-6 border-blue-500/30 bg-blue-500/10 px-3 py-1.5 text-blue-300"
          >
            <Zap className="mr-1.5 h-3 w-3" />
            Instant Setup — Your Server in Under 60 Seconds
          </Badge>

          <h1 className="text-4xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl">
            Premium{" "}
            <span className="bg-gradient-to-r from-blue-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              Minecraft
            </span>{" "}
            Server Hosting
          </h1>

          <p className="mt-6 text-lg leading-relaxed text-slate-400 sm:text-xl">
            Deploy your Minecraft server instantly with enterprise-grade
            hardware, DDoS protection, and 24/7 expert support. Built for
            performance, designed for gamers.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link href="/#pricing">
              <Button
                size="lg"
                className="h-12 bg-blue-600 px-8 text-base font-semibold text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500 hover:shadow-blue-600/40 transition-all"
              >
                <Zap className="mr-2 h-4 w-4" />
                View Plans — From $2.99/mo
              </Button>
            </Link>
            <Link href="/#features">
              <Button
                variant="outline"
                size="lg"
                className="h-12 border-white/10 px-8 text-base text-slate-300 hover:bg-white/5 hover:text-white"
              >
                Learn More
              </Button>
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-slate-500">
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-green-400" />
              <span>DDoS Protected</span>
            </div>
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-400" />
              <span>Global Network</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              <span>99.9% Uptime SLA</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
