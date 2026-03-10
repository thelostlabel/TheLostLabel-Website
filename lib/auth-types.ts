import type { DefaultSession } from "next-auth";

import type { PermissionMap } from "@/lib/permissions";

export type AppRole = "admin" | "artist" | "a&r" | string;
export type AppUserStatus = "approved" | "pending" | string;

export type AuthCredentials = {
  email?: string;
  password?: string;
  type?: "login" | "register" | string;
  fullName?: string;
  stageName?: string;
};

export type SessionClaims = {
  id: string;
  email: string;
  name: string | null;
  role: AppRole;
  permissions: string | PermissionMap | null;
  spotifyUrl: string | null;
  stageName: string | null;
  status: AppUserStatus;
  image: string | null;
};

export type AppSessionUser = DefaultSession["user"] & SessionClaims & {
  secureVersion?: number;
  permissions: PermissionMap;
};
