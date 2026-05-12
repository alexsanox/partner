import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { Briefcase, MapPin, Clock } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Careers" };

export default function CareersPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#0d1117]">
        <section className="relative overflow-hidden border-b border-white/[0.05] py-20 sm:py-28">
          <div className="absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-[#00c98d]/8 blur-[100px]" />
          </div>
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#00c98d]">Careers</p>
            <h1 className="mt-4 text-4xl font-black text-white sm:text-5xl">
              Join the{" "}
              <span className="bg-gradient-to-r from-[#00c98d] to-[#4dd9ae] bg-clip-text text-transparent">
                Team
              </span>
            </h1>
            <p className="mt-5 text-lg text-[#a8b0c4]">
              We&apos;re a small, remote-first team building the best game server hosting platform on the internet. If you love games and great infrastructure, we want to hear from you.
            </p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8 text-center">
          <div className="rounded-2xl border border-white/[0.07] bg-[#131720] p-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#00c98d]/10">
              <Briefcase className="h-8 w-8 text-[#00c98d]" />
            </div>
            <h2 className="mt-6 text-2xl font-bold text-white">No Open Positions Right Now</h2>
            <p className="mt-3 text-[#a8b0c4] leading-relaxed">
              We don&apos;t have any open roles at the moment, but we&apos;re always interested in hearing from talented people. Send your CV and a note to{" "}
              <a href="mailto:careers@pobble.host" className="text-[#00c98d] hover:underline">
                careers@pobble.host
              </a>
              .
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4 text-sm text-[#8b92a8]">
              {[
                { icon: MapPin, label: "Remote-first" },
                { icon: Clock, label: "Flexible hours" },
                { icon: Briefcase, label: "Competitive pay" },
              ].map((p) => (
                <div key={p.label} className="flex items-center gap-1.5">
                  <p.icon className="h-4 w-4 text-[#00c98d]" />
                  {p.label}
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
