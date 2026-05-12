"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail, Lock, Loader2, Check, Monitor, Smartphone,
  Globe, LogOut, AlertTriangle, ShieldCheck, ShieldOff, User,
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

  const initials = (session?.user?.name ?? session?.user?.email ?? "?")
    .split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="space-y-6 pb-10 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="mt-1 text-sm text-[#8b92a8]">Manage your account settings and preferences</p>
      </div>

      {/* User profile card */}
      <div className="rounded-xl border border-white/[0.06] bg-[#1e2235] p-5 flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#00c98d]/15 border border-[#00c98d]/20 text-[#00c98d] text-lg font-bold select-none">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-base font-bold text-white truncate">{session?.user?.name ?? "—"}</p>
          <p className="text-sm text-[#8b92a8] truncate">{session?.user?.email ?? "—"}</p>
        </div>
      </div>

      <Tabs defaultValue="account">
        <TabsList className="bg-white/[0.04] border border-white/[0.06] p-0.5 gap-0.5">
          <TabsTrigger value="account" className="data-[state=active]:bg-[#00c98d]/15 data-[state=active]:text-[#00c98d]">Account</TabsTrigger>
          <TabsTrigger value="security" onClick={fetchSessions} className="data-[state=active]:bg-[#00c98d]/15 data-[state=active]:text-[#00c98d]">Security</TabsTrigger>
        </TabsList>

        {/* ── ACCOUNT TAB ── */}
        <TabsContent value="account" className="mt-5 space-y-4">

          {/* Display Name */}
          <div className="rounded-xl border border-white/[0.06] bg-[#1e2235] overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.05]">
              <User className="h-4 w-4 text-[#8b92a8]" />
              <h2 className="text-sm font-semibold text-white">Display Name</h2>
            </div>
            <div className="p-5 space-y-3">
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                className="border-white/10 bg-[#171b29] text-white max-w-sm"
              />
              {nameError && <p className="text-xs text-red-400">{nameError}</p>}
              <Button
                onClick={handleNameSave}
                disabled={nameLoading || name === session?.user?.name}
                className="bg-[#00c98d] text-white hover:bg-[#00e0a0] hover:text-white disabled:opacity-40"
              >
                {nameLoading ? <><Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />Saving...</> :
                 nameSuccess ? <><Check className="mr-2 h-3.5 w-3.5" />Saved!</> : "Save Changes"}
              </Button>
            </div>
          </div>

          {/* Email */}
          <div className="rounded-xl border border-white/[0.06] bg-[#1e2235] overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.05]">
              <Mail className="h-4 w-4 text-[#8b92a8]" />
              <h2 className="text-sm font-semibold text-white">Email Address</h2>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">{session?.user?.email ?? "—"}</p>
                  <p className="text-xs text-[#8b92a8] mt-0.5">Your sign-in email</p>
                </div>
                {!emailEditing && (
                  <button
                    onClick={() => setEmailEditing(true)}
                    className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-[#8b92a8] hover:text-white hover:bg-white/[0.06] transition-colors"
                  >
                    Change
                  </button>
                )}
              </div>
              {emailEditing && (
                <div className="mt-4 space-y-3 border-t border-white/[0.05] pt-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-[#8b92a8]">New Email</Label>
                    <Input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="new@example.com" className="border-white/10 bg-[#171b29] text-white max-w-sm" autoFocus />
                  </div>
                  {emailError && <p className="text-xs text-red-400">{emailError}</p>}
                  {emailSuccess && <p className="text-xs text-[#00c98d]">Email updated!</p>}
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleEmailChange} disabled={emailLoading || !newEmail.trim()}
                      className="bg-[#00c98d] text-white hover:bg-[#00e0a0] hover:text-white disabled:opacity-40">
                      {emailLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Update Email"}
                    </Button>
                    <button onClick={() => { setEmailEditing(false); setNewEmail(""); setEmailError(null); }}
                      className="rounded-lg border border-white/[0.07] px-3 py-1 text-xs font-medium text-[#8b92a8] hover:text-white transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Password */}
          <div className="rounded-xl border border-white/[0.06] bg-[#1e2235] overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.05]">
              <Lock className="h-4 w-4 text-[#8b92a8]" />
              <h2 className="text-sm font-semibold text-white">Password</h2>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-white">••••••••••••</p>
                  <p className="text-xs text-[#8b92a8] mt-0.5">Change your sign-in password</p>
                </div>
                {!passwordEditing && (
                  <button onClick={() => setPasswordEditing(true)}
                    className="rounded-lg border border-white/[0.07] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-[#8b92a8] hover:text-white hover:bg-white/[0.06] transition-colors">
                    Change
                  </button>
                )}
              </div>
              {passwordEditing && (
                <div className="mt-4 space-y-3 border-t border-white/[0.05] pt-4">
                  {[
                    { label: "Current Password", value: currentPassword, set: setCurrentPassword, auto: true },
                    { label: "New Password", value: newPassword, set: setNewPassword, auto: false },
                    { label: "Confirm New Password", value: confirmPassword, set: setConfirmPassword, auto: false },
                  ].map(({ label, value, set, auto }) => (
                    <div key={label} className="space-y-1.5">
                      <Label className="text-xs text-[#8b92a8]">{label}</Label>
                      <Input type="password" value={value} onChange={(e) => set(e.target.value)}
                        className="border-white/10 bg-[#171b29] text-white max-w-sm" autoFocus={auto} />
                    </div>
                  ))}
                  {passwordError && <p className="text-xs text-red-400">{passwordError}</p>}
                  {passwordSuccess && <p className="text-xs text-[#00c98d]">Password changed!</p>}
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handlePasswordChange}
                      disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                      className="bg-[#00c98d] text-white hover:bg-[#00e0a0] hover:text-white disabled:opacity-40">
                      {passwordLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Update Password"}
                    </Button>
                    <button onClick={() => { setPasswordEditing(false); setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setPasswordError(null); }}
                      className="rounded-lg border border-white/[0.07] px-3 py-1 text-xs font-medium text-[#8b92a8] hover:text-white transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── SECURITY TAB ── */}
        <TabsContent value="security" className="mt-5 space-y-4">

          {/* 2FA */}
          <div className="rounded-xl border border-white/[0.06] bg-[#1e2235] overflow-hidden">
            <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.05]">
              <ShieldCheck className="h-4 w-4 text-[#00c98d]" />
              <div>
                <h2 className="text-sm font-semibold text-white">Two-Factor Authentication</h2>
                <p className="text-xs text-[#8b92a8]">Receive a code via email on every sign-in</p>
              </div>
            </div>
            <div className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-full ${twoFAEnabled ? "bg-green-500/10" : "bg-white/[0.04]"}`}>
                    {twoFAEnabled
                      ? <ShieldCheck className="h-4 w-4 text-green-400" />
                      : <ShieldOff className="h-4 w-4 text-[#8b92a8]" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">
                      {twoFAEnabled ? "Enabled" : "Disabled"}
                    </p>
                    <p className="text-xs text-[#8b92a8]">
                      {twoFAEnabled ? "Your account is protected with 2FA" : "Enable for extra security"}
                    </p>
                  </div>
                </div>
                {!twoFAEnabling && (
                  <button
                    onClick={() => { setTwoFAEnabling(true); setTwoFAError(null); setTwoFAPassword(""); }}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                      twoFAEnabled
                        ? "border-red-500/20 text-red-400 hover:bg-red-500/10"
                        : "border-[#00c98d]/20 text-[#00c98d] hover:bg-[#00c98d]/10"
                    }`}
                  >
                    {twoFAEnabled ? "Disable" : "Enable"}
                  </button>
                )}
              </div>
              {twoFAEnabling && (
                <div className="mt-4 space-y-3 border-t border-white/[0.05] pt-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-[#8b92a8]">Confirm your password</Label>
                    <Input type="password" value={twoFAPassword} onChange={(e) => setTwoFAPassword(e.target.value)}
                      placeholder="Enter your password" className="border-white/10 bg-[#171b29] text-white max-w-sm" autoFocus />
                  </div>
                  {twoFAError && <p className="text-xs text-red-400">{twoFAError}</p>}
                  {twoFASuccess && <p className="text-xs text-[#00c98d]">2FA {twoFAEnabled ? "enabled" : "disabled"}!</p>}
                  <div className="flex gap-2">
                    <Button size="sm" onClick={twoFAEnabled ? handleDisable2FA : handleEnable2FA}
                      disabled={twoFALoading || !twoFAPassword}
                      className={twoFAEnabled ? "bg-red-500 text-white hover:bg-red-600 disabled:opacity-40" : "bg-[#00c98d] text-white hover:bg-[#00e0a0] hover:text-white disabled:opacity-40"}>
                      {twoFALoading ? <Loader2 className="h-3 w-3 animate-spin" /> : twoFAEnabled ? "Disable 2FA" : "Enable 2FA"}
                    </Button>
                    <button onClick={() => { setTwoFAEnabling(false); setTwoFAPassword(""); setTwoFAError(null); }}
                      className="rounded-lg border border-white/[0.07] px-3 py-1 text-xs font-medium text-[#8b92a8] hover:text-white transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Active Sessions */}
          <div className="rounded-xl border border-white/[0.06] bg-[#1e2235] overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.05]">
              <div>
                <h2 className="text-sm font-semibold text-white">Active Sessions</h2>
                <p className="text-xs text-[#8b92a8] mt-0.5">Revoking a session will immediately log it out</p>
              </div>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {sessionsLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="h-5 w-5 animate-spin text-[#00c98d]" />
                </div>
              ) : sessions.length === 0 ? (
                <p className="text-sm text-[#8b92a8] py-8 text-center">No sessions found</p>
              ) : (
                sessions.map((s) => {
                  const { browser, os } = parseUA(s.userAgent);
                  const isCurrent = s.token === session?.session?.token;
                  const isMobile = os === "Android" || os === "iOS";
                  return (
                    <div key={s.id} className={`flex items-center justify-between px-5 py-3.5 ${isCurrent ? "bg-[#00c98d]/[0.03]" : ""}`}>
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${isCurrent ? "bg-[#00c98d]/10" : "bg-white/[0.04]"}`}>
                          {isMobile
                            ? <Smartphone className={`h-4 w-4 ${isCurrent ? "text-[#00c98d]" : "text-[#8b92a8]"}`} />
                            : <Monitor className={`h-4 w-4 ${isCurrent ? "text-[#00c98d]" : "text-[#8b92a8]"}`} />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="text-sm font-medium text-white">{browser} on {os}</p>
                            {isCurrent && (
                              <span className="rounded-full bg-[#00c98d]/10 px-2 py-0.5 text-[10px] font-semibold text-[#00c98d] border border-[#00c98d]/20">Current</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-[#8b92a8] mt-0.5 flex-wrap">
                            {s.ipAddress && (
                              <span className="flex items-center gap-1">
                                <Globe className="h-3 w-3 shrink-0" />
                                <code className="font-mono text-[10px]">{s.ipAddress}</code>
                              </span>
                            )}
                            <span>{formatDate(s.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                      {!isCurrent && (
                        <button
                          disabled={revokingId === s.token}
                          onClick={() => handleRevokeSession(s.token)}
                          className="ml-3 shrink-0 flex items-center gap-1.5 rounded-lg border border-red-500/20 px-2.5 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-40"
                        >
                          {revokingId === s.token ? <Loader2 className="h-3 w-3 animate-spin" /> : <><LogOut className="h-3 w-3" /> Revoke</>}
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Danger Zone */}
          <div className="rounded-xl border border-red-500/10 bg-red-500/[0.02] overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-4 border-b border-red-500/10">
              <AlertTriangle className="h-4 w-4 text-red-400" />
              <h2 className="text-sm font-semibold text-red-400">Danger Zone</h2>
            </div>
            <div className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-white">Revoke All Other Sessions</p>
                <p className="text-xs text-[#8b92a8] mt-0.5">Log out all devices except this one</p>
              </div>
              <button
                onClick={async () => { try { await authClient.revokeSessions(); fetchSessions(); } catch { /* skip */ } }}
                className="shrink-0 rounded-lg border border-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
              >
                Revoke All
              </button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
