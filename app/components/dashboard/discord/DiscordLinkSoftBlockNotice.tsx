"use client";

import { AlertCircle, Link2 } from "lucide-react";
import { Alert, Button } from "@heroui/react";

interface DiscordLinkSoftBlockNoticeProps {
    title: string;
    message: string;
    onLink: () => void;
}

export default function DiscordLinkSoftBlockNotice({
    title,
    message,
    onLink,
}: DiscordLinkSoftBlockNoticeProps) {
    return (
        <Alert color="warning" className="mb-3">
            <div className="flex items-center justify-between gap-3 w-full">
                <div className="flex items-center gap-2.5 min-w-0">
                    <AlertCircle size={16} className="shrink-0" />
                    <div className="min-w-0">
                        <p className="text-[11px] font-black tracking-wider">{title}</p>
                        <p className="text-[11px] ds-text-muted mt-0.5">{message}</p>
                    </div>
                </div>
                <Button size="sm" variant="secondary" onPress={onLink} className="shrink-0">
                    <Link2 size={12} /> LINK NOW
                </Button>
            </div>
        </Alert>
    );
}
