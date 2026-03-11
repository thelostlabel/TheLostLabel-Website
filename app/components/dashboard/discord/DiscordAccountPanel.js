"use client";

import { Bell, CheckCircle, Link2, Unlink } from "lucide-react";

export default function DiscordAccountPanel({
    discordLink,
    oauthStatus,
    linking,
    unlinking,
    discordNotifyEnabled,
    onStartLink,
    onUnlink,
    onToggleNotifications,
    theme,
    buttonStyle
}) {
    return (
        <>
            <h3 style={{ fontSize: '12px', letterSpacing: '3px', fontWeight: '900', color: '#fff', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Link2 size={14} color="var(--accent)" /> DISCORD ACCOUNT
            </h3>

            {oauthStatus && (
                <div style={{
                    marginBottom: '16px',
                    borderRadius: '8px',
                    border: `1px solid ${oauthStatus.type === 'success' ? 'rgba(34,197,94,0.45)' : oauthStatus.type === 'warning' ? 'rgba(250,204,21,0.4)' : 'rgba(239,68,68,0.4)'}`,
                    background: oauthStatus.type === 'success' ? 'rgba(34,197,94,0.10)' : oauthStatus.type === 'warning' ? 'rgba(250,204,21,0.10)' : 'rgba(239,68,68,0.10)',
                    color: '#e5e7eb',
                    padding: '10px 12px',
                    fontSize: '12px',
                    fontWeight: '700'
                }}>
                    {oauthStatus.text}
                </div>
            )}

            <div style={{ border: `1px solid ${theme.border}`, borderRadius: '8px', padding: '12px', background: theme.surfaceSoft }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '11px', fontWeight: '900', color: '#fff', letterSpacing: '1px' }}>
                        {discordLink?.linked ? 'CONNECTED' : 'NOT CONNECTED'}
                    </span>
                    {discordLink?.linked ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 8px', fontSize: '10px', fontWeight: '900', borderRadius: '999px', color: '#bbf7d0', border: '1px solid rgba(34,197,94,0.45)', background: 'rgba(34,197,94,0.15)' }}>
                            <CheckCircle size={11} /> VERIFIED
                        </span>
                    ) : null}
                </div>

                <div style={{ display: 'grid', gap: '6px', fontSize: '12px', color: theme.muted }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Discord Username</span>
                        <span style={{ color: '#fff', fontWeight: '800' }}>{discordLink?.discordUsername || '-'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Discord ID</span>
                        <span style={{ color: '#fff', fontWeight: '800' }}>{discordLink?.discordUserId || '-'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span>Linked At</span>
                        <span style={{ color: '#fff', fontWeight: '800' }}>
                            {discordLink?.linkedAt ? new Date(discordLink.linkedAt).toLocaleString() : '-'}
                        </span>
                    </div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '14px' }}>
                <button
                    type="button"
                    onClick={onStartLink}
                    disabled={linking}
                    style={{ ...buttonStyle, background: theme.accent, color: '#071311', border: 'none', flex: 1, justifyContent: 'center', opacity: linking ? 0.7 : 1 }}
                >
                    {linking ? 'REDIRECTING...' : 'LINK DISCORD'}
                </button>
                <button
                    type="button"
                    onClick={onUnlink}
                    disabled={unlinking || !discordLink?.linked}
                    style={{ ...buttonStyle, flex: 1, justifyContent: 'center', opacity: (unlinking || !discordLink?.linked) ? 0.5 : 1 }}
                >
                    <Unlink size={13} /> {unlinking ? 'UNLINKING...' : 'UNLINK'}
                </button>
            </div>

            <div
                onClick={onToggleNotifications}
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginTop: '14px', padding: '12px 14px', borderRadius: '8px',
                    background: theme.surfaceSoft, border: `1px solid ${theme.border}`,
                    cursor: discordLink?.linked ? 'pointer' : 'not-allowed',
                    opacity: discordLink?.linked ? 1 : 0.5
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Bell size={14} style={{ color: discordNotifyEnabled ? theme.success : theme.muted }} />
                    <span style={{ fontSize: '12px', fontWeight: '800', color: theme.muted }}>
                        DISCORD DM NOTIFICATIONS
                    </span>
                </div>
                <div style={{
                    width: '36px', height: '20px', borderRadius: '12px',
                    background: discordNotifyEnabled ? 'var(--status-success)' : 'rgba(255,255,255,0.1)',
                    position: 'relative', transition: 'background 0.2s'
                }}>
                    <div style={{
                        position: 'absolute', top: '2px', left: discordNotifyEnabled ? '18px' : '2px',
                        width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
                        transition: 'left 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                    }} />
                </div>
            </div>
            {!discordLink?.linked && (
                <p style={{ fontSize: '10px', color: theme.muted, marginTop: '8px', textAlign: 'center' }}>
                    Link Discord to enable DM notifications
                </p>
            )}
        </>
    );
}
