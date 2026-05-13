import { Navbar } from "@/components/marketing/navbar";
import { HeroAnimated } from "@/components/marketing/hero-animated";
import { Features } from "@/components/marketing/features";
import { Pricing } from "@/components/marketing/pricing";
import { Reviews } from "@/components/marketing/reviews";
import { FAQ } from "@/components/marketing/faq";
import { CTA } from "@/components/marketing/cta";
import { Footer } from "@/components/marketing/footer";
import { WorldMap } from "@/components/marketing/world-map";
import Link from "next/link";
import { Globe } from "lucide-react";

const mapLocations = [
  { city: "Frankfurt",   country: "Germany",        flag: "🇩🇪", region: "Europe",        ping: "~8ms",  status: "Online", lng:  8.68,   lat: 50.12 },
  { city: "London",      country: "United Kingdom", flag: "🇬🇧", region: "Europe",        ping: "~12ms", status: "Online", lng: -0.12,   lat: 51.51 },
  { city: "New York",    country: "United States",  flag: "🇺🇸", region: "North America", ping: "~18ms", status: "Online", lng: -74.00,  lat: 40.71 },
  { city: "Dallas",      country: "United States",  flag: "🇺🇸", region: "North America", ping: "~22ms", status: "Online", lng: -96.80,  lat: 32.78 },
  { city: "Los Angeles", country: "United States",  flag: "🇺🇸", region: "North America", ping: "~28ms", status: "Online", lng: -118.24, lat: 34.05 },
  { city: "Singapore",   country: "Singapore",      flag: "🇸🇬", region: "Asia Pacific",  ping: "~15ms", status: "Online", lng: 103.82,  lat:  1.35 },
  { city: "Sydney",      country: "Australia",      flag: "🇦🇺", region: "Asia Pacific",  ping: "~20ms", status: "Online", lng: 151.21,  lat: -33.87 },
  { city: "Tokyo",       country: "Japan",          flag: "🇯🇵", region: "Asia Pacific",  ping: "~10ms", status: "Online", lng: 139.69,  lat:  35.69 },
];

export default function Home() {
  return (
    <>
      <Navbar />
      <main className="flex-1">
        <HeroAnimated />
        <Features />
        <Pricing />

        {/* Server Locations */}
        <section className="bg-[#0d1117] py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-[#00c98d]/30 bg-[#00c98d]/10 px-3.5 py-1.5">
                  <Globe className="h-3.5 w-3.5 text-[#00c98d]" />
                  <span className="text-sm font-semibold text-[#00c98d]">Global Infrastructure</span>
                </div>
                <h2 className="text-3xl font-black text-white sm:text-4xl">
                  Server{" "}
                  <span className="bg-gradient-to-r from-[#00c98d] to-[#4dd9ae] bg-clip-text text-transparent">
                    Locations
                  </span>
                </h2>
                <p className="mt-3 text-[#a8b0c4]">
                  {mapLocations.length} datacenters worldwide. Pick the region closest to your players.
                </p>
              </div>
              <Link
                href="/locations"
                className="shrink-0 rounded-xl border border-white/[0.1] bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white hover:bg-white/[0.08] transition-colors"
              >
                View all locations →
              </Link>
            </div>
            <WorldMap locations={mapLocations} />
          </div>
        </section>

        <Reviews />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
