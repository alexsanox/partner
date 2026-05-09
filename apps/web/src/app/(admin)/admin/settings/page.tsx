import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Platform Settings</h1>
        <p className="mt-1 text-sm text-slate-400">
          Configure platform-wide settings
        </p>
      </div>

      <Card className="border-white/5 bg-white/[0.02]">
        <CardHeader className="p-5 pb-0">
          <h2 className="text-base font-semibold text-white">Pelican Panel</h2>
          <p className="text-sm text-slate-400">
            Connect to your Pelican/Pterodactyl panel for server provisioning
          </p>
        </CardHeader>
        <CardContent className="space-y-4 p-5">
          <div className="space-y-2">
            <Label className="text-slate-300">Panel URL</Label>
            <Input
              placeholder="https://panel.example.com"
              className="border-white/10 bg-white/5 text-white placeholder:text-slate-500"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">API Key</Label>
            <Input
              type="password"
              placeholder="ptla_xxxxxxxxxxxx"
              className="border-white/10 bg-white/5 text-white placeholder:text-slate-500"
            />
          </div>
          <Button className="bg-blue-600 text-white hover:bg-blue-500">
            Save & Test Connection
          </Button>
        </CardContent>
      </Card>

      <Card className="border-white/5 bg-white/[0.02]">
        <CardHeader className="p-5 pb-0">
          <h2 className="text-base font-semibold text-white">Stripe</h2>
          <p className="text-sm text-slate-400">
            Payment processing configuration
          </p>
        </CardHeader>
        <CardContent className="space-y-4 p-5">
          <div className="space-y-2">
            <Label className="text-slate-300">Secret Key</Label>
            <Input
              type="password"
              placeholder="sk_live_xxxxxxxxxxxx"
              className="border-white/10 bg-white/5 text-white placeholder:text-slate-500"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-300">Webhook Secret</Label>
            <Input
              type="password"
              placeholder="whsec_xxxxxxxxxxxx"
              className="border-white/10 bg-white/5 text-white placeholder:text-slate-500"
            />
          </div>
          <Button className="bg-blue-600 text-white hover:bg-blue-500">
            Save Settings
          </Button>
        </CardContent>
      </Card>

      <Separator className="bg-white/5" />

      <Card className="border-red-500/10 bg-red-500/[0.02]">
        <CardHeader className="p-5 pb-0">
          <h2 className="text-base font-semibold text-red-400">Danger Zone</h2>
        </CardHeader>
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center justify-between rounded-lg border border-red-500/10 p-4">
            <div>
              <p className="text-sm font-medium text-white">Purge Failed Jobs</p>
              <p className="text-xs text-slate-500">
                Remove all failed provisioning logs older than 30 days
              </p>
            </div>
            <Button variant="outline" className="border-red-500/20 text-red-400 hover:bg-red-500/10">
              Purge
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
