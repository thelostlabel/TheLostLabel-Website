"use client";

import { useState, useEffect } from "react";

/**
 * Shared debounced search hook used across all dashboard views.
 * Returns [searchTerm, setSearchTerm, debouncedSearch].
 */
export function useDebouncedSearch(delay = 300) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), delay);
    return () => clearTimeout(timer);
  }, [searchTerm, delay]);

  return [searchTerm, setSearchTerm, debouncedSearch] as const;
}
