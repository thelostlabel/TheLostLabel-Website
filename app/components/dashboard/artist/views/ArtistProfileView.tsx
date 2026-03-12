"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Lock, Shield } from "lucide-react";
import { motion } from "framer-motion";

import {
  dashboardRequestJson,
  getDashboardErrorMessage,
} from "@/app/components/dashboard/lib/dashboard-request";
import DashboardLoader from "@/app/components/dashboard/DashboardLoader";
import DiscordAccountPanel from "@/app/components/dashboard/discord/DiscordAccountPanel";
import {
  DASHBOARD_THEME,
  btnStyle,
  inputStyle,
} from "@/app/components/dashboard/artist/lib/shared";

type ArtistProfileViewProps = {
  onSessionRefresh: () => Promise<void>;
  showToast: (message: string, type?: string) => void;
  showConfirm: (
    title: string,
    message: string,
    onConfirm: () => void | Promise<void>,
    onCancel?: () => void,
  ) => void;
  discordLink: Record<string, unknown> | null;
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

    const statusMap: Record<string, { type: string; text: string }> = {
      linked: { type: "success", text: "Discord account linked successfully." },
      "already-linked": { type: "warning", text: "This Discord account is already linked to another user." },
      "invalid-state": { type: "error", text: "Discord link session expired. Please try linking again." },
      "expired-state": { type: "error", text: "Discord link session expired. Please try linking again." },
      "missing-state": { type: "error", text: "Invalid Discord link state." },
      "session-required": { type: "error", text: "Please sign in again and retry linking." },
      "oauth-missing": { type: "error", text: "Discord OAuth callback is missing required values." },
      "oauth-not-configured": { type: "error", text: "Discord OAuth is not configured yet." },
      "bridge-disabled": { type: "error", text: "Discord bridge is currently disabled." },
      "token-exchange-failed": { type: "error", text: "Discord token exchange failed." },
      "identify-failed": { type: "error", text: "Discord identity fetch failed." },
      "identify-empty": { type: "error", text: "Discord identity payload is empty." },
      "link-failed": { type: "error", text: "Failed to link the Discord account." },
    };

    return (
      statusMap[linkStatusCode] || {
        type: "warning",
        text: `Discord status: ${linkStatusCode}`,
      }
    );
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
  const discordNotifyEnabled =
    draft.discordNotifyEnabled ?? (profile?.discordNotifyEnabled !== false);

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
      await profileMutation.mutateAsync({
        fullName,
        legalName,
        phoneNumber,
        address,
        notifyDemos,
        notifyEarnings,
        notifySupport,
        notifyContracts,
      });
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
      setDraft((current) => ({ ...current, discordNotifyEnabled: nextValue }));
      showToast(`Discord notifications ${nextValue ? "enabled" : "disabled"}.`, "success");
    } catch (error) {
      showToast(getDashboardErrorMessage(error, "Failed to update Discord notifications."), "error");
    }
  };

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      showToast("Please fill in all password fields.", "warning");
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast("New passwords do not match.", "warning");
      return;
    }
    if (newPassword.length < 8) {
      showToast("New password must be at least 8 characters long.", "warning");
      return;
    }

    try {
      const data = await passwordMutation.mutateAsync();
      showToast((data as { message?: string })?.message || "Password updated successfully.", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      showToast(getDashboardErrorMessage(error, "Failed to update the password."), "error");
    }
  };

  const handleStartDiscordLink = async () => {
    try {
      const data = await dashboardRequestJson<{ linked?: boolean; authorizeUrl?: string }>("/api/profile/discord-link", {
        method: "POST",
        context: "start discord link",
        retry: false,
      });

      if (data?.linked) {
        showToast("Discord account is already linked.", "info");
        await onDiscordLinkChange();
        return;
      }

      if (!data?.authorizeUrl) {
        showToast("Missing Discord authorize URL.", "error");
        return;
      }

      window.location.href = data.authorizeUrl;
    } catch (error) {
      showToast(getDashboardErrorMessage(error, "Failed to start the Discord link flow."), "error");
    }
  };

  const handleDiscordUnlink = () => {
    showConfirm(
      "Disconnect Discord?",
      "This removes your Discord account from LOST and disables bot-linked actions until you connect again.",
      async () => {
        try {
          await dashboardRequestJson("/api/profile/discord-link", {
            method: "DELETE",
            context: "unlink discord",
            retry: false,
          });
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

  const labelStyle = {
    display: "block",
    fontSize: "12px",
    letterSpacing: "0.8px",
    color: DASHBOARD_THEME.muted,
    marginBottom: "8px",
    fontWeight: 800,
  };

  return (
    <div style={{ maxWidth: "1000px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "30px" }}>
        <motion.div whileHover={{ y: -2 }} style={{ background: DASHBOARD_THEME.surfaceElevated, border: `1px solid ${DASHBOARD_THEME.border}`, borderRadius: "12px", padding: "40px", height: "fit-content" }}>
          <h3 style={{ fontSize: "12px", letterSpacing: "3px", fontWeight: 900, color: "#fff", marginBottom: "25px", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "15px" }}>
            Profile Details
          </h3>

          {[
            {
              label: "Email Address",
              value: email,
              readOnly: true,
              type: "email",
              help: "Email changes are handled separately during verification or through support.",
            },
            { label: "Full Name (Legal)", value: fullName, key: "fullName" },
            { label: "Legal Name (Contract)", value: legalName, key: "legalName" },
            { label: "Phone Number", value: phoneNumber, key: "phoneNumber" },
          ].map((field) => (
            <div key={field.label} style={{ marginBottom: "25px" }}>
              <label style={labelStyle}>{field.label}</label>
              <input
                type={field.type || "text"}
                value={field.value}
                onChange={(event) => {
                  if (!field.key) return;
                  setDraft((current) => ({ ...current, [field.key]: event.target.value }));
                }}
                readOnly={field.readOnly}
                style={{ ...inputStyle, color: field.readOnly ? "#888" : "#fff", cursor: field.readOnly ? "not-allowed" : "text" }}
              />
              {field.help ? (
                <div style={{ fontSize: "10px", color: "#666", marginTop: "8px", lineHeight: "1.5" }}>
                  {field.help}
                </div>
              ) : null}
            </div>
          ))}

          <div style={{ marginBottom: "25px" }}>
            <label style={labelStyle}>Address</label>
            <textarea
              value={address}
              onChange={(event) =>
                setDraft((current) => ({ ...current, address: event.target.value }))
              }
              style={{ ...inputStyle, minHeight: "90px", resize: "vertical" }}
            />
          </div>

          {[
            { label: "Stage Name", value: stageName, help: "Contact support to change your artist name." },
            { label: "Spotify Link", value: spotifyUrl, help: "Contact support to update your Spotify link." },
          ].map((field) => (
            <div key={field.label} style={{ marginBottom: "30px", opacity: 0.7 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>{field.label}</label>
                <Lock size={10} color="var(--accent)" />
              </div>
              <input value={field.value} readOnly style={{ ...inputStyle, cursor: "not-allowed", borderColor: "rgba(255,255,255,0.05)" }} />
              <p style={{ fontSize: "12px", color: DASHBOARD_THEME.muted, marginTop: "6px", fontStyle: "italic" }}>
                {field.help}
              </p>
            </div>
          ))}

          <button
            onClick={handleSave}
            disabled={profileMutation.isPending}
            style={{ ...btnStyle, background: DASHBOARD_THEME.accent, color: "#071311", border: "none", width: "100%", padding: "15px", opacity: profileMutation.isPending ? 0.6 : 1 }}
          >
            {profileMutation.isPending ? "Saving..." : "Save Changes"}
          </button>
        </motion.div>

        <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
          <motion.div whileHover={{ y: -2 }} style={{ background: DASHBOARD_THEME.surfaceElevated, border: `1px solid ${DASHBOARD_THEME.border}`, borderRadius: "12px", padding: "30px" }}>
            <DiscordAccountPanel
              discordLink={discordLink}
              oauthStatus={oauthStatus}
              linking={false}
              unlinking={false}
              discordNotifyEnabled={discordNotifyEnabled}
              onStartLink={handleStartDiscordLink}
              onUnlink={handleDiscordUnlink}
              onToggleNotifications={handleDiscordNotifyToggle}
              theme={DASHBOARD_THEME}
              buttonStyle={btnStyle}
            />
          </motion.div>

          <motion.div whileHover={{ y: -2 }} style={{ background: DASHBOARD_THEME.surfaceElevated, border: `1px solid ${DASHBOARD_THEME.border}`, borderRadius: "12px", padding: "30px" }}>
            <h3 style={{ fontSize: "12px", letterSpacing: "3px", fontWeight: 900, color: "#fff", marginBottom: "25px", display: "flex", alignItems: "center", gap: "10px" }}>
              <Shield size={14} color="var(--accent)" /> Security
            </h3>

            {[
              { label: "Current Password", value: currentPassword, setValue: setCurrentPassword },
              { label: "New Password", value: newPassword, setValue: setNewPassword },
              { label: "Confirm Password", value: confirmPassword, setValue: setConfirmPassword },
            ].map((field) => (
              <div key={field.label} style={{ marginBottom: "20px" }}>
                <label style={labelStyle}>{field.label}</label>
                <input type="password" value={field.value} onChange={(event) => field.setValue(event.target.value)} style={inputStyle} placeholder="••••••••" />
              </div>
            ))}

            <button
              onClick={handlePasswordChange}
              disabled={passwordMutation.isPending}
              style={{ width: "100%", padding: "12px", background: DASHBOARD_THEME.surfaceSoft, border: `1px solid ${DASHBOARD_THEME.border}`, color: "#fff", fontSize: "12px", fontWeight: 900, letterSpacing: "0.8px", cursor: passwordMutation.isPending ? "wait" : "pointer", opacity: passwordMutation.isPending ? 0.5 : 1 }}
            >
              {passwordMutation.isPending ? "Updating..." : "Update Password"}
            </button>
          </motion.div>

          <motion.div whileHover={{ y: -2 }} style={{ background: DASHBOARD_THEME.surfaceElevated, border: `1px solid ${DASHBOARD_THEME.border}`, borderRadius: "12px", padding: "30px" }}>
            <h3 style={{ fontSize: "12px", letterSpacing: "3px", fontWeight: 900, color: "#fff", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px" }}>
              <Bell size={14} color="#fff" /> Notifications
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {[
                { label: "Demo Updates", state: notifyDemos, key: "notifyDemos" },
                { label: "New Contracts", state: notifyContracts, key: "notifyContracts" },
                { label: "Earnings Reports", state: notifyEarnings, key: "notifyEarnings" },
                { label: "Support Tickets", state: notifySupport, key: "notifySupport" },
              ].map((item) => (
                <div
                  key={item.label}
                  onClick={() =>
                    setDraft((current) => ({ ...current, [item.key]: !item.state }))
                  }
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", borderRadius: "6px", background: DASHBOARD_THEME.surfaceSoft, border: `1px solid ${DASHBOARD_THEME.border}`, cursor: "pointer" }}
                >
                  <span style={{ fontSize: "12px", fontWeight: 800, color: DASHBOARD_THEME.muted }}>{item.label}</span>
                  <div style={{ width: "32px", height: "18px", borderRadius: "10px", background: item.state ? "var(--status-success)" : "rgba(255,255,255,0.1)", position: "relative" }}>
                    <div style={{ position: "absolute", top: "2px", left: item.state ? "16px" : "2px", width: "14px", height: "14px", borderRadius: "50%", background: "#fff" }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      <p style={{ marginTop: "30px", fontSize: "12px", color: DASHBOARD_THEME.muted, textAlign: "center", letterSpacing: "0.6px" }}>
        Member since: {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : "Unknown"}
      </p>
    </div>
  );
}
