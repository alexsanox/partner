import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  CheckCircle,
  XCircle,
  Server as ServerIcon,
  CreditCard,
  Mail,
  Database,
  Globe,
  Key,
} from "lucide-react";

function maskValue(val: string | undefined): string {
  if (!val) return "Not configured";
  if (val.length <= 8) return "••••••••";
  return val.slice(0, 4) + "••••" + val.slice(-4);
}

function StatusDot({ ok }: { ok: boolean }) {
  return ok ? (
    <CheckCircle className="h-4 w-4 text-green-400" />
  ) : (
    <XCircle className="h-4 w-4 text-red-400" />
  );
}

export default function AdminSettingsPage() {
  const pelicanUrl = process.env.PELICAN_URL;
  const pelicanKey = process.env.PELICAN_API_KEY;
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const stripeWebhook = process.env.STRIPE_WEBHOOK_SECRET;
  const dbUrl = process.env.DATABASE_URL;
  const resendKey = process.env.RESEND_API_KEY;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.BETTER_AUTH_URL;
  const authSecret = process.env.BETTER_AUTH_SECRET;

  const configs = [
    {
      title: "Pelican Panel",
      description: "Game server provisioning and management",
      icon: ServerIcon,
      color: "text-cyan-400",
      bg: "bg-cyan-400/10",
      items: [
        { label: "Panel URL", value: pelicanUrl, masked: pelicanUrl ?? "Not set" },
        { label: "API Key", value: pelicanKey, masked: maskValue(pelicanKey) },
      ],
      configured: !!(pelicanUrl && pelicanKey),
    },
    {
      title: "Stripe",
      description: "Payment processing and subscriptions",
      icon: CreditCard,
      color: "text-purple-400",
      bg: "bg-purple-400/10",
      items: [
        { label: "Secret Key", value: stripeKey, masked: maskValue(stripeKey) },
        { label: "Webhook Secret", value: stripeWebhook, masked: maskValue(stripeWebhook) },
      ],
      configured: !!(stripeKey && stripeWebhook),
    },
    {
      title: "Database",
      description: "PostgreSQL database connection",
      icon: Database,
      color: "text-[#00c98d]",
      bg: "bg-blue-400/10",
      items: [
        { label: "Connection URL", value: dbUrl, masked: dbUrl ? `${dbUrl.split("@")[1]?.split("/")[0] ?? "configured"}` : "Not set" },
      ],
      configured: !!dbUrl,
    },
    {
      title: "Email (Resend)",
      description: "Transactional email delivery",
      icon: Mail,
      color: "text-green-400",
      bg: "bg-green-400/10",
      items: [
        { label: "API Key", value: resendKey, masked: maskValue(resendKey) },
      ],
      configured: !!resendKey,
    },
    {
      title: "Authentication",
      description: "Better Auth configuration",
      icon: Key,
      color: "text-yellow-400",
      bg: "bg-yellow-400/10",
      items: [
        { label: "Auth Secret", value: authSecret, masked: authSecret ? "••••••••" : "Not set" },
      ],
      configured: !!authSecret,
    },
    {
      title: "Application",
      description: "Base URL and general settings",
      icon: Globe,
      color: "text-slate-300",
      bg: "bg-slate-400/10",
      items: [
        { label: "App URL", value: appUrl, masked: appUrl ?? "Not set" },
      ],
      configured: !!appUrl,
    },
  ];

  const allConfigured = configs.every((c) => c.configured);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Settings</h1>
        <p className="mt-1 text-sm text-slate-400">
          Environment configuration and integration status
        </p>
      </div>

      {/* Health overview */}
      <Card className="border-white/[0.07] bg-white/[0.02]">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-white">System Health</p>
              <p className="mt-0.5 text-xs text-[#8b92a8]">
                {allConfigured ? "All integrations configured" : "Some integrations need configuration"}
              </p>
            </div>
            <Badge
              variant="outline"
              className={
                allConfigured
                  ? "bg-green-500/10 text-green-400 border-green-500/20"
                  : "bg-yellow-500/10 text-yellow-400 border-yellow-500/20"
              }
            >
              {configs.filter((c) => c.configured).length}/{configs.length} Ready
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Integration cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {configs.map((cfg) => (
          <Card key={cfg.title} className="border-white/[0.07] bg-white/[0.02]">
            <CardHeader className="flex flex-row items-center justify-between p-5 pb-3">
              <div className="flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${cfg.bg}`}>
                  <cfg.icon className={`h-5 w-5 ${cfg.color}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{cfg.title}</p>
                  <p className="text-xs text-[#8b92a8]">{cfg.description}</p>
                </div>
              </div>
              <StatusDot ok={cfg.configured} />
            </CardHeader>
            <CardContent className="border-t border-white/[0.05] p-5 pt-4">
              <div className="space-y-3">
                {cfg.items.map((item) => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-xs text-[#8b92a8]">{item.label}</span>
                    <span className={`font-mono text-xs ${item.value ? "text-white" : "text-red-400"}`}>
                      {item.masked}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Separator className="bg-white/[0.07]" />

      {/* Info note */}
      <Card className="border-white/[0.07] bg-white/[0.02]">
        <CardContent className="p-5">
          <p className="text-xs text-[#8b92a8]">
            Settings are managed via environment variables in your <code className="rounded bg-white/5 px-1.5 py-0.5 text-white">.env</code> file.
            Changes require a server restart to take effect.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
