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
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.82)",
        backdropFilter: "blur(10px)",
        zIndex: 1200,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        style={{
          width: "100%",
          maxWidth: `${width}px`,
          background: "#0a0a0c",
          border: "1px solid rgba(255,255,255,0.16)",
          borderRadius: "18px",
          padding: "28px",
          boxShadow: "0 25px 50px rgba(0,0,0,0.48)",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ marginBottom: "18px" }}>
          <h3
            style={{
              fontSize: "14px",
              letterSpacing: "0.18em",
              fontWeight: 900,
              color: "#fff",
              margin: 0,
              textTransform: "uppercase",
            }}
          >
            {title}
          </h3>
          {description ? (
            <div
              style={{
                marginTop: "8px",
                fontSize: "12px",
                lineHeight: 1.6,
                color: "rgba(255,255,255,0.58)",
              }}
            >
              {description}
            </div>
          ) : null}
        </div>
        {children}
      </motion.div>
    </div>
  );
}
