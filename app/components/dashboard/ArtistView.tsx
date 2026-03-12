"use client";

import { useCallback, useMemo } from "react";
import { motion } from "framer-motion";

import DashboardErrorState from "@/app/components/dashboard/DashboardErrorState";
import DashboardInlineAlert from "@/app/components/dashboard/DashboardInlineAlert";
import DashboardLoader from "@/app/components/dashboard/DashboardLoader";
import { useToast } from "@/app/components/ToastContext";
import { useDashboardAuth } from "@/app/components/dashboard/context/DashboardAuthProvider";
import { useArtistDashboardData } from "@/app/components/dashboard/hooks/useArtistDashboardData";
import { useDashboardRoute } from "@/app/components/dashboard/hooks/useDashboardRoute";
import {
  ReleasesView as ArtistCatalogReleasesView,
  DemosView as ArtistCatalogDemosView,
  SubmitView as ArtistCatalogSubmitView,
} from "@/app/components/dashboard/artist/ArtistCatalogViews";
import { SupportView as ArtistSupportView } from "@/app/components/dashboard/artist/ArtistSupportViews";
import {
  ArtistQuickAccessBar,
  default as ArtistOverviewView,
} from "@/app/components/dashboard/artist/views/ArtistOverviewView";
import ArtistEarningsView from "@/app/components/dashboard/artist/views/ArtistEarningsView";
import ArtistContractsView from "@/app/components/dashboard/artist/views/ArtistContractsView";
import ArtistProfileView from "@/app/components/dashboard/artist/views/ArtistProfileView";
import { useArtistSubmission } from "@/app/components/dashboard/artist/hooks/useArtistSubmission";
import { useArtistWithdrawal } from "@/app/components/dashboard/artist/hooks/useArtistWithdrawal";
import {
  artistSharedViewProps,
  DASHBOARD_THEME,
  inputStyle,
} from "@/app/components/dashboard/artist/lib/shared";
import { dashboardRequestJson } from "@/app/components/dashboard/lib/dashboard-request";
import DashboardModal from "@/app/components/dashboard/primitives/DashboardModal";
import DashboardSectionHeader from "@/app/components/dashboard/primitives/DashboardSectionHeader";
import DiscordLinkSoftBlockNotice from "@/app/components/dashboard/discord/DiscordLinkSoftBlockNotice";
import { useDiscordLink } from "@/app/components/dashboard/discord/useDiscordLink";
import { useMinimumLoader } from "@/lib/use-minimum-loader";
import {
  getPortalViewTitle,
  normalizePortalView,
} from "@/lib/dashboard-view-registry";

