import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { Users, Zap, Shield, Heart } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "About Us" };

const values = [
  { icon: Zap, title: "Performance First", desc: "We obsess over hardware specs, network quality, and software tuning so your players get zero-lag gameplay." },
  { icon: Shield, title: "Always Secure", desc: "Enterprise DDoS mitigation, encrypted backups, and proactive monitoring on every single server we host." },
  { icon: Heart, title: "Gamer-Built", desc: "Our team are gamers ourselves. We know what matters because we've felt the pain of bad hosting firsthand." },
  { icon: Users, title: "Community Focused", desc: "We've helped thousands of communities grow. Your success is literally our business model." },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#0d1117]">
        <section className="relative overflow-hidden border-b border-white/[0.05] py-20 sm:py-28">
          <div className="absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-[#00c98d]/8 blur-[120px]" />
          </div>
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#00c98d]">Our Story</p>
            <h1 className="mt-4 text-4xl font-black text-white sm:text-5xl">
              Built by Gamers,{" "}
              <span className="bg-gradient-to-r from-[#00c98d] to-[#4dd9ae] bg-clip-text text-transparent">
                for Gamers
              </span>
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-[#a8b0c4]">
              PobbleHost was founded with one mission: give every gamer access to the kind of server infrastructure that was previously only available to large studios and enterprises. We started small, grew fast, and never lost sight of why we exist — to make your gaming community thrive.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-14">
            <h2 className="text-3xl font-bold text-white">Our Values</h2>
            <p className="mt-4 text-[#a8b0c4]">Everything we build is grounded in these principles.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            {values.map((v) => (
              <div key={v.title} className="rounded-xl border border-white/[0.07] bg-[#131720] p-7 transition-all hover:border-[#00c98d]/25 hover:bg-[#181d2e]">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#00c98d]/10">
                  <v.icon className="h-5 w-5 text-[#00c98d]" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-white">{v.title}</h3>
                <p className="mt-2 text-[#a8b0c4] leading-relaxed">{v.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-white/[0.05] py-20">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <div className="grid grid-cols-3 gap-8">
              {[
                { value: "1,000+", label: "Active Servers" },
                { value: "99.9%", label: "Uptime SLA" },
                { value: "24/7", label: "Support Hours" },
              ].map((s) => (
                <div key={s.label}>
                  <p className="text-4xl font-black text-[#00c98d]">{s.value}</p>
                  <p className="mt-1 text-sm text-[#8b92a8]">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
