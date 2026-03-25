import type { PropsWithChildren } from "react";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";

import type { AppSessionUser } from "@/lib/auth-types";
import { authOptions } from "@/lib/auth";
import DashboardShell from "@/app/components/dashboard/shell/DashboardShell";

export default async function DashboardLayout({
  children,
}: PropsWithChildren) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/dashboard");
  }

  return (
    <DashboardShell initialUser={session.user as AppSessionUser}>
      {children}
    </DashboardShell>
  );
}
