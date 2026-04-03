import type { AppRole, AppUserStatus } from "@/lib/auth-types";
import prisma from "@/lib/prisma";

type DashboardAccessUser = {
  id: string;
  role: AppRole;
  status: AppUserStatus;
};

export async function getAuthoritativeDashboardAccessUser(
  userId: string | null | undefined,
): Promise<DashboardAccessUser | null> {
  if (!userId) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      role: true,
      status: true,
    },
  });
}

export function getDashboardAccessError(
  user: DashboardAccessUser | null | undefined,
): string | null {
  if (!user) {
    return "Unauthorized";
  }

  if (user.role === "admin") {
    return null;
  }

  if (user.status === "approved") {
    return null;
  }

  if (user.status === "rejected") {
    return "Account not approved";
  }

  return "Account pending approval";
}
