"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { GripVertical, Eye, EyeOff, RotateCcw } from "lucide-react";

export type WidgetConfig = {
  id: string;
  title: string;
  /** Whether widget can be hidden */
  hideable?: boolean;
  /** Default column span (1 or 2) on lg screens */
  colSpan?: 1 | 2;
};

type WidgetGridProps = {
  widgets: WidgetConfig[];
  storageKey: string;
  children: (widgetId: string) => ReactNode;
};

type WidgetState = {
  order: string[];
  hidden: string[];
};

function getStoredState(key: string, defaults: WidgetState): WidgetState {
  if (typeof window === "undefined") return defaults;
  try {
    const stored = localStorage.getItem(`widget-grid-${key}`);
    if (stored) {
      const parsed = JSON.parse(stored) as Partial<WidgetState>;
      return {
        order: parsed.order || defaults.order,
        hidden: parsed.hidden || [],
      };
    }
  } catch { /* ignore */ }
  return defaults;
}

function saveState(key: string, state: WidgetState) {
  try {
    localStorage.setItem(`widget-grid-${key}`, JSON.stringify(state));
  } catch { /* ignore */ }
}

export default function WidgetGrid({ widgets, storageKey, children }: WidgetGridProps) {
  const defaultOrder = widgets.map((w) => w.id);
  const [state, setState] = useState<WidgetState>(() =>
    getStoredState(storageKey, { order: defaultOrder, hidden: [] }),
  );
  const [showSettings, setShowSettings] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const dragOverId = useRef<string | null>(null);

  // Ensure all widget ids are in the order
  useEffect(() => {
    const missing = widgets.filter((w) => !state.order.includes(w.id));
    if (missing.length > 0) {
      setState((prev) => ({
        ...prev,
        order: [...prev.order, ...missing.map((w) => w.id)],
      }));
    }
  }, [widgets, state.order]);

  const persist = useCallback(
    (next: WidgetState) => {
      setState(next);
      saveState(storageKey, next);
    },
    [storageKey],
  );

  const toggleHidden = useCallback(
    (id: string) => {
      persist({
        ...state,
        hidden: state.hidden.includes(id)
          ? state.hidden.filter((h) => h !== id)
          : [...state.hidden, id],
      });
    },
    [state, persist],
  );

  const resetLayout = useCallback(() => {
    persist({ order: defaultOrder, hidden: [] });
  }, [defaultOrder, persist]);

  const handleDragStart = (id: string) => setDragId(id);
  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    dragOverId.current = id;
  };
  const handleDragEnd = () => {
    if (!dragId || !dragOverId.current || dragId === dragOverId.current) {
      setDragId(null);
      return;
    }
    const newOrder = [...state.order];
    const fromIdx = newOrder.indexOf(dragId);
    const toIdx = newOrder.indexOf(dragOverId.current);
    if (fromIdx === -1 || toIdx === -1) {
      setDragId(null);
      return;
    }
    newOrder.splice(fromIdx, 1);
    newOrder.splice(toIdx, 0, dragId);
    persist({ ...state, order: newOrder });
    setDragId(null);
    dragOverId.current = null;
  };

  const visibleWidgets = state.order
    .map((id) => widgets.find((w) => w.id === id))
    .filter((w): w is WidgetConfig => !!w && !state.hidden.includes(w.id));

  const widgetMap = new Map(widgets.map((w) => [w.id, w]));

  return (
    <div>
      {/* Settings toggle */}
      <div className="mb-3 flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={() => setShowSettings((p) => !p)}
          className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest text-white/30 hover:text-white/50 transition-colors cursor-pointer"
        >
          <GripVertical size={12} />
          {showSettings ? "Done" : "Customize"}
        </button>
        {showSettings && (
          <button
            type="button"
            onClick={resetLayout}
            className="flex items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 py-1.5 text-[9px] font-black uppercase tracking-widest text-white/25 hover:text-white/50 transition-colors cursor-pointer"
          >
            <RotateCcw size={10} />
            Reset
          </button>
        )}
      </div>

      {/* Hidden widget toggles */}
      {showSettings && state.hidden.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {state.hidden.map((id) => {
            const w = widgetMap.get(id);
            if (!w) return null;
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggleHidden(id)}
                className="flex items-center gap-1.5 rounded-lg border border-dashed border-white/[0.08] bg-white/[0.01] px-3 py-1.5 text-[10px] font-bold text-white/25 hover:text-white/50 hover:border-white/[0.15] transition-colors cursor-pointer"
              >
                <EyeOff size={10} />
                {w.title}
              </button>
            );
          })}
        </div>
      )}

      {/* Widget grid */}
      <div className="grid gap-3 grid-cols-1 lg:grid-cols-2">
        {visibleWidgets.map((widget) => (
          <motion.div
            key={widget.id}
            layout
            draggable={showSettings}
            onDragStart={() => handleDragStart(widget.id)}
            onDragOver={(e) => handleDragOver(e as unknown as React.DragEvent, widget.id)}
            onDragEnd={handleDragEnd}
            className={`${widget.colSpan === 2 ? "lg:col-span-2" : ""} ${
              showSettings ? "cursor-grab active:cursor-grabbing" : ""
            } ${dragId === widget.id ? "opacity-50" : ""}`}
          >
            {showSettings && (
              <div className="mb-1 flex items-center justify-between rounded-lg bg-white/[0.02] px-3 py-1.5">
                <div className="flex items-center gap-2 text-[10px] font-bold text-white/30">
                  <GripVertical size={12} />
                  {widget.title}
                </div>
                {widget.hideable && (
                  <button
                    type="button"
                    onClick={() => toggleHidden(widget.id)}
                    className="border-0 bg-transparent text-white/20 hover:text-red-400 cursor-pointer p-0.5"
                  >
                    <Eye size={12} />
                  </button>
                )}
              </div>
            )}
            {children(widget.id)}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
