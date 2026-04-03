"use client";

import { Disc } from "lucide-react";
import { Button, Card } from "@heroui/react";

import type { AppSessionUser } from "@/lib/auth-types";
import type { DashboardContract } from "@/app/components/dashboard/types";
import { BRANDING } from "@/lib/branding";
import { extractContractMetaAndNotes } from "@/lib/contract-template";
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
    <div className="flex flex-col gap-6">
      {/* Contracts grid */}
      {contracts.length > 0 && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {contracts.map((contract) => {
            const { userNotes } = extractContractMetaAndNotes(
              String(contract.notes || ""),
            );
            const isOwner =
              contract.userId === sessionUser?.id ||
              contract.primaryArtistEmail === sessionUser?.email ||
              contract.artist?.userId === sessionUser?.id;

            const isActive = contract.status === "active";

            return (
              <Card
                key={contract.id}
                variant="default"
                className={`ds-glass ${!isOwner ? "border-green-500/20" : ""}`}
              >
                <Card.Content className="flex flex-col gap-5 p-5">
                  {/* Title row */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h4 className="text-[14px] font-black tracking-tight text-foreground">
                        {contract.release?.name ||
                          contract.title ||
                          "Untitled Contract"}
                      </h4>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-[11px] font-black tracking-wide text-muted">
                          Ref: {contract.id.slice(0, 8).toUpperCase()}
                        </span>
                        {!isOwner && (
                          <span className="rounded border border-green-500/15 bg-green-500/5 px-1.5 py-0.5 text-[8px] font-black uppercase tracking-widest text-green-400">
                            Collaborator
                          </span>
                        )}
                      </div>
                    </div>
                    <span
                      className={`shrink-0 rounded px-2 py-1 text-[8px] font-black uppercase tracking-widest border ${
                        isActive
                          ? "border-green-500/25 bg-green-500/8 text-green-400"
                          : "border-default/12 bg-default/6 text-muted"
                      }`}
                    >
                      {String(contract.status || "draft").toUpperCase()}
                    </span>
                  </div>

                  {/* Splits card */}
                  <Card variant="secondary" className="ds-item border-0 shadow-none">
                    <Card.Content className="flex flex-col gap-3 p-4">
                      {/* Main share */}
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-black tracking-wide text-muted">
                          {isOwner ? "Total Artist Share" : "Your Effective Share"}
                        </span>
                        <span className="text-[15px] font-black text-(--color-accent)">
                          {isOwner
                            ? `${Math.round(Number(contract.artistShare || 0) * 100)}%`
                            : `${(
                                ((Number(contract.artistShare || 0) *
                                  (contract.splits || [])
                                    .filter(
                                      (split) =>
                                        split.userId === sessionUser?.id ||
                                        (split.artistId &&
                                          currentArtistId === split.artistId),
                                    )
                                    .reduce(
                                      (sum, split) =>
                                        sum +
                                        Number.parseFloat(
                                          String(split.percentage || 0),
                                        ),
                                      0,
                                    )) /
                                  100) *
                                100
                              ).toFixed(1)}%`}
                        </span>
                      </div>

                      {/* Royalty splits */}
                      {contract.splits?.length ? (
                        <div className="flex flex-col gap-2 border-t border-default/8 pt-3">
                          <p className="text-[10px] font-black uppercase tracking-widest text-muted">
                            Royalty Splits
                          </p>
                          {contract.splits.map((split, index) => {
                            const isMe = split.userId === sessionUser?.id;
                            return (
                              <div
                                key={split.id || `${contract.id}-${index}`}
                                className="flex items-center justify-between"
                              >
                                <span
                                  className={`text-[11px] font-black ${isMe ? "text-foreground" : "text-muted"}`}
                                >
                                  {String(split.name || "Unnamed").toUpperCase()}
                                  {isMe && (
                                    <span className="ml-1 text-muted">(YOU)</span>
                                  )}
                                </span>
                                <span
                                  className={`text-[12px] font-black ${isMe ? "text-(--color-accent)" : "text-muted"}`}
                                >
                                  {split.percentage}%
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      ) : null}

                      {/* Label share */}
                      <div className="flex items-center justify-between border-t border-default/8 pt-3">
                        <span className="text-[11px] font-black tracking-wide text-muted">
                          Label Share
                        </span>
                        <span className="text-[15px] font-black text-foreground">
                          {Math.round(Number(contract.labelShare || 0) * 100)}%
                        </span>
                      </div>
                    </Card.Content>
                  </Card>

                  {/* Notes */}
                  {userNotes && (
                    <p className="text-[11px] italic leading-relaxed text-muted">
                      &quot;{userNotes}&quot;
                    </p>
                  )}

                  {/* Footer */}
                  <div className="flex flex-col gap-3 border-t border-default/8 pt-4">
                    <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wide text-muted">
                      <span>
                        Since:{" "}
                        {contract.createdAt
                          ? new Date(contract.createdAt).toLocaleDateString()
                          : "—"}
                      </span>
                      <span>{BRANDING.shortName} Compliance Active</span>
                    </div>
                    {contract.pdfUrl && (
                      <Button
                        variant="primary"
                        onPress={() => {
                          window.open(
                            `/api/files/contract/${contract.id}`,
                            "_blank",
                            "noopener,noreferrer",
                          );
                        }}
                        className="w-full"
                      >
                        View Agreement
                      </Button>
                    )}
                  </div>
                </Card.Content>
              </Card>
            );
          })}
        </div>
      )}

      {/* Empty state */}
      {contracts.length === 0 && (
        <DashboardEmptyState
          title="No active contracts"
          description="Contact support if you believe a contract should already be visible in your workspace."
          icon={<Disc size={40} className="opacity-15" />}
        />
      )}
    </div>
  );
}
