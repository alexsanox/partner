import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Service Level Agreement" };

const credits = [
  { downtime: "0% – 0.1%", credit: "None" },
  { downtime: "0.1% – 1%", credit: "10% of monthly fee" },
  { downtime: "1% – 5%", credit: "25% of monthly fee" },
  { downtime: "5% – 10%", credit: "50% of monthly fee" },
  { downtime: "> 10%", credit: "100% of monthly fee" },
];

export default function SLAPage() {
  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#0d1117]">
        <section className="border-b border-white/[0.05] py-16">
          <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#00c98d]">Legal</p>
            <h1 className="mt-3 text-4xl font-black text-white">Service Level Agreement</h1>
            <p className="mt-3 text-sm text-[#8b92a8]">Last updated: May 12, 2026</p>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-4 py-14 sm:px-6 lg:px-8 space-y-10 text-[#a8b0c4]">
          {[
            {
              title: "1. Uptime Commitment",
              body: "PobbleHost guarantees 99.9% monthly uptime for all game server plans. Uptime is calculated as the total minutes in a calendar month minus unplanned downtime minutes, divided by total minutes in the month.",
            },
            {
              title: "2. Exclusions",
              body: "The SLA does not apply to downtime caused by scheduled maintenance (announced at least 24 hours in advance), customer-initiated actions, DDoS attacks exceeding the capacity of our mitigation systems, force majeure events, or third-party services outside our control.",
            },
            {
              title: "3. Service Credits",
              body: "If uptime falls below 99.9% in any calendar month, affected customers are entitled to service credits as follows:",
            },
            {
              title: "4. Claiming Credits",
              body: "To claim a service credit, contact support@pobble.host within 7 days of the end of the affected month. Include your account email, affected server ID, and the date/time of the outage. Credits are applied to the next invoice and are not redeemable for cash.",
            },
            {
              title: "5. Support Response Times",
              body: "We target the following response times for support tickets: Critical (server down) — 30 minutes; High (major feature impacted) — 2 hours; Normal — 8 hours; Low — 24 hours. Response times are measured from ticket creation to first meaningful response.",
            },
          ].map((s) => (
            <div key={s.title}>
              <h2 className="text-xl font-bold text-white">{s.title}</h2>
              <p className="mt-3 leading-relaxed">{s.body}</p>
              {s.title === "3. Service Credits" && (
                <div className="mt-5 overflow-hidden rounded-xl border border-white/[0.07]">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/[0.07] bg-white/[0.03]">
                        <th className="px-5 py-3 text-left font-semibold text-white">Monthly Downtime</th>
                        <th className="px-5 py-3 text-left font-semibold text-white">Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {credits.map((row, i) => (
                        <tr key={i} className="border-b border-white/[0.04] last:border-0 hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-3 font-mono text-[#a8b0c4]">{row.downtime}</td>
                          <td className="px-5 py-3 font-medium text-[#00c98d]">{row.credit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </section>
      </main>
      <Footer />
    </>
  );
}
