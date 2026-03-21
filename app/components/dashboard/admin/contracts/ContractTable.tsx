"use client";

import { motion } from "framer-motion";

type ContractTableProps = {
  contracts: any[];
  onEdit: (contract: any) => void;
  onDelete: (id: string) => void;
};

export default function ContractTable({
  contracts,
  onEdit,
  onDelete,
}: ContractTableProps) {
  return (
    <>
      <style jsx>{`
        .table-row-hover:hover {
          background-color: rgba(255, 255, 255, 0.02) !important;
        }

        @media (max-width: 768px) {
          .contracts-table-head {
            display: none !important;
          }
          .contracts-table-row {
            grid-template-columns: 1fr !important;
          }
          .contracts-row-actions {
            justify-content: flex-start !important;
          }
        }
      `}</style>

      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "12px",
          overflow: "hidden",
        }}
      >
        {/* Header */}
        <div
          className="contracts-table-head"
          style={{
            display: "grid",
            gridTemplateColumns: "2fr 2fr 1.5fr 1fr 1fr 1fr 1.5fr",
            padding: "16px 24px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            fontSize: "10px",
            fontWeight: "900",
            color: "#666",
            letterSpacing: "1.5px",
            background: "rgba(255,255,255,0.01)",
          }}
        >
          <div>RELEASE</div>
          <div>ARTIST</div>
          <div>SPLIT</div>
          <div>EARNINGS</div>
          <div>STATUS</div>
          <div>PDF</div>
          <div style={{ textAlign: "right" }}>ACTIONS</div>
        </div>

        {/* Rows */}
        <div style={{ display: "flex", flexDirection: "column" }}>
          {contracts.map((c, idx) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: idx * 0.05 }}
              className="table-row-hover contracts-table-row"
              style={{
                display: "grid",
                gridTemplateColumns: "2fr 2fr 1.5fr 1fr 1fr 1fr 1.5fr",
                padding: "20px 24px",
                borderBottom:
                  idx === contracts.length - 1
                    ? "none"
                    : "1px solid rgba(255,255,255,0.03)",
                alignItems: "center",
                transition: "background-color 0.15s ease",
                gap: "15px",
              }}
            >
              {/* Release */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "950",
                    color: "#fff",
                    letterSpacing: "0.5px",
                  }}
                >
                  {c.release?.name || c.title || "Untitled Contract"}
                </div>
                <div
                  style={{
                    fontSize: "9px",
                    color: "#666",
                    fontWeight: "800",
                    letterSpacing: "1px",
                    marginTop: "4px",
                  }}
                >
                  {c.releaseId ? "SPOTIFY_RELEASE" : "MANUAL / DEMO"}
                </div>
              </div>

              {/* Artist */}
              <div style={{ display: "flex", flexDirection: "column" }}>
                <div
                  style={{
                    fontSize: "13px",
                    fontWeight: "900",
                    color: "#eaeaea",
                  }}
                >
                  {c.artist?.name ||
                    c.primaryArtistName ||
                    c.user?.stageName ||
                    "Unknown Artist"}
                </div>
                {c.splits.length > 1 && (
                  <div
                    style={{
                      fontSize: "9px",
                      color: "#888",
                      fontWeight: "800",
                      marginTop: "4px",
                    }}
                  >
                    + {c.splits.length - 1} OTHERS:{" "}
                    {c.splits
                      .filter(
                        (s: any) =>
                          s.name !==
                          (c.primaryArtistName || c.user?.stageName)
                      )
                      .map((s: any) => s.name)
                      .join(", ")}
                  </div>
                )}
                <div
                  style={{
                    fontSize: "10px",
                    fontWeight: "800",
                    marginTop: "6px",
                  }}
                >
                  {c.user ? (
                    <span
                      style={{
                        color: "var(--accent)",
                        background: "var(--accent-10)",
                        padding: "2px 6px",
                        borderRadius: "4px",
                      }}
                    >
                      LINKED: {c.user.email}
                    </span>
                  ) : (
                    <span style={{ color: "#666" }}>NO ACCOUNT LINKED</span>
                  )}
                </div>
              </div>

              {/* Split */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                }}
              >
                <div
                  style={{
                    fontSize: "11px",
                    fontWeight: "900",
                    color: "#fff",
                  }}
                >
                  ARTIST:{" "}
                  <span style={{ color: "var(--accent)" }}>
                    {Math.round(c.artistShare * 100)}%
                  </span>{" "}
                  / LABEL:{" "}
                  <span style={{ color: "var(--accent)" }}>
                    {Math.round(c.labelShare * 100)}%
                  </span>
                </div>
                {c.splits?.length > 0 && (
                  <div
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "6px",
                    }}
                  >
                    {c.splits.map((s: any, i: number) => (
                      <span
                        key={i}
                        style={{
                          fontSize: "9px",
                          fontWeight: "800",
                          padding: "4px 8px",
                          background: "rgba(255,255,255,0.05)",
                          borderRadius: "4px",
                          border: "1px solid var(--border)",
                          color: "#aaa",
                        }}
                      >
                        {s.name}:{" "}
                        <span style={{ color: "#fff" }}>{s.percentage}%</span>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Earnings */}
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "800",
                  color: "#aaa",
                }}
              >
                {c._count?.earnings || 0} Records
              </div>

              {/* Status */}
              <div>
                <span
                  style={{
                    fontSize: "9px",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    background:
                      c.status === "active"
                        ? "rgba(57, 255, 20, 0.1)"
                        : "rgba(255,255,255,0.05)",
                    color:
                      c.status === "active" ? "var(--accent)" : "#888",
                    border: `1px solid ${
                      c.status === "active"
                        ? "rgba(57, 255, 20, 0.2)"
                        : "rgba(255,255,255,0.1)"
                    }`,
                    fontWeight: "950",
                    letterSpacing: "1px",
                    display: "inline-block",
                  }}
                >
                  {c.status.toUpperCase()}
                </span>
              </div>

              {/* PDF */}
              <div>
                <a
                  href={`/api/files/contract/${c.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: "8px 16px",
                    fontSize: "9px",
                    background: "var(--accent)",
                    color: "#000",
                    border: "none",
                    borderRadius: "6px",
                    fontWeight: "950",
                    letterSpacing: "1px",
                    display: "inline-block",
                    textDecoration: "none",
                    cursor: "pointer",
                  }}
                >
                  VIEW PDF
                </a>
              </div>

              {/* Actions */}
              <div
                className="contracts-row-actions"
                style={{
                  display: "flex",
                  gap: "8px",
                  justifyContent: "flex-end",
                  alignItems: "center",
                }}
              >
                <button
                  type="button"
                  onClick={() => onEdit(c)}
                  style={{
                    fontSize: "9px",
                    padding: "8px 16px",
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid var(--border)",
                    color: "#fff",
                    borderRadius: "6px",
                    fontWeight: "950",
                    letterSpacing: "1px",
                    cursor: "pointer",
                  }}
                >
                  EDIT
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(c.id)}
                  style={{
                    fontSize: "9px",
                    padding: "8px 16px",
                    color: "#ff4444",
                    background: "rgba(255,0,0,0.05)",
                    border: "1px solid rgba(255,0,0,0.15)",
                    borderRadius: "6px",
                    fontWeight: "950",
                    letterSpacing: "1px",
                    cursor: "pointer",
                  }}
                >
                  DEL
                </button>
              </div>
            </motion.div>
          ))}

          {/* Empty State */}
          {contracts.length === 0 && (
            <div
              style={{
                padding: "60px 20px",
                textAlign: "center",
                color: "#555",
                fontSize: "11px",
                fontWeight: "900",
                letterSpacing: "2px",
              }}
            >
              NO CONTRACTS DEFINED
            </div>
          )}
        </div>
      </div>
    </>
  );
}
