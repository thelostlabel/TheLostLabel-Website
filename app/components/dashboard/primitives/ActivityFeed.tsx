"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle, XCircle, Upload, CreditCard, FileText, UserPlus,
  Send, Eye, Edit3, Trash2, RefreshCw, Activity,
} from "lucide-react";
import { dashboardRequestJson } from "@/app/components/dashboard/lib/dashboard-request";

type AuditEntry = {
  id: string;
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  createdAt: string;
  user?: { email?: string; stageName?: string };
};

const ACTION_ICONS: Record<string, { icon: typeof Activity; color: string }> = {
  approve: { icon: CheckCircle, color: "text-green-400" },
  approved: { icon: CheckCircle, color: "text-green-400" },
  reject: { icon: XCircle, color: "text-red-400" },
  rejected: { icon: XCircle, color: "text-red-400" },
  create: { icon: Upload, color: "text-blue-400" },
  created: { icon: Upload, color: "text-blue-400" },
  payment: { icon: CreditCard, color: "text-emerald-400" },
  paid: { icon: CreditCard, color: "text-emerald-400" },
  invoice: { icon: FileText, color: "text-amber-400" },
  send: { icon: Send, color: "text-blue-400" },
  sent: { icon: Send, color: "text-blue-400" },
  view: { icon: Eye, color: "text-purple-400" },
  update: { icon: Edit3, color: "text-yellow-400" },
  updated: { icon: Edit3, color: "text-yellow-400" },
  delete: { icon: Trash2, color: "text-red-400" },
  deleted: { icon: Trash2, color: "text-red-400" },
  register: { icon: UserPlus, color: "text-cyan-400" },
};

function getActionConfig(action: string) {
  const key = action.toLowerCase().split("_").pop() || action;
  for (const [match, config] of Object.entries(ACTION_ICONS)) {
    if (key.includes(match)) return config;
  }
  return { icon: Activity, color: "ds-text-muted" };
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function ActivityFeed({ limit = 15 }: { limit?: number }) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    try {
      const data = (await dashboardRequestJson(
        `/api/admin/audit-logs?limit=${limit}`,
        { context: "activity feed" },
      )) as { logs?: AuditEntry[] };
      setEntries(data.logs || []);
    } catch {
      // Silently fail — activity feed is non-critical
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-10">
        <RefreshCw size={16} className="animate-spin ds-text-faint" />
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="py-8 text-center text-[11px] font-black uppercase tracking-widest ds-text-faint">
        No recent activity
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {entries.map((entry, i) => {
        const config = getActionConfig(entry.action);
        const Icon = config.icon;
        const userName = entry.user?.stageName || entry.user?.email?.split("@")[0] || "System";
        const description = entry.details
          ? entry.details.length > 80 ? entry.details.slice(0, 80) + "..." : entry.details
          : `${entry.action} on ${entry.entity}`;

        return (
          <motion.div
            key={entry.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.03, duration: 0.25 }}
            className="group flex items-start gap-3 border-b border-border/20 px-4 py-3 last:border-b-0 transition-colors hover:bg-default/5"
          >
            {/* Timeline dot */}
            <div className="relative mt-0.5 flex flex-col items-center">
              <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-default/10 ${config.color}`}>
                <Icon size={13} />
              </div>
              {i < entries.length - 1 && (
                <div className="mt-1 w-px flex-1 min-h-3 bg-border/20" />
              )}
            </div>

            {/* Content */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black ds-text-sub">{userName}</span>
                <span className="rounded border border-border/30 bg-default/5 px-1.5 py-0 text-[9px] font-bold uppercase tracking-wider ds-text-faint">
                  {entry.action.replace(/_/g, " ")}
                </span>
              </div>
              <p className="mt-0.5 text-[11px] ds-text-muted leading-relaxed">{description}</p>
              {entry.entityId && (
                <span className="text-[9px] font-mono ds-text-faint">
                  {entry.entity}:{entry.entityId.slice(0, 8)}
                </span>
              )}
            </div>

            {/* Time */}
            <span className="shrink-0 text-[10px] font-bold ds-text-faint mt-0.5">
              {timeAgo(entry.createdAt)}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
