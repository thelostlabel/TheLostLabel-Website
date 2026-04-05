"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search, ArrowRight, Mic2, Users, Disc, FileText, Briefcase,
  CreditCard, Loader2,
} from "lucide-react";

type CommandItem = {
  id: string;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  action: () => void;
  keywords?: string[];
  category?: string;
};

type SearchResult = {
  id: string;
  label: string;
  description?: string;
  category: string;
  icon: React.ReactNode;
  view: string;
  recordId?: string;
};

type CommandPaletteProps = {
  items: CommandItem[];
  onNavigate: (view: string, recordId?: string) => void;
};

const CATEGORY_ORDER = ["Quick Results", "Navigation"];

export default function CommandPalette({ items, onNavigate }: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Cmd+K / Ctrl+K to open
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setActiveIndex(0);
      setSearchResults([]);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [isOpen]);

  // Debounced API search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = query.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    setSearching(true);
    debounceRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(`/api/admin/search?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setSearchResults(
          (data.results || []).map((r: any) => ({
            id: r.id,
            label: r.label,
            description: r.description,
            category: "Quick Results",
            icon: getResultIcon(r.type),
            view: r.view,
            recordId: r.recordId,
          })),
        );
      } catch (e: any) {
        if (e?.name !== "AbortError") setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  // Filter navigation items
  const filteredNav = useMemo(() => {
    if (!query.trim()) return items.slice(0, 6);
    const q = query.toLowerCase();
    return items.filter(
      (item) =>
        item.label.toLowerCase().includes(q) ||
        item.keywords?.some((kw) => kw.toLowerCase().includes(q)),
    );
  }, [items, query]);

  // Combine all results
  const allItems = useMemo(() => {
    const combined: Array<{ id: string; label: string; description?: string; icon?: React.ReactNode; category: string; action: () => void }> = [];

    // API search results first
    for (const r of searchResults) {
      combined.push({
        id: `search-${r.id}`,
        label: r.label,
        description: r.description,
        icon: r.icon,
        category: "Quick Results",
        action: () => onNavigate(r.view, r.recordId),
      });
    }

    // Navigation items
    for (const item of filteredNav) {
      combined.push({
        ...item,
        category: "Navigation",
      });
    }

    return combined;
  }, [searchResults, filteredNav, onNavigate]);

  const grouped = useMemo(() => {
    const groups = new Map<string, typeof allItems>();
    for (const item of allItems) {
      const cat = item.category;
      const arr = groups.get(cat) || [];
      arr.push(item);
      groups.set(cat, arr);
    }
    return Array.from(groups.entries()).sort(
      ([a], [b]) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b),
    );
  }, [allItems]);

  const executeItem = useCallback(
    (item: (typeof allItems)[0]) => {
      item.action();
      setIsOpen(false);
    },
    [],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => Math.min(i + 1, allItems.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter" && allItems[activeIndex]) {
        e.preventDefault();
        executeItem(allItems[activeIndex]);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    },
    [allItems, activeIndex, executeItem],
  );

  // Scroll active item into view
  useEffect(() => {
    if (!listRef.current) return;
    const active = listRef.current.querySelector(`[data-index="${activeIndex}"]`);
    active?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  // Reset active index when results change
  useEffect(() => {
    setActiveIndex(0);
  }, [allItems.length]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -20 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-[15%] z-[201] w-[90vw] max-w-[540px] -translate-x-1/2 overflow-hidden rounded-2xl border border-white/[0.08] bg-[rgb(14,14,14)] shadow-2xl"
          >
            {/* Search input */}
            <div className="flex items-center gap-3 border-b border-white/[0.06] px-4">
              {searching ? (
                <Loader2 size={16} className="shrink-0 text-white/30 animate-spin" />
              ) : (
                <Search size={16} className="shrink-0 text-white/30" />
              )}
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Search artists, releases, users, views..."
                className="h-12 w-full border-0 bg-transparent text-[14px] font-medium text-white placeholder:text-white/25 outline-none"
              />
              <kbd className="hidden sm:flex shrink-0 items-center gap-0.5 rounded-md border border-white/[0.08] bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-bold text-white/30">
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div ref={listRef} className="max-h-[50vh] overflow-y-auto p-1.5">
              {allItems.length === 0 && !searching ? (
                <div className="px-4 py-8 text-center text-[12px] font-semibold text-white/25">
                  {query.trim().length < 2
                    ? "Type to search artists, releases, users..."
                    : `No results for "${query}"`}
                </div>
              ) : (
                grouped.map(([category, categoryItems]) => (
                  <div key={category}>
                    <p className="mx-3 mt-2 mb-1 text-[9px] font-black uppercase tracking-[0.2em] text-white/20">
                      {category}
                    </p>
                    {categoryItems.map((item) => {
                      const globalIdx = allItems.indexOf(item);
                      const isActive = globalIdx === activeIndex;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          data-index={globalIdx}
                          onClick={() => executeItem(item)}
                          onMouseEnter={() => setActiveIndex(globalIdx)}
                          className={`flex w-full items-center gap-3 rounded-xl border-0 px-3 py-2.5 text-left transition-colors cursor-pointer ${
                            isActive
                              ? "bg-white/[0.06] text-white"
                              : "bg-transparent text-white/60 hover:bg-white/[0.04]"
                          }`}
                        >
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/[0.04] text-white/40">
                            {item.icon || <ArrowRight size={14} />}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-bold">{item.label}</p>
                            {item.description && (
                              <p className="truncate text-[11px] text-white/30">{item.description}</p>
                            )}
                          </div>
                          {isActive && (
                            <kbd className="hidden sm:flex shrink-0 items-center rounded-md border border-white/[0.06] bg-white/[0.03] px-1.5 py-0.5 text-[9px] font-bold text-white/25">
                              ENTER
                            </kbd>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}

              {searching && searchResults.length === 0 && (
                <div className="px-4 py-4 text-center text-[11px] text-white/20">
                  Searching...
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-2">
              <div className="flex gap-2 text-[10px] text-white/20">
                <span><kbd className="font-bold">↑↓</kbd> navigate</span>
                <span><kbd className="font-bold">↵</kbd> select</span>
                <span><kbd className="font-bold">esc</kbd> close</span>
              </div>
              <span className="text-[10px] font-bold text-white/15">
                {allItems.length} result{allItems.length !== 1 ? "s" : ""}
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function getResultIcon(type: string) {
  switch (type) {
    case "artist": return <Mic2 size={14} />;
    case "user": return <Users size={14} />;
    case "release": return <Disc size={14} />;
    case "contract": return <Briefcase size={14} />;
    case "demo": return <FileText size={14} />;
    case "payment": return <CreditCard size={14} />;
    default: return <Search size={14} />;
  }
}
