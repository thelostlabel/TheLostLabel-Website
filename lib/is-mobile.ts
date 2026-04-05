import { useState, useEffect } from "react";

/**
 * Module-level mobile check — safe for useEffect / GSAP animation logic
 * where hydration mismatch doesn't matter (client-only code paths).
 */
export const IS_MOBILE =
  typeof window !== "undefined" &&
  (window.innerWidth < 768 ||
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));

/**
 * React hook for render-path mobile detection.
 * Returns `false` on first render (SSR-safe, no hydration mismatch),
 * then updates to the real value after mount.
 *
 * Use this for conditional JSX rendering (return null, conditional elements).
 * Use IS_MOBILE for useEffect/GSAP logic that doesn't affect the initial render tree.
 */
export function useIsMobile(): boolean {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    setMobile(
      window.innerWidth < 768 ||
        /Android|iPhone|iPad|iPod/i.test(navigator.userAgent),
    );
  }, []);
  return mobile;
}
