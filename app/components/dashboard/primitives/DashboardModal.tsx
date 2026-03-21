"use client";

import { motion } from "framer-motion";
import type { PropsWithChildren, ReactNode } from "react";

type DashboardModalProps = PropsWithChildren<{
  title: string;
  description?: ReactNode;
  width?: number;
  onClose: () => void;
}>;

export default function DashboardModal({
  title,
  description,
  width = 460,
  onClose,
  children,
}: DashboardModalProps) {
  return (
    <div
      className="dash-modal-overlay p-5"
      style={{ zIndex: 1200 }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="w-full rounded-[18px] border border-white/[0.16] p-7"
        style={{
          maxWidth: `${width}px`,
          background: "#0a0a0c",
          boxShadow: "0 25px 50px rgba(0,0,0,0.48)",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-[18px]">
          <h3 className="text-sm tracking-[0.18em] font-[900] text-white m-0 uppercase">
            {title}
          </h3>
          {description ? (
            <div className="mt-2 text-xs leading-relaxed text-white/[0.58]">
              {description}
            </div>
          ) : null}
        </div>
        {children}
      </motion.div>
    </div>
  );
}
