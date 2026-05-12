import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

export function CTA() {
  return (
    <section className="relative py-20 sm:py-28">
      <div className="absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/2 h-[500px] w-[700px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#00c98d]/10 blur-3xl" />
      </div>

      <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Ready to Start Your{" "}
          <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            Adventure
          </span>
          ?
        </h2>
        <p className="mt-4 text-lg text-slate-400">
          Deploy your Minecraft server in under 60 seconds. No technical
          knowledge required.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link href="/register">
            <Button
              size="lg"
              className="h-12 bg-[#00c98d] px-8 text-base font-semibold text-white shadow-lg shadow-blue-600/25 hover:bg-[#00b07d] hover:shadow-blue-600/40 transition-all"
            >
              <Zap className="mr-2 h-4 w-4" />
              Get Started Now
            </Button>
          </Link>
          <Link href="/support">
            <Button
              variant="outline"
              size="lg"
              className="h-12 border-white/10 px-8 text-base text-slate-300 hover:bg-white/5 hover:text-white"
            >
              Talk to Sales
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
