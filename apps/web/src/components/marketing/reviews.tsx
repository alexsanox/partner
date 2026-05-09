import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star } from "lucide-react";

const reviews = [
  {
    name: "Alex M.",
    initials: "AM",
    rating: 5,
    text: "Best Minecraft hosting I've used. Server was up in seconds and performance is incredible. Zero lag with 30 players online.",
  },
  {
    name: "Sarah K.",
    initials: "SK",
    rating: 5,
    text: "Moved from another host and the difference is night and day. Support team helped me migrate everything in minutes.",
  },
  {
    name: "James R.",
    initials: "JR",
    rating: 5,
    text: "Running a modded Fabric server with 150+ mods. The 8GB plan handles it flawlessly. Chunk loading is instant.",
  },
  {
    name: "Mike T.",
    initials: "MT",
    rating: 5,
    text: "The control panel is so clean and easy to use. Setting up plugins and managing backups is a breeze.",
  },
  {
    name: "Emma L.",
    initials: "EL",
    rating: 5,
    text: "Our community server has been running for 6 months with zero downtime. The DDoS protection really works.",
  },
  {
    name: "David W.",
    initials: "DW",
    rating: 5,
    text: "Affordable, reliable, and incredibly fast. Already recommended to three friends who all switched over.",
  },
];

export function Reviews() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Trusted by <span className="text-blue-400">Thousands</span> of
            Players
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            See what our community has to say about their experience.
          </p>
        </div>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review) => (
            <Card
              key={review.name}
              className="border-white/5 bg-white/[0.02]"
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9 bg-blue-600/20">
                    <AvatarFallback className="bg-blue-600/20 text-xs text-blue-300">
                      {review.initials}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="text-sm font-medium text-white">
                      {review.name}
                    </div>
                    <div className="flex gap-0.5">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star
                          key={i}
                          className="h-3 w-3 fill-yellow-400 text-yellow-400"
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-slate-400">
                  &ldquo;{review.text}&rdquo;
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
