import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "System Status" };

const services = [
  { name: "Game Server Network", status: "Operational", uptime: "99.98%" },
  { name: "Control Panel (Web)", status: "Operational", uptime: "100%" },
  { name: "Billing & Payments", status: "Operational", uptime: "100%" },
  { name: "SFTP File Access", status: "Operational", uptime: "99.95%" },
  { name: "Database Servers", status: "Operational", uptime: "99.99%" },
  { name: "DDoS Mitigation", status: "Operational", uptime: "100%" },
  { name: "Backup System", status: "Operational", uptime: "99.97%" },
  { name: "Support Chat", status: "Operational", uptime: "100%" },
];

const statusColor: Record<string, { dot: string; text: string; badge: string }> = {
  Operational: { dot: "bg-green-400", text: "text-green-400", badge: "bg-green-400/10 text-green-400" },
  Degraded: { dot: "bg-yellow-400 animate-pulse", text: "text-yellow-400", badge: "bg-yellow-400/10 text-yellow-400" },
  Outage: { dot: "bg-red-400 animate-pulse", text: "text-red-400", badge: "bg-red-400/10 text-red-400" },
};

export default function StatusPage() {
  const allGood = services.every((s) => s.status === "Operational");

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#0d1117]">
        <section className="relative overflow-hidden border-b border-white/[0.05] py-20 sm:py-24">
          <div className="absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-0 h-[400px] w-[600px] -translate-x-1/2 rounded-full bg-[#00c98d]/8 blur-[100px]" />
          </div>
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#00c98d]">System Status</p>
            <h1 className="mt-4 text-4xl font-black text-white sm:text-5xl">Service Status</h1>
            <div className="mt-6 inline-flex items-center gap-2.5 rounded-full border border-green-400/20 bg-green-400/10 px-5 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-green-400 animate-pulse" />
              <span className="text-base font-bold text-green-400">
                {allGood ? "All Systems Operational" : "Some Systems Disrupted"}
              </span>
            </div>
            <p className="mt-4 text-sm text-[#8b92a8]">Last updated: {new Date().toUTCString()}</p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
          <div className="space-y-2">
            {services.map((s) => {
              const c = statusColor[s.status] ?? statusColor.Operational;
              return (
                <div key={s.name} className="flex items-center justify-between rounded-xl border border-white/[0.07] bg-[#131720] px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} />
                    <span className="font-medium text-white">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-[#8b92a8]">{s.uptime} uptime</span>
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-bold ${c.badge}`}>{s.status}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Uptime chart placeholder */}
          <div className="mt-10 rounded-xl border border-white/[0.07] bg-[#131720] p-6">
            <p className="text-sm font-semibold text-white mb-4">90-Day Uptime</p>
            <div className="flex gap-0.5">
              {Array.from({ length: 90 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-sm bg-green-400/70 hover:bg-green-400 transition-colors cursor-default"
                  style={{ height: 28 }}
                  title={`Day ${90 - i}: Operational`}
                />
              ))}
            </div>
            <div className="mt-2 flex justify-between text-xs text-[#8b92a8]">
              <span>90 days ago</span>
              <span>Today</span>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
