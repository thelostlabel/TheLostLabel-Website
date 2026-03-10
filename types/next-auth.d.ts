import type { DefaultSession } from "next-auth";

import type { AppRole, AppSessionUser, AppUserStatus, SessionClaims } from "@/lib/auth-types";
import type { PermissionMap } from "@/lib/permissions";

declare module "next-auth" {
  interface Session {
    user: AppSessionUser;
  }

  interface User extends SessionClaims {
    secureVersion?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    email?: string | null;
    name?: string | null;
    role?: AppRole;
    permissions?: string | PermissionMap | null;
    spotifyUrl?: string | null;
    stageName?: string | null;
    status?: AppUserStatus;
    image?: string | null;
    secureVersion?: number;
  }
}
