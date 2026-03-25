"use client";

import type { PropsWithChildren } from "react";
import { HeroUIProvider } from "@heroui/react";

export function DashboardHeroUIProvider({ children }: PropsWithChildren) {
  return (
    <HeroUIProvider className="dark" locale="tr-TR">
      {children}
    </HeroUIProvider>
  );
}
