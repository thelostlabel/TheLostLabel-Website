/** Lightweight mobile check — safe to call at module level in "use client" files. */
export const IS_MOBILE =
  typeof window !== "undefined" &&
  (window.innerWidth < 768 ||
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
