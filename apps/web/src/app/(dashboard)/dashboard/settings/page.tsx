"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail, Lock, Loader2, Check, Monitor, Smartphone,
  Globe, LogOut, AlertTriangle, ShieldCheck, ShieldOff,
} from "lucide-react";
import { authClient, useSession } from "@/lib/auth-client";

function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function parseUA(ua: string | null | undefined) {
  if (!ua) return { browser: "Unknown", os: "Unknown" };
  let browser = "Unknown";
  let os = "Unknown";
  if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Edg")) browser = "Edge";
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iPhone") || ua.includes("iPad")) os = "iOS";
  return { browser, os };
}

export default function SettingsPage() {
  const { data: session, isPending } = useSession();
  const [name, setName] = useState("");
  const [nameLoading, setNameLoading] = useState(false);
  const [nameSuccess, setNameSuccess] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);

  const [emailEditing, setEmailEditing] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const [passwordEditing, setPasswordEditing] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // 2FA state
  const [twoFAEnabled, setTwoFAEnabled] = useState(false);
  const [twoFALoading, setTwoFALoading] = useState(false);
  const [twoFAEnabling, setTwoFAEnabling] = useState(false);
  const [twoFAPassword, setTwoFAPassword] = useState("");
  const [twoFAError, setTwoFAError] = useState<string | null>(null);
  const [twoFASuccess, setTwoFASuccess] = useState(false);

  useEffect(() => {
    if (session?.user?.name) {
      setName(session.user.name);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((session?.user as any)?.twoFactorEnabled) {
      setTwoFAEnabled(true);
    }
  }, [session?.user?.name, session?.user]);

  // Fetch sessions when Security tab is visible
  const fetchSessions = useCallback(async () => {
    setSessionsLoading(true);
    try {
      const res = await authClient.listSessions();
      if (res.data) {
        setSessions(res.data);
      }
    } catch { /* skip */ }
    setSessionsLoading(false);
  }, []);

  // ── Name Update ──
  const handleNameSave = async () => {
    if (!name.trim()) return;
    setNameLoading(true);
    setNameError(null);
    setNameSuccess(false);
    try {
      const res = await authClient.updateUser({ name: name.trim() });
      if (res.error) {
        setNameError(res.error.message ?? "Failed to update name");
      } else {
        setNameSuccess(true);
        setTimeout(() => setNameSuccess(false), 3000);
      }
    } catch {
      setNameError("Failed to update name");
    }
    setNameLoading(false);
  };

  // ── Email Change ──
  const handleEmailChange = async () => {
    if (!newEmail.trim()) return;
    setEmailLoading(true);
    setEmailError(null);
    setEmailSuccess(false);
    try {
      const res = await authClient.changeEmail({ newEmail: newEmail.trim() });
      if (res.error) {
        setEmailError(res.error.message ?? "Failed to change email");
      } else {
        setEmailSuccess(true);
        setEmailEditing(false);
        setNewEmail("");
        setTimeout(() => setEmailSuccess(false), 3000);
      }
    } catch {
      setEmailError("Failed to change email");
    }
    setEmailLoading(false);
  };

  // ── Password Change ──
  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }
    setPasswordLoading(true);
    setPasswordError(null);
    setPasswordSuccess(false);
    try {
      const res = await authClient.changePassword({
        currentPassword,
        newPassword,
      });
      if (res.error) {
        setPasswordError(res.error.message ?? "Failed to change password");
      } else {
        setPasswordSuccess(true);
        setPasswordEditing(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPasswordSuccess(false), 3000);
      }
    } catch {
      setPasswordError("Failed to change password");
    }
    setPasswordLoading(false);
  };

  // ── Enable 2FA ──
  const handleEnable2FA = async () => {
    if (!twoFAPassword) {
      setTwoFAError("Password is required");
      return;
    }
    setTwoFALoading(true);
    setTwoFAError(null);
    try {
      const res = await authClient.twoFactor.enable({ password: twoFAPassword });
      if (res.error) {
        const e = res.error;
        setTwoFAError(e.message || e.code || (e.status === 400 ? "Incorrect password" : `Error ${e.status}: ${e.statusText}`));
      } else {
        setTwoFAEnabled(true);
        setTwoFAEnabling(false);
        setTwoFAPassword("");
        setTwoFASuccess(true);
        setTimeout(() => setTwoFASuccess(false), 3000);
      }
    } catch {
      setTwoFAError("Failed to enable 2FA");
    }
    setTwoFALoading(false);
  };

  // ── Disable 2FA ──
  const handleDisable2FA = async () => {
    if (!twoFAPassword) {
      setTwoFAError("Password is required");
      return;
    }
    setTwoFALoading(true);
    setTwoFAError(null);
    try {
      const res = await authClient.twoFactor.disable({ password: twoFAPassword });
      if (res.error) {
        const e = res.error;
        setTwoFAError(e.message || e.code || (e.status === 400 ? "Incorrect password" : `Error ${e.status}: ${e.statusText}`));
      } else {
        setTwoFAEnabled(false);
        setTwoFAEnabling(false);
        setTwoFAPassword("");
        setTwoFASuccess(true);
        setTimeout(() => setTwoFASuccess(false), 3000);
      }
    } catch {
      setTwoFAError("Failed to disable 2FA");
    }
    setTwoFALoading(false);
  };

  // ── Revoke Session ──
  const handleRevokeSession = async (tokenId: string) => {
    setRevokingId(tokenId);
    try {
      await authClient.revokeSession({ token: tokenId });
      setSessions((prev) => prev.filter((s) => s.token !== tokenId));
    } catch { /* skip */ }
    setRevokingId(null);
  };

  if (isPending) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-[#00c98d]" />
      </div>
    );
  }

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
          <TabsTrigger value="security" onClick={fetchSessions}>Security</TabsTrigger>
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
              <div className="space-y-2">
                <Label className="text-slate-300">Display Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="border-white/10 bg-white/5 text-white max-w-sm"
                />
              </div>
              {nameError && (
                <p className="text-xs text-red-400">{nameError}</p>
              )}
              <Button
                onClick={handleNameSave}
                disabled={nameLoading || name === session?.user?.name}
                className="bg-[#00c98d] text-white hover:bg-[#4a7bef] disabled:opacity-40"
              >
                {nameLoading ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
                ) : nameSuccess ? (
                  <><Check className="mr-2 h-4 w-4" /> Saved!</>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Signing In */}
          <Card className="border-white/5 bg-white/[0.02]">
            <CardHeader className="p-5 pb-0">
              <h2 className="text-base font-semibold text-white">
                Signing In
              </h2>
            </CardHeader>
            <CardContent className="space-y-4 p-5">
              {/* Email */}
              <div className="rounded-lg border border-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-white">
                        Email Address
                      </p>
                      <p className="text-xs text-slate-500">
                        {session?.user?.email ?? "—"}
                      </p>
                    </div>
                  </div>
                  {!emailEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/10 text-slate-300"
                      onClick={() => setEmailEditing(true)}
                    >
                      Change
                    </Button>
                  )}
                </div>
                {emailEditing && (
                  <div className="mt-3 space-y-3 pl-8">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-400">New Email</Label>
                      <Input
                        type="email"
                        value={newEmail}
                        onChange={(e) => setNewEmail(e.target.value)}
                        placeholder="new@example.com"
                        className="border-white/10 bg-white/5 text-white max-w-sm"
                        autoFocus
                      />
                    </div>
                    {emailError && <p className="text-xs text-red-400">{emailError}</p>}
                    {emailSuccess && <p className="text-xs text-green-400">Email updated!</p>}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleEmailChange}
                        disabled={emailLoading || !newEmail.trim()}
                        className="bg-[#00c98d] text-white hover:bg-[#4a7bef] disabled:opacity-40"
                      >
                        {emailLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Update Email"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/10 text-slate-300"
                        onClick={() => { setEmailEditing(false); setNewEmail(""); setEmailError(null); }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Password */}
              <div className="rounded-lg border border-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Lock className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-white">Password</p>
                      <p className="text-xs text-slate-500">
                        Change your account password
                      </p>
                    </div>
                  </div>
                  {!passwordEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/10 text-slate-300"
                      onClick={() => setPasswordEditing(true)}
                    >
                      Change
                    </Button>
                  )}
                </div>
                {passwordEditing && (
                  <div className="mt-3 space-y-3 pl-8">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-400">Current Password</Label>
                      <Input
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="border-white/10 bg-white/5 text-white max-w-sm"
                        autoFocus
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-400">New Password</Label>
                      <Input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="border-white/10 bg-white/5 text-white max-w-sm"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-400">Confirm New Password</Label>
                      <Input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="border-white/10 bg-white/5 text-white max-w-sm"
                      />
                    </div>
                    {passwordError && <p className="text-xs text-red-400">{passwordError}</p>}
                    {passwordSuccess && <p className="text-xs text-green-400">Password changed!</p>}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handlePasswordChange}
                        disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                        className="bg-[#00c98d] text-white hover:bg-[#4a7bef] disabled:opacity-40"
                      >
                        {passwordLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Update Password"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/10 text-slate-300"
                        onClick={() => {
                          setPasswordEditing(false);
                          setCurrentPassword("");
                          setNewPassword("");
                          setConfirmPassword("");
                          setPasswordError(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6 space-y-6">
          {/* Two-Factor Authentication */}
          <Card className="border-white/5 bg-white/[0.02]">
            <CardHeader className="p-5 pb-0">
              <h2 className="text-base font-semibold text-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-[#00c98d]" />
                Two-Factor Authentication
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Add an extra layer of security. When enabled, you&apos;ll receive a code via email each time you sign in.
              </p>
            </CardHeader>
            <CardContent className="p-5">
              <div className="rounded-lg border border-white/5 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {twoFAEnabled ? (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-green-500/10">
                        <ShieldCheck className="h-4 w-4 text-green-400" />
                      </div>
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5">
                        <ShieldOff className="h-4 w-4 text-slate-400" />
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-white">
                        Email 2FA is {twoFAEnabled ? "enabled" : "disabled"}
                      </p>
                      <p className="text-xs text-slate-500">
                        {twoFAEnabled
                          ? "A code will be sent to your email on each login"
                          : "Enable to require a code on every sign-in"}
                      </p>
                    </div>
                  </div>
                  {!twoFAEnabling && (
                    <Button
                      variant="outline"
                      size="sm"
                      className={twoFAEnabled
                        ? "border-red-500/20 text-red-400 hover:bg-red-500/10"
                        : "border-[#00c98d]/20 text-[#00c98d] hover:bg-[#00c98d]/10"
                      }
                      onClick={() => { setTwoFAEnabling(true); setTwoFAError(null); setTwoFAPassword(""); }}
                    >
                      {twoFAEnabled ? "Disable" : "Enable"}
                    </Button>
                  )}
                </div>
                {twoFAEnabling && (
                  <div className="mt-4 space-y-3 pl-12">
                    <div className="space-y-1.5">
                      <Label className="text-xs text-slate-400">Confirm your password</Label>
                      <Input
                        type="password"
                        value={twoFAPassword}
                        onChange={(e) => setTwoFAPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="border-white/10 bg-white/5 text-white max-w-sm"
                        autoFocus
                      />
                    </div>
                    {twoFAError && <p className="text-xs text-red-400">{twoFAError}</p>}
                    {twoFASuccess && <p className="text-xs text-green-400">2FA {twoFAEnabled ? "enabled" : "disabled"} successfully!</p>}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={twoFAEnabled ? handleDisable2FA : handleEnable2FA}
                        disabled={twoFALoading || !twoFAPassword}
                        className={twoFAEnabled
                          ? "bg-red-500 text-white hover:bg-red-600 disabled:opacity-40"
                          : "bg-[#00c98d] text-white hover:bg-[#4a7bef] disabled:opacity-40"
                        }
                      >
                        {twoFALoading ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : twoFAEnabled ? (
                          "Disable 2FA"
                        ) : (
                          "Enable 2FA"
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/10 text-slate-300"
                        onClick={() => { setTwoFAEnabling(false); setTwoFAPassword(""); setTwoFAError(null); }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Active Sessions */}
          <Card className="border-white/5 bg-white/[0.02]">
            <CardHeader className="p-5 pb-0">
              <h2 className="text-base font-semibold text-white">Active Sessions</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage your active sessions across devices. Revoking a session will log it out.
              </p>
            </CardHeader>
            <CardContent className="space-y-3 p-5">
              {sessionsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-5 w-5 animate-spin text-[#00c98d]" />
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">No sessions found</p>
              ) : (
                sessions.map((s) => {
                  const { browser, os } = parseUA(s.userAgent);
                  const isCurrent = s.token === session?.session?.token;
                  const isMobile = os === "Android" || os === "iOS";

                  return (
                    <div
                      key={s.id}
                      className={`flex items-center justify-between rounded-lg border p-3 ${
                        isCurrent ? "border-[#00c98d]/20 bg-[#00c98d]/[0.03]" : "border-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isMobile ? (
                          <Smartphone className="h-4 w-4 text-slate-400" />
                        ) : (
                          <Monitor className="h-4 w-4 text-slate-400" />
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm text-white">
                              {browser} on {os}
                            </p>
                            {isCurrent && (
                              <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-semibold text-green-400 border border-green-500/20">
                                Current
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            {s.ipAddress && (
                              <span className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                {s.ipAddress}
                              </span>
                            )}
                            <span>Created {formatDate(s.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      {!isCurrent && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-red-500/20 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                          disabled={revokingId === s.token}
                          onClick={() => handleRevokeSession(s.token)}
                        >
                          {revokingId === s.token ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : (
                            <><LogOut className="mr-1.5 h-3 w-3" /> Revoke</>
                          )}
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-500/10 bg-red-500/[0.02]">
            <CardHeader className="p-5 pb-0">
              <h2 className="text-base font-semibold text-red-400 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Danger Zone
              </h2>
            </CardHeader>
            <CardContent className="p-5">
              <div className="flex items-center justify-between rounded-lg border border-red-500/10 p-4">
                <div>
                  <p className="text-sm font-medium text-white">Revoke All Other Sessions</p>
                  <p className="text-xs text-slate-500">
                    Log out all devices except this one
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                  onClick={async () => {
                    try {
                      await authClient.revokeSessions();
                      fetchSessions();
                    } catch { /* skip */ }
                  }}
                >
                  Revoke All
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
