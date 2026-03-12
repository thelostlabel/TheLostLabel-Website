"use client";

import { Briefcase, Disc } from "lucide-react";

import type { AppSessionUser } from "@/lib/auth-types";
import type { DashboardContract } from "@/app/components/dashboard/types";
import { BRANDING } from "@/lib/branding";
import { extractContractMetaAndNotes } from "@/lib/contract-template";
import {
  DASHBOARD_THEME,
  btnStyle,
  glassStyle,
} from "@/app/components/dashboard/artist/lib/shared";
import DashboardEmptyState from "@/app/components/dashboard/primitives/DashboardEmptyState";

type ArtistContractsViewProps = {
  contracts: DashboardContract[];
  sessionUser: AppSessionUser | null;
};

export default function ArtistContractsView({
  contracts,
  sessionUser,
}: ArtistContractsViewProps) {
  const currentArtistId = (
    sessionUser as (AppSessionUser & { artist?: { id?: string } }) | null
  )?.artist?.id;

  return (
    <div>
      <div style={{ ...glassStyle, padding: "32px", marginBottom: "24px", borderRadius: "10px", border: `1px solid ${DASHBOARD_THEME.border}` }}>
        <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
          <div style={{ width: "50px", height: "50px", borderRadius: "8px", background: DASHBOARD_THEME.surfaceSoft, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${DASHBOARD_THEME.border}` }}>
            <Briefcase size={20} color="var(--accent)" />
          </div>
          <div>
            <h3 style={{ fontSize: "14px", letterSpacing: "3px", fontWeight: 950, color: "#fff", textTransform: "uppercase", margin: 0 }}>
              Artist Agreement Portal
            </h3>
            <p style={{ fontSize: "12px", color: DASHBOARD_THEME.muted, marginTop: "4px", fontWeight: 800, letterSpacing: "0.8px" }}>
              Manage song-level contracts and royalty splits
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
        {contracts.map((contract) => {
          const { userNotes } = extractContractMetaAndNotes(String(contract.notes || ""));
          const isOwner =
            contract.userId === sessionUser?.id ||
            contract.primaryArtistEmail === sessionUser?.email ||
            contract.artist?.userId === sessionUser?.id;

          return (
            <div key={contract.id} style={{ ...glassStyle, padding: "24px", borderRadius: "10px", border: isOwner ? `1px solid ${DASHBOARD_THEME.border}` : "1px solid rgba(34,197,94,0.3)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "25px" }}>
                <div>
                  <h4 style={{ fontSize: "15px", fontWeight: 950, color: "#fff", marginBottom: "6px", letterSpacing: "-0.5px" }}>
                    {contract.release?.name || contract.title || "Untitled Contract"}
                  </h4>
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <p style={{ fontSize: "12px", color: DASHBOARD_THEME.muted, fontWeight: 900, letterSpacing: "0.8px", margin: 0 }}>
                      Ref ID: {contract.id.slice(0, 8).toUpperCase()}
                    </p>
                    {!isOwner ? (
                      <span style={{ fontSize: "7px", padding: "2px 6px", background: "rgba(57, 255, 20, 0.05)", color: "var(--accent)", borderRadius: "4px", fontWeight: 950, border: "1px solid rgba(57, 255, 20, 0.1)" }}>
                        Collaborator
                      </span>
                    ) : null}
                  </div>
                </div>
                <span style={{ fontSize: "8px", padding: "4px 8px", borderRadius: "4px", background: contract.status === "active" ? "rgba(34,197,94,0.1)" : "rgba(255,255,255,0.06)", color: contract.status === "active" ? DASHBOARD_THEME.success : DASHBOARD_THEME.muted, border: `1px solid ${contract.status === "active" ? "rgba(34,197,94,0.28)" : "rgba(255,255,255,0.1)"}`, fontWeight: 950, letterSpacing: "1px" }}>
                  {String(contract.status || "draft").toUpperCase()}
                </span>
              </div>

              <div style={{ padding: "20px", background: "rgba(255,255,255,0.01)", borderRadius: "8px", border: "1px solid rgba(255,255,255,0.03)", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px" }}>
                  <span style={{ fontSize: "12px", color: DASHBOARD_THEME.muted, fontWeight: 950, letterSpacing: "0.8px" }}>
                    {isOwner ? "Total Artist Share" : "Your Effective Share"}
                  </span>
                  <span style={{ fontSize: "15px", color: "var(--accent)", fontWeight: 950 }}>
                    {isOwner
                      ? `${Math.round(Number(contract.artistShare || 0) * 100)}%`
                      : `${(
                          ((Number(contract.artistShare || 0) *
                            (contract.splits || [])
                              .filter((split) => split.userId === sessionUser?.id || (split.artistId && currentArtistId === split.artistId))
                              .reduce((sum, split) => sum + Number.parseFloat(String(split.percentage || 0)), 0)) /
                            100) *
                          100
                        ).toFixed(1)}%`}
                  </span>
                </div>

                {contract.splits?.length ? (
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.03)", paddingTop: "15px", marginTop: "5px" }}>
                    <p style={{ fontSize: "12px", color: DASHBOARD_THEME.muted, fontWeight: 950, letterSpacing: "1px", marginBottom: "12px" }}>
                      Royalty Splits
                    </p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {contract.splits.map((split, index) => (
                        <div key={split.id || `${contract.id}-${index}`} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "12px", color: split.userId === sessionUser?.id ? "#fff" : DASHBOARD_THEME.muted, fontWeight: 950 }}>
                            {String(split.name || "Unnamed split").toUpperCase()} {split.userId === sessionUser?.id ? "(YOU)" : ""}
                          </span>
                          <span style={{ fontSize: "12px", color: split.userId === sessionUser?.id ? "var(--accent)" : DASHBOARD_THEME.muted, fontWeight: 950 }}>
                            {split.percentage}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "15px", borderTop: "1px solid rgba(255,255,255,0.03)", paddingTop: "15px" }}>
                  <span style={{ fontSize: "12px", color: DASHBOARD_THEME.muted, fontWeight: 950, letterSpacing: "0.8px" }}>
                    Label Share
                  </span>
                  <span style={{ fontSize: "15px", color: "#fff", fontWeight: 950 }}>
                    {Math.round(Number(contract.labelShare || 0) * 100)}%
                  </span>
                </div>
              </div>

              {userNotes ? (
                <div style={{ fontSize: "12px", color: DASHBOARD_THEME.muted, lineHeight: "1.5", fontStyle: "italic" }}>
                  &quot;{userNotes}&quot;
                </div>
              ) : null}

              <div style={{ marginTop: "20px", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.03)", display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", color: DASHBOARD_THEME.muted, fontWeight: 950, letterSpacing: "0.8px" }}>
                  <span>Since: {contract.createdAt ? new Date(contract.createdAt).toLocaleDateString() : "—"}</span>
                  <span>{BRANDING.shortName} Compliance Active</span>
                </div>
                {contract.pdfUrl ? (
                  <a href={`/api/files/contract/${contract.id}`} target="_blank" rel="noopener noreferrer" style={{ ...btnStyle, width: "100%", padding: "12px", background: DASHBOARD_THEME.accent, color: "#071311", border: "none", borderRadius: "8px", fontSize: "12px", fontWeight: 950 }}>
                    View Agreement
                  </a>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>

      {contracts.length === 0 ? (
        <div style={{ marginTop: "20px" }}>
          <DashboardEmptyState
            title="No active contracts"
            description="Contact support if you believe a contract should already be visible in your workspace."
            icon={<Disc size={40} style={{ opacity: 0.16 }} />}
          />
        </div>
      ) : null}
    </div>
  );
}
