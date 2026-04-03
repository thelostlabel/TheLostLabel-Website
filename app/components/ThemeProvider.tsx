"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

const ThemeContext = createContext<{
  theme: Theme;
  toggleTheme: () => void;
}>({ theme: "dark", toggleTheme: () => {} });

function applyTheme(t: Theme) {
  const html = document.documentElement;
  html.setAttribute("data-theme", t);
  html.classList.remove("dark", "light");
  html.classList.add(t);
}

function getInitialTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  const stored = localStorage.getItem("theme") as Theme | null;
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // Always start with "dark" so SSR and first client render match.
  // The inline script in layout.js already applied the correct data-theme
  // to <html> before React hydrates, so there's no visual flash.
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    const resolved = getInitialTheme();
    applyTheme(resolved);
    setTheme(resolved);
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => {
      const next = prev === "dark" ? "light" : "dark";
      localStorage.setItem("theme", next);
      applyTheme(next);
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
