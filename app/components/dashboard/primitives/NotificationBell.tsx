"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Check,
  CheckCheck,
  DollarSign,
  FileText,
  MessageCircle,
  Music,
} from "lucide-react";
import { cn } from "@heroui/react";
import { useNotifications } from "@/app/components/dashboard/hooks/useNotifications";
import { useDashboardRoute } from "@/app/components/dashboard/hooks/useDashboardRoute";

const TYPE_ICON_MAP: Record<string, React.ElementType> = {
  demo_submitted: Music,
  payment_approved: DollarSign,
  contract_created: FileText,
  request_updated: MessageCircle,
};

function getTypeIcon(type: string) {
  const Icon = TYPE_ICON_MAP[type] ?? Bell;
  return <Icon size={14} />;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function NotificationBell() {
  const { notifications, unreadCount, isLoading, markAsRead, markAllAsRead } =
    useNotifications();
  const { setView } = useDashboardRoute();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  const handleNotificationClick = useCallback(
    async (notification: { id: string; read: boolean; link: string | null }) => {
      if (!notification.read) {
        await markAsRead(notification.id);
      }
      if (notification.link) {
        // Links are in the format "?view=submissions" — extract the view name
        const params = new URLSearchParams(notification.link.replace(/^\?/, ""));
        const view = params.get("view");
        if (view) {
          setView(view, { preserveRecordId: false });
        }
      }
      setIsOpen(false);
    },
    [markAsRead, setView],
  );

  return (
    <div ref={containerRef} className="relative">
      {/* Bell button */}
      <button
        type="button"
        onClick={() => setIsOpen((p) => !p)}
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        className="ds-item relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ds-text-muted transition-colors hover:bg-[var(--ds-item-bg-hover)] hover:text-[var(--ds-text)]"
      >
        <Bell size={15} />

        {/* Unread badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className={cn(
                "absolute -top-0.5 -right-0.5 flex items-center justify-center rounded-full bg-red-500 text-white",
                "text-[9px] font-bold leading-none",
                unreadCount > 9 ? "h-4 min-w-4 px-0.5" : "h-3.5 w-3.5",
              )}
            >
              <motion.span
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </motion.span>
            </motion.span>
          )}
        </AnimatePresence>
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="ds-glass absolute right-0 top-[calc(100%+8px)] z-50 w-80 overflow-hidden rounded-2xl border border-[var(--ds-divider)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--ds-divider)] px-4 py-3">
              <span className="text-[11px] font-extrabold tracking-widest uppercase ds-text">
                Notifications
              </span>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllAsRead()}
                  className="flex items-center gap-1 border-0 bg-transparent text-[10px] font-bold tracking-wider uppercase ds-text-muted cursor-pointer transition-colors hover:text-[var(--ds-text)]"
                >
                  <CheckCheck size={12} />
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto">
              {isLoading && notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-[11px] font-semibold ds-text-muted">
                  Loading...
                </div>
              ) : notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-[11px] font-semibold ds-text-muted">
                  No notifications yet
                </div>
              ) : (
                notifications.map((notification) => (
                  <button
                    key={notification.id}
                    type="button"
                    onClick={() => handleNotificationClick(notification)}
                    className={cn(
                      "flex w-full items-start gap-3 border-0 px-4 py-3 text-left cursor-pointer transition-colors",
                      notification.read
                        ? "bg-transparent hover:bg-[var(--ds-item-bg)]"
                        : "bg-[var(--ds-item-bg)] hover:bg-[var(--ds-item-bg-hover)]",
                    )}
                  >
                    {/* Type icon */}
                    <span
                      className={cn(
                        "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg",
                        notification.read
                          ? "bg-[var(--ds-item-bg)] ds-text-muted"
                          : "bg-[var(--ds-item-bg-hover)] ds-text",
                      )}
                    >
                      {getTypeIcon(notification.type)}
                    </span>

                    {/* Content */}
                    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                      <span
                        className={cn(
                          "truncate text-[11px] font-extrabold tracking-wider uppercase",
                          notification.read ? "ds-text-muted" : "ds-text",
                        )}
                      >
                        {notification.title}
                      </span>
                      <span className="line-clamp-2 text-[11px] font-medium ds-text-muted">
                        {notification.message}
                      </span>
                      <span className="text-[9px] font-bold tracking-wider uppercase ds-text-faint">
                        {timeAgo(notification.createdAt)}
                      </span>
                    </div>

                    {/* Unread dot */}
                    {!notification.read && (
                      <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-red-500" />
                    )}
                  </button>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="border-t border-[var(--ds-divider)] px-4 py-2.5 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setView("notifications", { preserveRecordId: false });
                    setIsOpen(false);
                  }}
                  className="border-0 bg-transparent text-[10px] font-extrabold tracking-widest uppercase ds-text-muted cursor-pointer transition-colors hover:text-[var(--ds-text)]"
                >
                  View All
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
