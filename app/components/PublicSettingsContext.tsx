"use client";

import { createContext, useContext } from "react";

import type { PropsWithChildren } from "react";

import type { PublicSettings } from "@/lib/public-settings";

const PublicSettingsContext = createContext<PublicSettings | null>(null);

type PublicSettingsProviderProps = PropsWithChildren<{
  value: PublicSettings;
}>;

export function PublicSettingsProvider({ children, value }: PublicSettingsProviderProps) {
  return <PublicSettingsContext.Provider value={value}>{children}</PublicSettingsContext.Provider>;
}

export function usePublicSettings() {
  const context = useContext(PublicSettingsContext);
  if (!context) {
    throw new Error("usePublicSettings must be used within PublicSettingsProvider");
  }

  return context;
}
