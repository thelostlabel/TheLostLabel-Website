"use client";

import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type Notification = {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
};

type NotificationsResponse = {
  notifications: Notification[];
  unreadCount: number;
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

async function fetchNotifications(): Promise<NotificationsResponse> {
  const res = await fetch("/api/notifications?limit=20");
  if (!res.ok) throw new Error("Failed to fetch notifications");
  return res.json();
}

async function patchNotification(body: { id: string } | { markAllRead: true }): Promise<void> {
  const res = await fetch("/api/notifications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("Failed to update notification");
}

export function useNotifications() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });

  const markAsRead = useCallback(
    async (notificationId: string) => {
      // Optimistic update
      queryClient.setQueryData<NotificationsResponse>(["notifications"], (old) => {
        if (!old) return old;
        return {
          ...old,
          unreadCount: Math.max(0, old.unreadCount - 1),
          notifications: old.notifications.map((n) =>
            n.id === notificationId ? { ...n, read: true } : n,
          ),
        };
      });
      await patchNotification({ id: notificationId });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    [queryClient],
  );

  const markAllAsRead = useCallback(async () => {
    // Optimistic update
    queryClient.setQueryData<NotificationsResponse>(["notifications"], (old) => {
      if (!old) return old;
      return {
        ...old,
        unreadCount: 0,
        notifications: old.notifications.map((n) => ({ ...n, read: true })),
      };
    });
    await patchNotification({ markAllRead: true });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }, [queryClient]);

  return {
    notifications: data?.notifications ?? [],
    unreadCount: data?.unreadCount ?? 0,
    isLoading,
    markAsRead,
    markAllAsRead,
  };
}
