import type { PermissionMap } from "@/lib/permissions";

export type AdminUserRole = "artist" | "a&r" | "admin";
export type AdminUserStatus = "pending" | "approved" | "rejected";

export type AdminUserListItem = {
  id: string;
  email: string;
  fullName: string | null;
  stageName: string | null;
  spotifyUrl: string | null;
  monthlyListeners: number | null;
  role: string;
  status: string;
  permissions: string | null;
  emailVerified: Date | null;
  createdAt: Date;
};

export type AdminUserUpdateInput = {
  userId: string;
  email?: string;
  fullName?: string | null;
  stageName?: string | null;
  spotifyUrl?: string | null;
  role?: AdminUserRole;
  status?: AdminUserStatus;
  permissions?: string | PermissionMap | null;
};
