"use client";

import type { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@heroui/react";
import { X } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BulkAction {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  isDisabled?: boolean;
}

interface BulkActionsBarProps {
  selectedCount: number;
  actions: BulkAction[];
  onClear: () => void;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BulkActionsBar({ selectedCount, actions, onClear }: BulkActionsBarProps) {
  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 ds-glass rounded-2xl shadow-lg border border-border/60 px-5 py-3 flex items-center gap-4"
        >
          <span className="text-xs font-black tracking-widest text-foreground whitespace-nowrap">
            {selectedCount} SELECTED
          </span>

          <div className="w-px h-6 bg-border/60" />

          <div className="flex items-center gap-2">
            {actions.map((action) => (
              <Button
                key={action.label}
                size="sm"
                variant={action.variant ?? "secondary"}
                isDisabled={action.isDisabled}
                onPress={action.onClick}
              >
                {action.icon}
                {action.label}
              </Button>
            ))}
          </div>

          <div className="w-px h-6 bg-border/60" />

          <Button size="sm" variant="ghost" isIconOnly onPress={onClear} aria-label="Clear selection">
            <X size={14} />
          </Button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
