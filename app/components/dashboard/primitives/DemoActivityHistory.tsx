"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@heroui/react";
import { Activity, Clock } from "lucide-react";

interface ActivityLog {
    id: string;
    action: string;
    userId: string;
    details?: string | null;
    createdAt: string;
    user: {
        id: string;
        email: string | null;
        stageName: string | null;
    };
}

interface DemoActivityHistoryProps {
    demoId: string;
}

const ACTION_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
    approve: { label: "APPROVED", color: "text-success", dot: "border-success bg-success" },
    reject: { label: "REJECTED", color: "text-danger", dot: "border-danger bg-danger" },
    finalize: { label: "FINALIZED", color: "text-accent", dot: "border-accent bg-accent" },
    update: { label: "UPDATED", color: "text-default-400", dot: "border-default-300 bg-default-200" },
    review: { label: "STAGE CHANGED", color: "text-warning", dot: "border-warning bg-warning" },
    submit: { label: "SUBMITTED", color: "text-primary", dot: "border-primary bg-primary" },
};

function getActionConfig(action: string) {
    return ACTION_CONFIG[action] ?? { label: action.toUpperCase(), color: "text-default-400", dot: "border-default-300 bg-default-200" };
}

function formatDate(dateString: string) {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "Unknown date";
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function DemoActivityHistory({ demoId }: DemoActivityHistoryProps) {
    const [logs, setLogs] = useState<ActivityLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`/api/demo/${demoId}/history`);
            if (!res.ok) {
                const data = await res.json().catch(() => null);
                setError(data?.error || "Failed to load activity");
                return;
            }
            const data: ActivityLog[] = await res.json();
            setLogs(data);
            setError(null);
        } catch {
            setError("Failed to load activity history");
        } finally {
            setLoading(false);
        }
    }, [demoId]);

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-10 gap-2">
                <Clock size={14} className="text-default-400 animate-pulse" />
                <span className="text-xs font-semibold text-default-400 tracking-wide">
                    LOADING ACTIVITY...
                </span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
                <span className="text-xs font-semibold text-danger tracking-wide">{error}</span>
                <Button size="sm" variant="ghost" onPress={fetchLogs}>Retry</Button>
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="w-10 h-10 rounded-full border border-dashed border-default-200 flex items-center justify-center">
                    <Activity size={18} className="text-default-400" />
                </div>
                <p className="text-xs font-bold text-default-400 tracking-widest uppercase">
                    No activity yet
                </p>
                <p className="text-[11px] text-default-300">
                    Actions taken by the team will appear here.
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-0">
            {logs.map((log, index) => {
                const isLast = index === logs.length - 1;
                const cfg = getActionConfig(log.action);
                let parsedDetails: Record<string, unknown> | null = null;
                try {
                    if (log.details) parsedDetails = JSON.parse(log.details);
                } catch {}

                const actor = log.user.stageName || log.user.email || log.userId;

                return (
                    <div key={log.id} className="relative flex gap-4">
                        {/* Timeline */}
                        <div className="flex flex-col items-center shrink-0 w-5">
                            <div className={`w-2.5 h-2.5 rounded-full border-2 shrink-0 mt-1 ${cfg.dot}`} />
                            {!isLast && <div className="w-px flex-1 bg-default-200 min-h-[20px]" />}
                        </div>

                        {/* Content */}
                        <div className="flex-1 pb-5 min-w-0">
                            <div className="flex items-start justify-between gap-2 flex-wrap">
                                <span className={`text-[11px] font-black tracking-widest ${cfg.color}`}>
                                    {cfg.label}
                                </span>
                                <span className="text-[10px] text-default-300 shrink-0">
                                    {formatDate(log.createdAt)}
                                </span>
                            </div>

                            <p className="text-[11px] text-default-400 font-semibold mt-0.5 truncate">
                                by {actor}
                            </p>

                            {/* Rejection reason */}
                            {parsedDetails?.rejectionReason && (
                                <p className="mt-1.5 text-[11px] text-default-300 bg-default-50 border border-default-100 rounded px-2 py-1.5 whitespace-pre-wrap">
                                    {String(parsedDetails.rejectionReason)}
                                </p>
                            )}

                            {/* Review stage change */}
                            {parsedDetails?.stage && (
                                <p className="mt-1 text-[11px] text-default-400">
                                    → <span className="font-bold text-default-300">{String(parsedDetails.stage).toUpperCase()}</span>
                                </p>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
