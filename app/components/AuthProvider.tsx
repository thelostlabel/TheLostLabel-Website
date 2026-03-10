"use client";

import type { PropsWithChildren } from "react";
import { SessionProvider } from "next-auth/react";

export default function AuthProvider({ children }: PropsWithChildren) {
  return (
    <SessionProvider
      baseUrl={process.env.NEXTAUTH_URL || "http://localhost:3000"}
      basePath={process.env.NEXTAUTH_URL ? "" : "/api/auth"}
    >
      {children}
    </SessionProvider>
  );
}
