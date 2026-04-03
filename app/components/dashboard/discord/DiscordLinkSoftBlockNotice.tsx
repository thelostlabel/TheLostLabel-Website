"use client";

import { AlertCircle, Link2 } from "lucide-react";
import type { CSSProperties } from "react";

interface DiscordLinkSoftBlockNoticeProps {
    title: string;
    message: string;
    onLink: () => void;
    buttonStyle?: CSSProperties;
}

export default function DiscordLinkSoftBlockNotice({
    title,
    message,
    onLink,
    buttonStyle = {},
}: DiscordLinkSoftBlockNoticeProps) {
    return (
        <div style={{
            marginBottom: '12px',
            padding: '14px 16px',
            borderRadius: '12px',
            border: '1px solid rgba(250, 204, 21, 0.35)',
            background: 'linear-gradient(160deg, rgba(250, 204, 21, 0.12), rgba(255, 255, 255, 0.02))',
            display: 'flex',
            gap: '12px',
            alignItems: 'center',
            justifyContent: 'space-between'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <AlertCircle size={16} color="#facc15" />
                <div>
                    <div style={{ fontSize: '11px', fontWeight: '900', color: '#fff', letterSpacing: '1px' }}>{title}</div>
                    <div style={{ fontSize: '11px', color: '#d1d5db', marginTop: '3px' }}>{message}</div>
                </div>
            </div>
            <button
                type="button"
                onClick={onLink}
                style={buttonStyle}
            >
                <Link2 size={12} /> LINK NOW
            </button>
        </div>
    );
}
