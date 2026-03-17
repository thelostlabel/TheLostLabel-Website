import { useState, useEffect } from "react";

export function useMediaQuery(query) {
  // Use a function to initialize the state to avoid the warning about setState in effect
  const [value, setValue] = useState(() => {
    if (typeof window !== "undefined") {
      return window.matchMedia(query).matches;
    }
    return false;
  });

  useEffect(() => {
    const result = window.matchMedia(query);

    function onChange(event) {
      setValue(event.matches);
    }

    result.addEventListener("change", onChange);
    return () => result.removeEventListener("change", onChange);
  }, [query]);

  return value;
}