export default function ArtistView() {
  const { currentUser, syncSessionClaims } = useDashboardAuth();
  const { showToast, showConfirm } = useToast() as {
    showToast: (message: string, type?: string) => void;
    showConfirm: (
      title: string,
      message: string,
      onConfirm: () => void | Promise<void>,
      onCancel?: () => void,
    ) => void;
  };
  const {
    rawView,
    recordId,
    searchParams,
    replaceQuery,
    setView,
    setRecordId,
    clearRecordId,
  } = useDashboardRoute();
  const view = normalizePortalView(rawView);
  const {
    stats,
    releases,
    demos,
    contracts,
    earnings,
    payments,
    requests,
    earningsPagination,
    refreshView,
    isViewLoading,
    viewError,
    hasViewData,
  } = useArtistDashboardData(view);
  const showLoading = useMinimumLoader(isViewLoading(view), 250);
  const { discordLink, hasDiscordLink, refreshDiscordLink } = useDiscordLink(currentUser?.id);
  const selectedRequestId = recordId;

  const navigateToView = useCallback(
    (nextView: string, extraParams: Record<string, string | null> = {}) => {
      const targetView = nextView.startsWith("my-") ? nextView : `my-${nextView}`;
      setView(targetView, {
        params: extraParams,
        preserveRecordId: Boolean(extraParams.id),
      });
    },
    [setView],
  );

  const submission = useArtistSubmission({
    showToast,
    onSuccess: async () => {
      navigateToView("demos");
      await refreshView("demos");
    },
  });

  const withdrawal = useArtistWithdrawal({
    availableBalance: Number(stats.available ?? stats.balance ?? 0),
    showToast,
    onSubmitted: async () => {
      await refreshView(["overview", "earnings", "payments"], earningsPagination.page);
    },
  });

  const handleDeleteDemo = useCallback(
    (demoId: string, demoTitle: string) => {
      showConfirm(
        "Delete Demo",
        `Are you sure you want to delete "${demoTitle}"? This action cannot be undone.`,
        async () => {
          try {
            await dashboardRequestJson(`/api/demo/${demoId}`, {
              method: "DELETE",
              context: "delete demo",
              retry: false,
            });
            showToast("Demo deleted successfully.", "success");
            await refreshView("demos");
          } catch {
            showToast("Failed to delete demo.", "error");
          }
        },
      );
    },
    [showConfirm, showToast, refreshView],
  );

  const viewTitle = useMemo(
    () => (selectedRequestId && view === "support" ? "Conversation" : getPortalViewTitle(view)),
    [selectedRequestId, view],
  );
  const currentViewError = viewError(view);
  const currentViewHasData = hasViewData(view);

  if (showLoading && !currentViewHasData) {
    return (
      <DashboardLoader
        fullScreen
        label="Artist Portal"
        subLabel={`Preparing ${String(viewTitle || "dashboard").toLowerCase()} module...`}
      />
    );
  }

  if (currentViewError && !currentViewHasData) {
    return (
      <DashboardErrorState
        title={`${String(viewTitle || "Dashboard")} failed to load`}
        message={currentViewError}
        onAction={() => refreshView(view, earningsPagination.page)}
      />
    );
  }

  return (
    <div
      className="artist-dashboard-view dashboard-view"
      style={{
        flex: 1,
        padding: "30px",
        overflowY: "auto",
        background: DASHBOARD_THEME.bg,
      }}
    >
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        style={{
          marginBottom: "18px",
          padding: "20px 20px",
          borderRadius: "16px",
          border: "1px solid rgba(255,255,255,0.06)",
          background: `linear-gradient(180deg, ${DASHBOARD_THEME.surfaceElevated}, ${DASHBOARD_THEME.surface})`,
          boxShadow: "0 14px 32px rgba(0, 0, 0, 0.35)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)",
          }}
        />
        <DashboardSectionHeader eyebrow="ARTIST DASHBOARD" title={viewTitle || "Dashboard"} />
      </motion.div>

      {currentViewError && currentViewHasData ? (
        <DashboardInlineAlert message={currentViewError} />
      ) : null}

      {!isViewLoading(view) && view === "overview" ? (
        <ArtistQuickAccessBar
          stats={stats}
          currentView={view}
          onNavigate={navigateToView}
        />
      ) : null}

      {view === "overview" ? (
        <ArtistOverviewView
          stats={stats}
          recentReleases={releases.slice(0, 4)}
          onNavigate={navigateToView}
          sessionUser={currentUser}
        />
      ) : null}

      {view === "demos" ? (
        <>
          {!hasDiscordLink ? (
            <DiscordLinkSoftBlockNotice
              title="Discord Link Recommended"
              message="Demo updates from Discord commands are unavailable until you link your Discord account."
              onLink={() => navigateToView("profile")}
            />
          ) : null}
          <ArtistCatalogDemosView
            demos={demos}
            onNavigate={() => {
              navigateToView("submit");
            }}
            onDelete={handleDeleteDemo}
            shared={artistSharedViewProps}
          />
        </>
      ) : null}

      {view === "releases" ? (
        <ArtistCatalogReleasesView
          stats={stats}
          showToast={showToast}
          onOpenSupport={(id: string) => {
            setView("my-support", { params: { id }, preserveRecordId: true });
          }}
          onOpenProfile={() => navigateToView("profile")}
          shared={artistSharedViewProps}
        />
      ) : null}

      {view === "submit" ? (
        <ArtistCatalogSubmitView
          title={submission.title}
          setTitle={submission.setTitle}
          genre={submission.genre}
          setGenre={submission.setGenre}
          trackLink={submission.trackLink}
          setTrackLink={submission.setTrackLink}
          message={submission.message}
          setMessage={submission.setMessage}
          files={submission.files}
          dragActive={submission.dragActive}
          handleDrag={submission.handleDrag}
          handleDrop={submission.handleDrop}
          handleFileSelect={submission.handleFileSelect}
          removeFile={submission.removeFile}
          fileInputRef={submission.fileInputRef}
          uploading={submission.uploading}
          uploadProgress={submission.uploadProgress}
          handleSubmit={submission.handleSubmit}
          shared={artistSharedViewProps}
        />
      ) : null}

      {view === "earnings" ? (
        <>
          {!hasDiscordLink ? (
            <DiscordLinkSoftBlockNotice
              title="Discord Link Recommended"
              message="Use commands like /earnings in Discord after linking your account."
              onLink={() => navigateToView("profile")}
            />
          ) : null}
          <ArtistEarningsView
            earnings={earnings}
            payments={payments}
            sessionUser={currentUser}
            pagination={earningsPagination}
            onPageChange={(page) => refreshView("earnings", page)}
            stats={stats}
            onWithdrawClick={withdrawal.open}
          />
        </>
      ) : null}

      {view === "contracts" ? (
        <>
          {!hasDiscordLink ? (
            <DiscordLinkSoftBlockNotice
              title="Discord Link Recommended"
              message="Use commands like /contracts in Discord after linking your account."
              onLink={() => navigateToView("profile")}
            />
          ) : null}
          <ArtistContractsView contracts={contracts} sessionUser={currentUser} />
        </>
      ) : null}

      {view === "support" ? (
        <ArtistSupportView
          requests={requests}
          selectedId={selectedRequestId}
          currentUser={currentUser}
          onRefresh={() => refreshView("support")}
          showToast={showToast}
          shared={artistSharedViewProps}
          onNavigate={(id: string | null) => {
            if (id) {
              setRecordId(id);
              return;
            }
            clearRecordId({ replace: true });
          }}
        />
      ) : null}

      {view === "profile" ? (
        <ArtistProfileView
          onSessionRefresh={syncSessionClaims}
          showToast={showToast}
          showConfirm={showConfirm}
          discordLink={discordLink}
          linkStatusCode={searchParams.get("discord")}
          onClearLinkStatus={() => replaceQuery({ discord: null })}
          onDiscordLinkChange={refreshDiscordLink}
        />
      ) : null}

      {withdrawal.isOpen ? (
        <DashboardModal
          title="Withdraw Funds"
          description={
            <>
              Available balance:{" "}
              <span style={{ color: "var(--accent)" }}>
                $
                {Number(stats.available ?? stats.balance ?? 0).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                })}
              </span>
            </>
          }
          onClose={withdrawal.close}
        >
          <form onSubmit={withdrawal.handleSubmit} style={{ display: "grid", gap: "20px" }}>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 900,
                  color: DASHBOARD_THEME.muted,
                  letterSpacing: "1px",
                  marginBottom: "8px",
                }}
              >
                Amount (USD)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={withdrawal.amount}
                onChange={(event) => withdrawal.setAmount(event.target.value)}
                placeholder="0.00"
                style={inputStyle}
              />
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 900,
                  color: DASHBOARD_THEME.muted,
                  letterSpacing: "1px",
                  marginBottom: "8px",
                }}
              >
                Payment Method
              </label>
              <select
                value={withdrawal.method}
                onChange={(event) => withdrawal.setMethod(event.target.value)}
                style={inputStyle}
              >
                <option value="BANK_TRANSFER">Bank Transfer (IBAN)</option>
                <option value="PAYPAL">PayPal</option>
                <option value="CRYPTO">Crypto (USDT/BTC)</option>
                <option value="WISE">Wise</option>
              </select>
            </div>

            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 900,
                  color: DASHBOARD_THEME.muted,
                  letterSpacing: "1px",
                  marginBottom: "8px",
                }}
              >
                Payment Details / Notes
              </label>
              <textarea
                value={withdrawal.notes}
                onChange={(event) => withdrawal.setNotes(event.target.value)}
                placeholder="IBAN, email, wallet address, or other payout details"
                style={{ ...inputStyle, minHeight: "90px", resize: "none" }}
              />
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "10px" }}>
              <button
                type="submit"
                disabled={withdrawal.submitting}
                style={{
                  flex: 2,
                  ...artistSharedViewProps.btnStyle,
                  background: "var(--accent)",
                  color: "#000",
                  border: "none",
                  height: "45px",
                }}
              >
                {withdrawal.submitting ? "Processing..." : "Submit Request"}
              </button>
              <button
                type="button"
                onClick={withdrawal.close}
                style={{
                  flex: 1,
                  ...artistSharedViewProps.btnStyle,
                  background: "rgba(255,255,255,0.05)",
                  height: "45px",
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </DashboardModal>
      ) : null}
    </div>
  );
}
