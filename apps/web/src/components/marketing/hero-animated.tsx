"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Zap, Shield, Globe, Users, Clock, Gamepad2, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

const WORDS = ["MINECRAFT", "GAME SERVER", "MODPACK", "COMMUNITY"];

export function HeroAnimated() {
  const [wordIdx, setWordIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    const word = WORDS[wordIdx];
    let timeout: ReturnType<typeof setTimeout>;

    if (!deleting && displayed.length < word.length) {
      timeout = setTimeout(() => setDisplayed(word.slice(0, displayed.length + 1)), 60);
    } else if (!deleting && displayed.length === word.length) {
      timeout = setTimeout(() => setDeleting(true), 1800);
    } else if (deleting && displayed.length > 0) {
      timeout = setTimeout(() => setDisplayed(word.slice(0, displayed.length - 1)), 35);
    } else if (deleting && displayed.length === 0) {
      setDeleting(false);
      setWordIdx((i) => (i + 1) % WORDS.length);
    }

    return () => clearTimeout(timeout);
  }, [displayed, deleting, wordIdx, mounted]);

  const stats = [
    { icon: Shield, label: "DDoS Protected", value: "Enterprise", color: "text-[#00c98d]", bg: "bg-[#00c98d]/15" },
    { icon: Globe, label: "Global Nodes", value: "Low Latency", color: "text-[#00c98d]", bg: "bg-[#00c98d]/15" },
    { icon: Clock, label: "Uptime SLA", value: "99.9%", color: "text-yellow-400", bg: "bg-yellow-400/15" },
    { icon: Users, label: "Active Servers", value: "1,000+", color: "text-purple-400", bg: "bg-purple-400/15" },
  ];

  return (
    <section className="relative overflow-hidden bg-[#0d1117]">
      {/* Background */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-0 h-[700px] w-[900px] -translate-x-1/2 -translate-y-1/4 rounded-full bg-[#00c98d]/12 blur-[140px]" />
        <div className="absolute right-0 top-1/3 h-[400px] w-[400px] rounded-full bg-[#00c98d]/6 blur-[100px]" />
        <div className="absolute left-0 bottom-0 h-[350px] w-[350px] rounded-full bg-[#00c98d]/5 blur-[100px]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.018)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:72px_72px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 pb-20 pt-24 sm:px-6 sm:pb-28 sm:pt-32 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div
            className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#00c98d]/30 bg-[#00c98d]/10 px-4 py-1.5 opacity-0 animate-[fadeDown_0.6s_0.1s_ease_forwards]"
          >
            <Zap className="h-3.5 w-3.5 text-[#00c98d]" />
            <span className="text-sm font-semibold text-[#00c98d]">Instant Setup — Live in Under 60 Seconds</span>
          </div>

          {/* Headline with typewriter */}
          <h1
            className="text-5xl font-black tracking-tight text-white sm:text-6xl lg:text-[80px] lg:leading-[1.05] opacity-0 animate-[fadeDown_0.6s_0.25s_ease_forwards]"
          >
            <span className="bg-gradient-to-r from-[#00c98d] via-[#4dd9ae] to-[#00e0a0] bg-clip-text text-transparent">
              {mounted ? displayed : WORDS[0]}
            </span>
            <span className="animate-pulse text-[#00c98d]">|</span>
            <br />
            <span className="text-white">SERVER HOSTING</span>
            <br />
            <span className="text-white/80">DONE RIGHT</span>
          </h1>

          <p
            className="mx-auto mt-7 max-w-2xl text-lg leading-relaxed text-[#a8b0c4] sm:text-xl opacity-0 animate-[fadeDown_0.6s_0.4s_ease_forwards]"
          >
            Deploy your game server instantly with enterprise-grade hardware,
            DDoS protection, and 24/7 expert support. Built for performance,
            designed for gamers.
          </p>

          <div
            className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row opacity-0 animate-[fadeDown_0.6s_0.55s_ease_forwards]"
          >
            <Link href="/#pricing">
              <Button
                size="lg"
                className="h-12 bg-[#00c98d] px-10 text-base font-bold text-white shadow-lg shadow-[#00c98d]/30 hover:bg-[#00e0a0] hover:text-white hover:shadow-[#00c98d]/40 transition-all"
              >
                <Gamepad2 className="mr-2 h-5 w-5" />
                View Plans
              </Button>
            </Link>
            <Link href="/#features">
              <Button
                variant="outline"
                size="lg"
                className="h-12 border-white/15 bg-white/[0.04] px-10 text-base text-white hover:bg-white/[0.08] hover:text-white hover:border-white/25 transition-all"
              >
                View All Features <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className="group flex flex-col items-center gap-2 rounded-xl border border-white/[0.10] bg-[#161b27] p-5 opacity-0 cursor-default transition-all duration-300 hover:-translate-y-1 hover:border-[#00c98d]/30 hover:bg-[#1a2035] hover:shadow-lg hover:shadow-[#00c98d]/10"
                style={{ animation: `fadeUp 0.5s ${0.65 + i * 0.1}s ease forwards` }}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bg} transition-transform duration-300 group-hover:scale-110`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
                <span className="text-lg font-bold text-white">{stat.value}</span>
                <span className="text-xs font-medium text-[#8b92a8] group-hover:text-[#a8b0c4] transition-colors">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </section>
  );
}
