import {
  Zap,
  Shield,
  Cpu,
  HardDrive,
  Globe,
  Headphones,
  ArrowUpCircle,
  Clock,
  Wrench,
  Terminal,
} from "lucide-react";

const features = [
  {
    icon: Zap,
    title: "Instant Setup",
    description:
      "Start hosting in seconds after purchasing your game server. No waiting around.",
    color: "text-yellow-400",
    borderColor: "border-yellow-500/20",
    bg: "bg-yellow-400/10",
  },
  {
    icon: Clock,
    title: "99% Uptime",
    description:
      "That's not a typo. All network outages are covered by our SLA.",
    color: "text-emerald-400",
    borderColor: "border-emerald-500/20",
    bg: "bg-emerald-400/10",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description:
      "Our support team is available around-the-clock to assist you with any issue.",
    color: "text-pink-400",
    borderColor: "border-pink-500/20",
    bg: "bg-pink-400/10",
  },
  {
    icon: Shield,
    title: "DDoS Protection",
    description:
      "We guarantee full protection against DDoS attacks under our SLA.",
    color: "text-blue-400",
    borderColor: "border-blue-500/20",
    bg: "bg-blue-400/10",
  },
  {
    icon: Globe,
    title: "Free Subdomain",
    description:
      "Get a custom IP address for free using our subdomain creator.",
    color: "text-cyan-400",
    borderColor: "border-cyan-500/20",
    bg: "bg-cyan-400/10",
  },
  {
    icon: Cpu,
    title: "High-Performance Hardware",
    description:
      "Latest-gen AMD Ryzen processors and NVMe SSDs for zero-lag gameplay.",
    color: "text-purple-400",
    borderColor: "border-purple-500/20",
    bg: "bg-purple-400/10",
  },
];

const detailFeatures = [
  {
    icon: Terminal,
    title: "Full Console Access",
    description: "Real-time server console with command execution and log streaming.",
  },
  {
    icon: Wrench,
    title: "Modpack Installer",
    description: "One-click installation for hundreds of popular modpacks and plugins.",
  },
  {
    icon: HardDrive,
    title: "NVMe Storage",
    description: "Ultra-fast NVMe drives ensure instant chunk loading and world saves.",
  },
  {
    icon: ArrowUpCircle,
    title: "One-Click Upgrades",
    description: "Scale your server instantly. Upgrade RAM, storage, or player slots with zero downtime.",
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-20 sm:py-28">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-0 top-1/3 h-[500px] w-[500px] rounded-full bg-blue-600/5 blur-[100px]" />
        <div className="absolute right-0 bottom-1/3 h-[400px] w-[400px] rounded-full bg-purple-600/5 blur-[100px]" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Heading */}
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-blue-400">
            Exclusive Features
          </h2>
          <p className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Everything You Need to{" "}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Dominate
            </span>
          </p>
          <p className="mt-4 text-lg text-slate-400">
            We offer a wide variety of features that enhance your gaming
            experience and provide the most powerful hardware at the best price.
          </p>
        </div>

        {/* Bento grid - scattered layout */}
        <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className={`group relative rounded-xl border ${feature.borderColor} bg-white/[0.02] p-6 backdrop-blur-sm transition-all hover:bg-white/[0.04] hover:border-white/10`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${feature.bg}`}
                >
                  <feature.icon className={`h-5 w-5 ${feature.color}`} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">
                    {feature.title}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-400">
                    {feature.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Control Panel showcase */}
        <div className="mt-24">
          <div className="mx-auto max-w-2xl text-center">
            <h3 className="text-sm font-semibold uppercase tracking-widest text-emerald-400">
              Control Panel
            </h3>
            <p className="mt-3 text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Experience the{" "}
              <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Power
              </span>
            </p>
            <p className="mt-4 text-lg text-slate-400">
              Our panel has all the features you need and more. Get a new
              server today and discover them all.
            </p>
          </div>

          {/* Panel mockup */}
          <div className="mt-12 overflow-hidden rounded-xl border border-white/10 bg-[#0d1117] shadow-2xl shadow-blue-500/5">
            {/* Title bar */}
            <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
              <div className="h-3 w-3 rounded-full bg-red-500/60" />
              <div className="h-3 w-3 rounded-full bg-yellow-500/60" />
              <div className="h-3 w-3 rounded-full bg-green-500/60" />
              <span className="ml-3 text-xs text-slate-500">
                panel.partnerhosting.com — My Server
              </span>
            </div>
            {/* Panel content */}
            <div className="p-6 sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row">
                {/* Sidebar */}
                <div className="flex flex-col gap-1 sm:w-48">
                  {["Console", "Files", "Backups", "Settings", "Players", "Databases"].map((item, i) => (
                    <div
                      key={item}
                      className={`rounded-md px-3 py-2 text-sm ${
                        i === 0
                          ? "bg-blue-600/20 font-medium text-blue-300"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {item}
                    </div>
                  ))}
                </div>
                {/* Main content */}
                <div className="flex-1 rounded-lg border border-white/5 bg-black/30 p-4 font-mono text-xs leading-relaxed text-slate-400">
                  <div className="text-emerald-400">[Server] Starting Minecraft server...</div>
                  <div className="text-slate-500">[Server] Loading libraries, please wait...</div>
                  <div className="text-slate-500">[Server] Preparing level &quot;world&quot;</div>
                  <div className="text-blue-400">[Server] Done (2.847s)! For help, type &quot;help&quot;</div>
                  <div className="text-slate-500">[Server] 0/100 players online</div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="text-blue-400">{">"}</span>
                    <span className="animate-pulse text-white">_</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detail features row */}
        <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {detailFeatures.map((f) => (
            <div key={f.title} className="text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-white/5">
                <f.icon className="h-5 w-5 text-blue-400" />
              </div>
              <h4 className="mt-4 text-sm font-semibold text-white">{f.title}</h4>
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
