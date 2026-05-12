import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { MessageCircle, BookOpen, Mail, Zap } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Support" };

const faqs = [
  { q: "How do I connect to my server?", a: "Use the IP address shown in your control panel. It follows the format ip:port. Copy it and paste into Minecraft's multiplayer menu." },
  { q: "How do I upload my existing world?", a: "Use the File Manager in your control panel or connect via SFTP and upload your world folder to /home/container/world." },
  { q: "How do I install a modpack?", a: "Go to the Mods & Plugins tab in your server control panel and use the one-click modpack installer, or upload a .mrpack file." },
  { q: "My server won't start — what do I do?", a: "Check the console tab for errors. Common causes are insufficient RAM, a corrupt world, or a missing mod dependency." },
  { q: "How do I add an admin/op?", a: "In the console tab, type: op YourUsername and press Enter. You can also edit ops.json via the File Manager." },
];

export default function SupportPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#0d1117]">
        <section className="relative overflow-hidden border-b border-white/[0.05] py-20 sm:py-28">
          <div className="absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-[#00c98d]/8 blur-[100px]" />
          </div>
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#00c98d]">Support</p>
            <h1 className="mt-4 text-4xl font-black text-white sm:text-5xl">Help Center</h1>
            <p className="mt-5 text-lg text-[#a8b0c4]">We&apos;re available 24/7. Pick the channel that works best for you.</p>
          </div>
        </section>

        {/* Contact options */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="grid gap-5 sm:grid-cols-3">
            {[
              {
                icon: MessageCircle,
                title: "Live Chat",
                desc: "Get an answer in minutes from our support team. Available around the clock.",
                action: "Start Chat",
                href: "#",
                primary: true,
              },
              {
                icon: Mail,
                title: "Email Support",
                desc: "Send a detailed ticket and we'll respond within 2 hours on average.",
                action: "Send Email",
                href: "mailto:support@pobble.host",
                primary: false,
              },
              {
                icon: BookOpen,
                title: "Documentation",
                desc: "Step-by-step guides for setup, mods, plugins, backups, and more.",
                action: "Browse Docs",
                href: "#",
                primary: false,
              },
            ].map((c) => (
              <div key={c.title} className="rounded-xl border border-white/[0.07] bg-[#131720] p-6 flex flex-col">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#00c98d]/10">
                  <c.icon className="h-5 w-5 text-[#00c98d]" />
                </div>
                <h3 className="mt-4 text-lg font-bold text-white">{c.title}</h3>
                <p className="mt-2 flex-1 text-sm text-[#a8b0c4] leading-relaxed">{c.desc}</p>
                <a
                  href={c.href}
                  className={`mt-5 inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-bold transition-colors ${
                    c.primary
                      ? "bg-[#00c98d] text-white hover:bg-[#00e0a0]"
                      : "border border-white/[0.1] text-white hover:bg-white/[0.05]"
                  }`}
                >
                  <Zap className="mr-1.5 h-3.5 w-3.5" /> {c.action}
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6 lg:px-8">
          <h2 className="mb-8 text-2xl font-bold text-white">Common Questions</h2>
          <div className="space-y-3">
            {faqs.map((f) => (
              <details key={f.q} className="group rounded-xl border border-white/[0.07] bg-[#131720] open:border-[#00c98d]/20">
                <summary className="flex cursor-pointer items-center justify-between px-5 py-4 text-sm font-semibold text-white list-none hover:text-[#4dd9ae] transition-colors">
                  {f.q}
                  <span className="ml-4 shrink-0 text-[#8b92a8] transition-transform group-open:rotate-180">▾</span>
                </summary>
                <p className="px-5 pb-4 text-sm leading-relaxed text-[#a8b0c4]">{f.a}</p>
              </details>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
