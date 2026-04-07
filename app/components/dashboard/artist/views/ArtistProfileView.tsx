"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Lock, Shield } from "lucide-react";
import { motion } from "framer-motion";
import {
  Button,
  Card,
  Input,
  Label,
  Switch,
  TextArea,
  TextField,
} from "@heroui/react";

import {
  dashboardRequestJson,
  getDashboardErrorMessage,
} from "@/app/components/dashboard/lib/dashboard-request";
import DashboardLoader from "@/app/components/dashboard/DashboardLoader";
import DiscordAccountPanel from "@/app/components/dashboard/discord/DiscordAccountPanel";

type ArtistProfileViewProps = {
  onSessionRefresh: () => Promise<void>;
  showToast: (message: string, type?: string) => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    onCancel?: () => void,
  ) => void;
  discordLink: {
    linked: boolean;
    discordUserId: string | null;
    discordUsername: string | null;
    linkedAt: string | null;
    loading: boolean;
  } | null;
  linkStatusCode: string | null;
  onClearLinkStatus: () => void;
  onDiscordLinkChange: () => Promise<unknown>;
};

type ProfilePayload = {
  id: string;
  email?: string | null;
  fullName?: string | null;
  legalName?: string | null;
  phoneNumber?: string | null;
  address?: string | null;
  stageName?: string | null;
  spotifyUrl?: string | null;
  notifyDemos?: boolean;
  notifyEarnings?: boolean;
  notifySupport?: boolean;
  notifyContracts?: boolean;
  discordNotifyEnabled?: boolean;
  createdAt?: string | Date | null;
};

