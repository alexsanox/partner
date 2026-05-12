import { Star } from "lucide-react";

const reviews = [
  {
    name: "Alex M.",
    initials: "AM",
    rating: 5,
    text: "Best Minecraft hosting I've used. Server was up in seconds and performance is incredible. Zero lag with 30 players online.",
    date: "Jan 2026",
  },
  {
    name: "Sarah K.",
    initials: "SK",
    rating: 5,
    text: "Moved from another host and the difference is night and day. Support team helped me migrate everything in minutes.",
    date: "Feb 2026",
  },
  {
    name: "James R.",
    initials: "JR",
    rating: 5,
    text: "Running a modded Fabric server with 150+ mods. The 8GB plan handles it flawlessly. Chunk loading is instant.",
    date: "Mar 2026",
  },
  {
    name: "Mike T.",
    initials: "MT",
    rating: 5,
    text: "The control panel is so clean and easy to use. Setting up plugins and managing backups is a breeze.",
    date: "Mar 2026",
  },
  {
    name: "Emma L.",
    initials: "EL",
    rating: 5,
    text: "Our community server has been running for 6 months with zero downtime. The DDoS protection really works.",
    date: "Apr 2026",
  },
  {
    name: "David W.",
    initials: "DW",
    rating: 5,
    text: "Affordable, reliable, and incredibly fast. Already recommended to three friends who all switched over.",
    date: "Apr 2026",
  },
];

export function Reviews() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-widest text-[#00c98d]">
            We&apos;re Rated Excellent
          </p>
          <div className="mt-4 flex items-center justify-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="h-6 w-6 fill-yellow-400 text-yellow-400" />
            ))}
          </div>
          <p className="mt-2 text-sm text-[#a8b0c4]">
            Rated <span className="font-bold text-white">4.8</span> out of 5 based on customer reviews
          </p>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Trusted by <span className="text-[#00c98d]">Thousands</span> of Players
          </h2>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <div
              key={review.name}
              className="rounded-xl border border-white/[0.07] bg-[#131720] p-6 transition-all hover:border-white/[0.12] hover:bg-[#181d2e]"
            >
              <div className="flex items-center justify-between">
                <div className="flex gap-0.5">
                  {Array.from({ length: review.rating }).map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-xs font-medium text-[#8b92a8]">{review.date}</span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-[#c8cdd8]">
                &ldquo;{review.text}&rdquo;
              </p>
              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#00c98d]/15 text-xs font-bold text-[#00c98d]">
                  {review.initials}
                </div>
                <span className="text-sm font-semibold text-white">{review.name}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
