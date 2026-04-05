"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { Columns3, Check } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export type ColumnDef = {
  key: string;
  label: string;
  /** If true, column cannot be hidden */
  locked?: boolean;
  /** Default visibility (defaults to true) */
  defaultVisible?: boolean;
};

type ColumnToggleProps = {
  columns: ColumnDef[];
  /** Unique key for localStorage persistence */
  storageKey: string;
  onChange: (visibleKeys: Set<string>) => void;
};

export function useColumnVisibility(columns: ColumnDef[], storageKey: string) {
  const [visible, setVisible] = useState<Set<string>>(() => {
    const defaults = new Set(
      columns.filter((c) => c.locked || c.defaultVisible !== false).map((c) => c.key),
    );
    if (typeof window === "undefined") return defaults;
    try {
      const stored = localStorage.getItem(`col-vis-${storageKey}`);
      if (stored) {
        const keys = JSON.parse(stored) as string[];
        // Always include locked columns
        const locked = columns.filter((c) => c.locked).map((c) => c.key);
        return new Set([...keys, ...locked]);
      }
    } catch { /* ignore */ }
    return defaults;
  });

  const toggle = useCallback(
    (key: string) => {
      setVisible((prev) => {
        const next = new Set(prev);
        if (next.has(key)) {
          next.delete(key);
        } else {
          next.add(key);
        }
        try {
          localStorage.setItem(`col-vis-${storageKey}`, JSON.stringify(Array.from(next)));
        } catch { /* ignore */ }
        return next;
      });
    },
    [storageKey],
  );

  const isVisible = useCallback((key: string) => visible.has(key), [visible]);

  return { visible, toggle, isVisible };
}

export default function ColumnToggle({ columns, storageKey, onChange }: ColumnToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { visible, toggle, isVisible } = useColumnVisibility(columns, storageKey);
  const ref = useRef<HTMLDivElement>(null);

  // Notify parent of changes
  useEffect(() => {
    onChange(visible);
  }, [visible, onChange]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [isOpen]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((p) => !p)}
        className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest text-white/40 hover:bg-white/[0.04] hover:text-white/60 transition-colors cursor-pointer"
      >
        <Columns3 size={12} />
        Columns
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-[calc(100%+6px)] z-50 w-52 rounded-xl border border-white/[0.08] bg-[rgb(18,18,18)] p-1.5 shadow-xl"
          >
            <p className="mx-2 mt-1 mb-1.5 text-[8px] font-black uppercase tracking-[0.2em] text-white/20">
              Toggle columns
            </p>
            {columns.map((col) => {
              const checked = isVisible(col.key);
              return (
                <button
                  key={col.key}
                  type="button"
                  disabled={col.locked}
                  onClick={() => toggle(col.key)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] font-bold border-0 cursor-pointer transition-colors ${
                    col.locked
                      ? "text-white/20 cursor-not-allowed bg-transparent"
                      : checked
                        ? "text-white/70 bg-white/[0.03] hover:bg-white/[0.06]"
                        : "text-white/30 bg-transparent hover:bg-white/[0.03]"
                  }`}
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      checked
                        ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-400"
                        : "border-white/10 bg-transparent"
                    }`}
                  >
                    {checked && <Check size={10} />}
                  </span>
                  {col.label}
                  {col.locked && (
                    <span className="ml-auto text-[8px] text-white/15">LOCKED</span>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
