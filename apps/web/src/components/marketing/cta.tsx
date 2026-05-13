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
        <div className="rounded-2xl border border-[#00c98d]/15 bg-[#131720] px-5 py-10 sm:px-8 sm:py-14 shadow-2xl shadow-[#00c98d]/5">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
            Ready to Start Your{" "}
            <span className="bg-gradient-to-r from-[#00c98d] to-[#4dd9ae] bg-clip-text text-transparent">
              Adventure
            </span>
            ?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-[#a8b0c4]">
            Deploy your Minecraft server in under 60 seconds. No technical
            knowledge required.
          </p>
          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center px-2 sm:px-0">
            <Link href="/register" className="w-full sm:w-auto">
              <Button
                size="lg"
                className="w-full h-12 bg-[#00c98d] px-10 text-base font-bold text-white shadow-lg shadow-[#00c98d]/30 hover:bg-[#00e0a0] hover:text-white hover:shadow-[#00c98d]/40 transition-all"
              >
                <Zap className="mr-2 h-4 w-4" />
                Get Started — It&apos;s Free
              </Button>
            </Link>
            <Link href="/support" className="w-full sm:w-auto">
              <Button
                variant="outline"
                size="lg"
                className="w-full h-12 border-white/15 bg-white/[0.04] px-8 text-base text-white hover:bg-white/[0.08] hover:text-white hover:border-white/25 transition-all"
              >
                Talk to Sales
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
