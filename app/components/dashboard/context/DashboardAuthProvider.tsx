"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type PropsWithChildren,
} from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import type { AppSessionUser } from "@/lib/auth-types";
import { hasManagementAccess } from "@/lib/permissions";

type DashboardAuthContextValue = {
  currentUser: AppSessionUser | null;
  canAccessManagement: boolean;
  isPending: boolean;
  isRejected: boolean;
  syncSessionClaims: () => Promise<void>;
};

const DashboardAuthContext = createContext<DashboardAuthContextValue | null>(null);

type DashboardAuthProviderProps = PropsWithChildren<{
  initialUser: AppSessionUser;
}>;

export function DashboardAuthProvider({
  children,
  initialUser,
}: DashboardAuthProviderProps) {
  const router = useRouter();
  const { data: session, update } = useSession();

  const currentUser = (session?.user ?? initialUser) as AppSessionUser | null;

  const syncSessionClaims = useCallback(async () => {
    await update({});
    router.refresh();
  }, [router, update]);

  const value = useMemo<DashboardAuthContextValue>(() => {
    const status = currentUser?.status ?? "pending";

    return {
      currentUser,
      canAccessManagement: hasManagementAccess(currentUser),
      isPending: status === "pending",
      isRejected: status === "rejected",
      syncSessionClaims,
    };
  }, [currentUser, syncSessionClaims]);

  return (
    <DashboardAuthContext.Provider value={value}>
      {children}
    </DashboardAuthContext.Provider>
  );
}

export function useDashboardAuth() {
  const context = useContext(DashboardAuthContext);

  if (!context) {
    throw new Error("useDashboardAuth must be used within DashboardAuthProvider");
  }

  return context;
}
