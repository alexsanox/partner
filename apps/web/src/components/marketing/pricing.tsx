import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const plans = [
  {
    name: "Starter",
    slug: "starter",
    ram: "2 GB",
    price: 2.99,
    players: "10 Players",
    storage: "10 GB NVMe",
    cpu: "100%",
    popular: false,
    features: [
      "2 GB DDR5 RAM",
      "10 Player Slots",
      "10 GB NVMe SSD",
      "1 Backup Slot",
      "DDoS Protection",
      "24/7 Support",
    ],
  },
  {
    name: "Essential",
    slug: "essential",
    ram: "4 GB",
    price: 5.99,
    players: "25 Players",
    storage: "25 GB NVMe",
    cpu: "200%",
    popular: false,
    features: [
      "4 GB DDR5 RAM",
      "25 Player Slots",
      "25 GB NVMe SSD",
      "2 Backup Slots",
      "DDoS Protection",
      "24/7 Priority Support",
      "MySQL Database",
    ],
  },
  {
    name: "Pro",
    slug: "pro",
    ram: "8 GB",
    price: 9.99,
    players: "50 Players",
    storage: "50 GB NVMe",
    cpu: "350%",
    popular: true,
    features: [
      "8 GB DDR5 RAM",
      "50 Player Slots",
      "50 GB NVMe SSD",
      "3 Backup Slots",
      "DDoS Protection",
      "24/7 Priority Support",
      "2 MySQL Databases",
      "Custom JAR Support",
    ],
  },
  {
    name: "Enterprise",
    slug: "enterprise",
    ram: "16 GB",
    price: 19.99,
    players: "Unlimited",
    storage: "100 GB NVMe",
    cpu: "500%",
    popular: false,
    features: [
      "16 GB DDR5 RAM",
      "Unlimited Player Slots",
      "100 GB NVMe SSD",
      "5 Backup Slots",
      "DDoS Protection",
      "24/7 Dedicated Support",
      "5 MySQL Databases",
      "Custom JAR Support",
      "Dedicated IP",
    ],
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="relative py-20 sm:py-28">
      <div className="absolute inset-0 -z-10">
        <div className="absolute right-1/4 top-0 h-[500px] w-[600px] rounded-full bg-blue-600/5 blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Simple, Transparent{" "}
            <span className="text-blue-400">Pricing</span>
          </h2>
          <p className="mt-4 text-lg text-slate-400">
            No hidden fees. No surprise charges. Pick a plan and start playing
            in under 60 seconds.
          </p>
        </div>

        <div className="mt-14 grid gap-6 lg:grid-cols-4">
          {plans.map((plan) => (
            <Card
              key={plan.slug}
              className={cn(
                "relative flex flex-col border-white/5 bg-white/[0.02] transition-all hover:border-white/10",
                plan.popular &&
                  "border-blue-500/40 bg-blue-500/[0.04] shadow-lg shadow-blue-500/5"
              )}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-blue-600 text-white shadow-lg shadow-blue-600/25 hover:bg-blue-600">
                    <Zap className="mr-1 h-3 w-3" />
                    Most Popular
                  </Badge>
                </div>
              )}
              <CardHeader className="p-6 pb-0">
                <div className="text-sm font-medium text-slate-400">
                  {plan.name}
                </div>
                <div className="mt-2 flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-white">
                    ${plan.price}
                  </span>
                  <span className="text-sm text-slate-500">/mo</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span>{plan.ram} RAM</span>
                  <span>•</span>
                  <span>{plan.players}</span>
                  <span>•</span>
                  <span>{plan.storage}</span>
                </div>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col p-6">
                <ul className="flex-1 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-sm text-slate-300"
                    >
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-blue-400" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className="mt-6 block">
                  <Button
                    className={cn(
                      "w-full",
                      plan.popular
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25 hover:bg-blue-500"
                        : "bg-white/5 text-white hover:bg-white/10"
                    )}
                  >
                    Get Started
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
