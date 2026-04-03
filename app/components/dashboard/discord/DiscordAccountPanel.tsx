"use client";

import { Bell, CheckCircle, Link2, Unlink } from "lucide-react";
import { Alert, Button, Chip, Label, Switch } from "@heroui/react";

interface DiscordLink {
    linked?: boolean;
    discordUserId?: string | null;
    discordUsername?: string | null;
    linkedAt?: string | null;
}

interface OAuthStatus {
    type: 'success' | 'warning' | 'danger';
    text: string;
}

interface DiscordAccountPanelProps {
    discordLink: DiscordLink | null;
    oauthStatus: OAuthStatus | null;
    linking: boolean;
    unlinking: boolean;
    discordNotifyEnabled: boolean;
    onStartLink: () => void;
    onUnlink: () => void;
    onToggleNotifications: () => void;
}

export default function DiscordAccountPanel({
    discordLink,
    oauthStatus,
    linking,
    unlinking,
    discordNotifyEnabled,
    onStartLink,
    onUnlink,
    onToggleNotifications,
}: DiscordAccountPanelProps) {
    const alertColor = oauthStatus?.type === "success"
        ? "success"
        : oauthStatus?.type === "warning"
            ? "warning"
            : "danger";

    return (
        <div className="flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-center gap-2.5">
                <Link2 size={13} className="text-[#e44ccf]" />
                <span className="text-[11px] font-black uppercase tracking-[0.2em] ds-text">
                    Discord Account
                </span>
            </div>

            {/* OAuth status alert */}
            {oauthStatus && (
                <Alert color={alertColor} variant="soft">
                    <Alert.Description>{oauthStatus.text}</Alert.Description>
                </Alert>
            )}

            {/* Connection info */}
            <div className="ds-item rounded-2xl p-4">
                <div className="mb-3 flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-widest ds-text">
                        {discordLink?.linked ? "Connected" : "Not Connected"}
                    </span>
                    {discordLink?.linked && (
                        <Chip size="sm" variant="soft" color="success">
                            <Chip.Label className="flex items-center gap-1">
                                <CheckCircle size={10} /> Verified
                            </Chip.Label>
                        </Chip>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    {[
                        { label: "Discord Username", value: discordLink?.discordUsername || "—" },
                        { label: "Discord ID", value: discordLink?.discordUserId || "—" },
                        { label: "Linked At", value: discordLink?.linkedAt ? new Date(discordLink.linkedAt).toLocaleString() : "—" },
                    ].map((row) => (
                        <div key={row.label} className="flex items-center justify-between">
                            <span className="text-[11px] ds-text-label">{row.label}</span>
                            <span className="text-[11px] font-bold ds-text">{row.value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Link / Unlink buttons */}
            <div className="grid grid-cols-2 gap-2.5">
                <Button
                    variant="primary"
                    size="sm"
                    onPress={onStartLink}
                    isDisabled={linking}
                    className="w-full"
                >
                    {linking ? "Redirecting..." : "Link Discord"}
                </Button>
                <Button
                    variant="secondary"
                    size="sm"
                    onPress={onUnlink}
                    isDisabled={unlinking || !discordLink?.linked}
                    className="w-full"
                >
                    <Unlink size={12} />
                    {unlinking ? "Unlinking..." : "Unlink"}
                </Button>
            </div>

            {/* DM Notifications toggle */}
            <div className={`ds-item flex items-center justify-between rounded-2xl px-4 py-3 transition-opacity ${!discordLink?.linked ? "pointer-events-none opacity-50" : ""}`}>
                <div className="flex items-center gap-2.5">
                    <Bell size={13} className={discordNotifyEnabled ? "text-emerald-400" : "ds-text-muted"} />
                    <Label className="cursor-pointer text-[12px] font-bold ds-text-sub">
                        Discord DM Notifications
                    </Label>
                </div>
                <Switch
                    isSelected={discordNotifyEnabled}
                    onChange={onToggleNotifications}
                    isDisabled={!discordLink?.linked}
                >
                    <Switch.Control>
                        <Switch.Thumb />
                    </Switch.Control>
                </Switch>
            </div>

            {!discordLink?.linked && (
                <p className="text-center text-[10px] ds-text-faint">
                    Link Discord to enable DM notifications
                </p>
            )}
        </div>
    );
}