export default function ArtistProfileView({
  onSessionRefresh,
  showToast,
  showConfirm,
  discordLink,
  linkStatusCode,
  onClearLinkStatus,
  onDiscordLinkChange,
}: ArtistProfileViewProps) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<Partial<ProfilePayload>>({});
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { data: profile, isLoading } = useQuery({
    queryKey: ["dashboard", "artist", "profile"],
    queryFn: () =>
      dashboardRequestJson<ProfilePayload>("/api/profile", {
        context: "artist profile",
        retry: false,
      }),
  });

  useEffect(() => {
    if (!linkStatusCode) return;
    onClearLinkStatus();
  }, [linkStatusCode, onClearLinkStatus]);

  const oauthStatus = useMemo(() => {
    if (!linkStatusCode) return null;
    const statusMap: Record<string, { type: 'success' | 'warning' | 'danger'; text: string }> = {
      linked: { type: "success", text: "Discord account linked successfully." },
      "already-linked": { type: "warning", text: "This Discord account is already linked to another user." },
      "invalid-state": { type: "danger", text: "Discord link session expired. Please try linking again." },
      "expired-state": { type: "danger", text: "Discord link session expired. Please try linking again." },
      "missing-state": { type: "danger", text: "Invalid Discord link state." },
      "session-required": { type: "danger", text: "Please sign in again and retry linking." },
      "oauth-missing": { type: "danger", text: "Discord OAuth callback is missing required values." },
      "oauth-not-configured": { type: "danger", text: "Discord OAuth is not configured yet." },
      "bridge-disabled": { type: "danger", text: "Discord bridge is currently disabled." },
      "token-exchange-failed": { type: "danger", text: "Discord token exchange failed." },
      "identify-failed": { type: "danger", text: "Discord identity fetch failed." },
      "identify-empty": { type: "danger", text: "Discord identity payload is empty." },
      "link-failed": { type: "danger", text: "Failed to link the Discord account." },
    };
    return statusMap[linkStatusCode] || { type: "warning", text: `Discord status: ${linkStatusCode}` };
  }, [linkStatusCode]);

  const email = draft.email ?? profile?.email ?? "";
  const fullName = draft.fullName ?? profile?.fullName ?? "";
  const legalName = draft.legalName ?? profile?.legalName ?? "";
  const phoneNumber = draft.phoneNumber ?? profile?.phoneNumber ?? "";
  const address = draft.address ?? profile?.address ?? "";
  const stageName = draft.stageName ?? profile?.stageName ?? "";
  const spotifyUrl = draft.spotifyUrl ?? profile?.spotifyUrl ?? "";
  const notifyDemos = draft.notifyDemos ?? (profile?.notifyDemos !== false);
  const notifyEarnings = draft.notifyEarnings ?? (profile?.notifyEarnings !== false);
  const notifySupport = draft.notifySupport ?? (profile?.notifySupport !== false);
  const notifyContracts = draft.notifyContracts ?? (profile?.notifyContracts !== false);
  const discordNotifyEnabled = draft.discordNotifyEnabled ?? (profile?.discordNotifyEnabled !== false);

  const profileMutation = useMutation({
    mutationFn: (payload: Record<string, unknown>) =>
      dashboardRequestJson("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        context: "update profile",
        retry: false,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["dashboard", "artist", "profile"] });
      await onSessionRefresh();
    },
  });

  const passwordMutation = useMutation({
    mutationFn: () =>
      dashboardRequestJson("/api/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
        context: "update password",
        retry: false,
      }),
  });

  const handleSave = async () => {
    try {
      await profileMutation.mutateAsync({ fullName, legalName, phoneNumber, address, notifyDemos, notifyEarnings, notifySupport, notifyContracts });
      showToast("Profile updated successfully.", "success");
    } catch (error) {
      showToast(getDashboardErrorMessage(error, "Failed to save the profile."), "error");
    }
  };

  const handleDiscordNotifyToggle = async () => {
    if (!discordLink?.linked) {
      showToast("Link Discord to enable notifications.", "warning");
      return;
    }
    const nextValue = !discordNotifyEnabled;
    try {
      await profileMutation.mutateAsync({ discordNotifyEnabled: nextValue });
      setDraft((c) => ({ ...c, discordNotifyEnabled: nextValue }));
      showToast(`Discord notifications ${nextValue ? "enabled" : "disabled"}.`, "success");
    } catch (error) {
      showToast(getDashboardErrorMessage(error, "Failed to update Discord notifications."), "error");
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) { showToast("Please fill in all password fields.", "warning"); return; }
    if (newPassword !== confirmPassword) { showToast("New passwords do not match.", "warning"); return; }
    if (newPassword.length < 8) { showToast("New password must be at least 8 characters long.", "warning"); return; }
    try {
      const data = await passwordMutation.mutateAsync();
      showToast((data as { message?: string })?.message || "Password updated successfully.", "success");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword("");
    } catch (error) {
      showToast(getDashboardErrorMessage(error, "Failed to update the password."), "error");
    }
  };

  const handleStartDiscordLink = async () => {
    try {
      const data = await dashboardRequestJson<{ linked?: boolean; authorizeUrl?: string }>("/api/profile/discord-link", { method: "POST", context: "start discord link", retry: false });
      if (data?.linked) { showToast("Discord account is already linked.", "info"); await onDiscordLinkChange(); return; }
      if (!data?.authorizeUrl) { showToast("Missing Discord authorize URL.", "error"); return; }
      window.location.href = data.authorizeUrl;
    } catch (error) {
      showToast(getDashboardErrorMessage(error, "Failed to start the Discord link flow."), "error");
    }
  };

  const handleDiscordUnlink = () => {
    showConfirm(
      "Disconnect Discord?",
      `This removes your Discord account from ${process.env.NEXT_PUBLIC_SITE_NAME || "LOST"} and disables bot-linked actions until you connect again.`,
      async () => {
        try {
          await dashboardRequestJson("/api/profile/discord-link", { method: "DELETE", context: "unlink discord", retry: false });
          showToast("Discord account disconnected.", "success");
          await onDiscordLinkChange();
        } catch (error) {
          showToast(getDashboardErrorMessage(error, "Failed to unlink the Discord account."), "error");
        }
      },
    );
  };

  if (isLoading) {
    return <DashboardLoader label="LOADING PROFILE" subLabel="Preparing artist account settings..." />;
  }

  const notificationItems = [
    { label: "Demo Updates", key: "notifyDemos" as const, value: notifyDemos },
    { label: "New Contracts", key: "notifyContracts" as const, value: notifyContracts },
    { label: "Earnings Reports", key: "notifyEarnings" as const, value: notifyEarnings },
    { label: "Support Tickets", key: "notifySupport" as const, value: notifySupport },
  ];

  return (
    <div className="max-w-5xl">
      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">

        {/* ── Left: Profile Details ────────────────────── */}
        <motion.div whileHover={{ y: -1 }} transition={{ duration: 0.2 }}>
          <Card variant="default" className="ds-glass border-0">
            <Card.Header>
              <Card.Title className="text-[11px] font-black uppercase tracking-[0.2em] ds-text">
                Profile Details
              </Card.Title>
            </Card.Header>
            <Card.Content className="flex flex-col gap-5">
              {/* Email – read-only */}
              <TextField fullWidth name="email" isReadOnly value={email}>
                <Label className="text-[11px] font-black uppercase tracking-widest ds-text-label">Email Address</Label>
                <Input className="cursor-not-allowed opacity-60" />
                <p className="mt-1 text-[10px] leading-relaxed ds-text-muted">
                  Email changes are handled via support.
                </p>
              </TextField>

              <TextField fullWidth name="fullName" value={fullName} onChange={(val) => setDraft((d) => ({ ...d, fullName: val }))}>
                <Label className="text-[11px] font-black uppercase tracking-widest ds-text-label">Full Name (Legal)</Label>
                <Input />
              </TextField>

              <TextField fullWidth name="legalName" value={legalName} onChange={(val) => setDraft((d) => ({ ...d, legalName: val }))}>
                <Label className="text-[11px] font-black uppercase tracking-widest ds-text-label">Legal Name (Contract)</Label>
                <Input />
              </TextField>

              <TextField fullWidth name="phoneNumber" value={phoneNumber} onChange={(val) => setDraft((d) => ({ ...d, phoneNumber: val }))}>
                <Label className="text-[11px] font-black uppercase tracking-widest ds-text-label">Phone Number</Label>
                <Input />
              </TextField>

              <TextField fullWidth name="address" value={address} onChange={(val) => setDraft((d) => ({ ...d, address: val }))}>
                <Label className="text-[11px] font-black uppercase tracking-widest ds-text-label">Address</Label>
                <TextArea className="min-h-20 resize-y" />
              </TextField>

              {/* Locked fields */}
              {[
                { label: "Stage Name", value: stageName, help: "Contact support to change your artist name." },
                { label: "Spotify Link", value: spotifyUrl, help: "Contact support to update your Spotify link." },
              ].map((field) => (
                <div key={field.label} className="opacity-60">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-widest ds-text-label">{field.label}</span>
                    <Lock size={10} className="text-[#e44ccf]" />
                  </div>
                  <input
                    value={field.value}
                    readOnly
                    className="w-full cursor-not-allowed rounded-xl border border-[var(--ds-item-border)] bg-[var(--ds-item-bg)] px-3 py-2.5 text-[13px] ds-text-muted outline-none"
                  />
                  <p className="mt-1 text-[10px] italic ds-text-muted">{field.help}</p>
                </div>
              ))}
            </Card.Content>
            <Card.Footer>
              <Button
                variant="primary"
                className="w-full"
                onPress={handleSave}
                isDisabled={profileMutation.isPending}
              >
                {profileMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </Card.Footer>
          </Card>
        </motion.div>

        {/* ── Right column ─────────────────────────────── */}
        <div className="flex flex-col gap-5">
          {/* Discord */}
          <motion.div whileHover={{ y: -1 }} transition={{ duration: 0.2 }}>
            <Card variant="default" className="ds-glass border-0">
              <Card.Content className="p-5">
                <DiscordAccountPanel
                  discordLink={discordLink}
                  oauthStatus={oauthStatus}
                  linking={false}
                  unlinking={false}
                  discordNotifyEnabled={discordNotifyEnabled}
                  onStartLink={handleStartDiscordLink}
                  onUnlink={handleDiscordUnlink}
                  onToggleNotifications={handleDiscordNotifyToggle}
                />
              </Card.Content>
            </Card>
          </motion.div>

          {/* Security */}
          <motion.div whileHover={{ y: -1 }} transition={{ duration: 0.2 }}>
            <Card variant="default" className="ds-glass border-0">
              <Card.Header>
                <Card.Title className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] ds-text">
                  <Shield size={13} className="text-[#e44ccf]" /> Security
                </Card.Title>
              </Card.Header>
              <Card.Content className="flex flex-col gap-4">
                <TextField fullWidth name="currentPassword" type="password" value={currentPassword} onChange={setCurrentPassword}>
                  <Label className="text-[11px] font-black uppercase tracking-widest ds-text-label">Current Password</Label>
                  <Input placeholder="••••••••" />
                </TextField>
                <TextField fullWidth name="newPassword" type="password" value={newPassword} onChange={setNewPassword}>
                  <Label className="text-[11px] font-black uppercase tracking-widest ds-text-label">New Password</Label>
                  <Input placeholder="••••••••" />
                </TextField>
                <TextField fullWidth name="confirmPassword" type="password" value={confirmPassword} onChange={setConfirmPassword}>
                  <Label className="text-[11px] font-black uppercase tracking-widest ds-text-label">Confirm Password</Label>
                  <Input placeholder="••••••••" />
                </TextField>
              </Card.Content>
              <Card.Footer>
                <Button
                  variant="secondary"
                  className="w-full"
                  onPress={handlePasswordChange}
                  isDisabled={passwordMutation.isPending}
                >
                  {passwordMutation.isPending ? "Updating..." : "Update Password"}
                </Button>
              </Card.Footer>
            </Card>
          </motion.div>

          {/* Notifications */}
          <motion.div whileHover={{ y: -1 }} transition={{ duration: 0.2 }}>
            <Card variant="default" className="ds-glass border-0">
              <Card.Header>
                <Card.Title className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] ds-text">
                  <Bell size={13} className="ds-text-muted" /> Notifications
                </Card.Title>
              </Card.Header>
              <Card.Content className="flex flex-col gap-3">
                {notificationItems.map((item) => (
                  <div
                    key={item.key}
                    className="ds-item flex items-center justify-between rounded-2xl px-4 py-3"
                  >
                    <span className="text-[12px] font-bold ds-text-sub">{item.label}</span>
                    <Switch
                      isSelected={item.value}
                      onChange={(val) => setDraft((d) => ({ ...d, [item.key]: val }))}
                    >
                      <Switch.Control>
                        <Switch.Thumb />
                      </Switch.Control>
                    </Switch>
                  </div>
                ))}
              </Card.Content>
            </Card>
          </motion.div>
        </div>
      </div>

      {profile?.createdAt && (
        <p className="mt-6 text-center text-[11px] ds-text-faint">
          Member since: {new Date(profile.createdAt).toLocaleDateString()}
        </p>
      )}
    </div>
  );
}
