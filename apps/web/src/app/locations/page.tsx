import { Navbar } from "@/components/marketing/navbar";
import { Footer } from "@/components/marketing/footer";
import { WorldMap } from "@/components/marketing/world-map";
import { Globe, Zap, Shield } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Server Locations" };

const locations = [
  { city: "Frankfurt",    country: "Germany",        flag: "🇩🇪", region: "Europe",        ping: "~8ms",  status: "Online", x: 483, y: 92  },
  { city: "London",       country: "United Kingdom", flag: "🇬🇧", region: "Europe",        ping: "~12ms", status: "Online", x: 446, y: 82  },
  { city: "New York",     country: "United States",  flag: "🇺🇸", region: "North America", ping: "~18ms", status: "Online", x: 168, y: 138 },
  { city: "Dallas",       country: "United States",  flag: "🇺🇸", region: "North America", ping: "~22ms", status: "Online", x: 152, y: 175 },
  { city: "Los Angeles",  country: "United States",  flag: "🇺🇸", region: "North America", ping: "~28ms", status: "Online", x: 118, y: 165 },
  { city: "Singapore",    country: "Singapore",      flag: "🇸🇬", region: "Asia Pacific",  ping: "~15ms", status: "Online", x: 692, y: 192 },
  { city: "Sydney",       country: "Australia",      flag: "🇦🇺", region: "Asia Pacific",  ping: "~20ms", status: "Online", x: 790, y: 355 },
  { city: "Tokyo",        country: "Japan",          flag: "🇯🇵", region: "Asia Pacific",  ping: "~10ms", status: "Online", x: 782, y: 118 },
];

const regions = ["All", "Europe", "North America", "Asia Pacific"];

export default function LocationsPage() {
  const grouped = regions.slice(1).map((r) => ({
    region: r,
    nodes: locations.filter((l) => l.region === r),
  }));

  return (
    <>
      <Navbar />
      <main className="flex-1 bg-[#0d1117]">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-white/[0.05] py-20 sm:py-28">
          <div className="absolute inset-0 -z-10">
            <div className="absolute left-1/2 top-0 h-[500px] w-[700px] -translate-x-1/2 rounded-full bg-[#00c98d]/8 blur-[120px]" />
          </div>
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#00c98d]/30 bg-[#00c98d]/10 px-4 py-1.5">
              <Globe className="h-3.5 w-3.5 text-[#00c98d]" />
              <span className="text-sm font-semibold text-[#00c98d]">Global Infrastructure</span>
            </div>
            <h1 className="text-4xl font-black text-white sm:text-5xl">
              Server{" "}
              <span className="bg-gradient-to-r from-[#00c98d] to-[#4dd9ae] bg-clip-text text-transparent">
                Locations
              </span>
            </h1>
            <p className="mt-5 text-lg text-[#a8b0c4]">
              Choose from {locations.length} datacenter locations worldwide. All nodes feature enterprise-grade hardware, redundant networking, and DDoS protection.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-6">
              {[
                { icon: Globe, label: `${locations.length} Locations` },
                { icon: Zap, label: "Low Latency" },
                { icon: Shield, label: "DDoS Protected" },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2 text-sm font-medium text-[#a8b0c4]">
                  <s.icon className="h-4 w-4 text-[#00c98d]" />
                  {s.label}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* World map */}
        <section className="mx-auto max-w-7xl px-4 py-12 pb-0 sm:px-6 lg:px-8">
          <WorldMap locations={locations} />
        </section>

        {/* Locations grid */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          {grouped.map(({ region, nodes }) => (
            <div key={region} className="mb-14">
              <h2 className="mb-6 text-lg font-bold text-white">{region}</h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {nodes.map((loc) => (
                  <div
                    key={loc.city}
                    className="group rounded-xl border border-white/[0.07] bg-[#131720] p-5 transition-all hover:-translate-y-0.5 hover:border-[#00c98d]/25 hover:bg-[#181d2e] hover:shadow-lg hover:shadow-[#00c98d]/8"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{loc.flag}</span>
                        <div>
                          <p className="font-bold text-white">{loc.city}</p>
                          <p className="text-sm text-[#8b92a8]">{loc.country}</p>
                        </div>
                      </div>
                      <span className="flex items-center gap-1.5 rounded-full bg-green-400/10 px-2.5 py-0.5 text-xs font-semibold text-green-400">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
                        {loc.status}
                      </span>
                    </div>
                    <div className="mt-4 flex items-center gap-2 rounded-lg bg-white/[0.03] px-3 py-2">
                      <Zap className="h-3.5 w-3.5 text-[#00c98d]" />
                      <span className="text-xs text-[#a8b0c4]">Avg. ping: <span className="font-bold text-white">{loc.ping}</span></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </section>
      </main>
      <Footer />
    </>
  );
}
