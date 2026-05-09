"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Shield, Mail, Lock } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-sm text-slate-400">
          Manage your account settings and preferences
        </p>
      </div>

      <Tabs defaultValue="account">
        <TabsList className="bg-white/5">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="mt-6 space-y-6">
          {/* Personal Info */}
          <Card className="border-white/5 bg-white/[0.02]">
            <CardHeader className="p-5 pb-0">
              <h2 className="text-base font-semibold text-white">
                Personal Information
              </h2>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-slate-300">First Name</Label>
                  <Input
                    defaultValue="John"
                    className="border-white/10 bg-white/5 text-white"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">Last Name</Label>
                  <Input
                    defaultValue="Doe"
                    className="border-white/10 bg-white/5 text-white"
                  />
                </div>
              </div>
              <Button className="bg-blue-600 text-white hover:bg-blue-500">
                Save Changes
              </Button>
            </CardContent>
          </Card>

          {/* Email */}
          <Card className="border-white/5 bg-white/[0.02]">
            <CardHeader className="p-5 pb-0">
              <h2 className="text-base font-semibold text-white">
                Signing In
              </h2>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between rounded-lg border border-white/5 p-4">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-white">
                      Email Address
                    </p>
                    <p className="text-xs text-slate-500">
                      john.doe@example.com
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10 text-slate-300"
                >
                  Change
                </Button>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-white/5 p-4">
                <div className="flex items-center gap-3">
                  <Lock className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-white">Password</p>
                    <p className="text-xs text-slate-500">
                      Last changed 30 days ago
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10 text-slate-300"
                >
                  Change
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6 space-y-6">
          <Card className="border-white/5 bg-white/[0.02]">
            <CardHeader className="p-5 pb-0">
              <h2 className="text-base font-semibold text-white">Security</h2>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              <div className="flex items-center justify-between rounded-lg border border-white/5 p-4">
                <div className="flex items-center gap-3">
                  <Shield className="h-5 w-5 text-slate-400" />
                  <div>
                    <p className="text-sm font-medium text-white">
                      Two-Factor Authentication
                    </p>
                    <p className="text-xs text-slate-500">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                </div>
                <Button className="bg-blue-600 text-white hover:bg-blue-500">
                  Set Up
                </Button>
              </div>

              <Separator className="bg-white/5" />

              <div>
                <h3 className="text-sm font-medium text-white">
                  Active Sessions
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Manage your active sessions across devices
                </p>
                <div className="mt-3 space-y-2">
                  <div className="flex items-center justify-between rounded-lg border border-white/5 p-3">
                    <div>
                      <p className="text-sm text-white">Current Session</p>
                      <p className="text-xs text-slate-500">
                        Chrome on Windows • IP 192.168.1.1
                      </p>
                    </div>
                    <Badge className="bg-green-500/10 text-green-400 border border-green-500/20">
                      Active
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Badge({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}
    >
      {children}
    </span>
  );
}
