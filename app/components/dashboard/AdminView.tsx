"use client";

import { useState } from "react";
import dynamic from "next/dynamic";

import DashboardErrorState from "@/app/components/dashboard/DashboardErrorState";
import DashboardInlineAlert from "@/app/components/dashboard/DashboardInlineAlert";
import DashboardLoader from "@/app/components/dashboard/DashboardLoader";
import DashboardModal from "@/app/components/dashboard/primitives/DashboardModal";
import { useToast } from "@/app/components/ToastContext";
import { useDashboardAuth } from "@/app/components/dashboard/context/DashboardAuthProvider";
import { useAdminDashboardData } from "@/app/components/dashboard/hooks/useAdminDashboardData";
import { useDashboardRoute } from "@/app/components/dashboard/hooks/useDashboardRoute";
import { useMinimumLoader } from "@/lib/use-minimum-loader";
import {
  dashboardRequestJson,
  getDashboardErrorMessage,
} from "@/app/components/dashboard/lib/dashboard-request";
import {
  canAccessAdminView,
  canDeleteDemos,
} from "@/lib/permissions";
import {
  getAdminFeatureFlags,
  getAdminViewDisplayName,
  getAdminViewLoaders,
  getAdminViewPermission,
  normalizeAdminView,
} from "./admin-view-registry";

const lazyView = (loader: any): any =>
  dynamic(loader, { ssr: false });

const HomeView = lazyView(() => import("./admin/HomeView"));
const AnalyticsView = lazyView(() => import("./admin/AnalyticsView"));
const SubmissionsView = lazyView(() => import("./admin/SubmissionsView"));
const ArtistsView = lazyView(() => import("./admin/ArtistsView"));
const UsersView = lazyView(() => import("./admin/UsersView"));
const RequestsView = lazyView(() => import("./admin/RequestsView"));
const ContractsView = lazyView(() => import("./admin/contracts/ContractsView"));
const ReleasesView = lazyView(() => import("./admin/ReleasesView"));
const EarningsView = lazyView(() => import("./admin/EarningsView"));
const PaymentsView = lazyView(() => import("./admin/PaymentsView"));
const ContentView = lazyView(() => import("./admin/ContentView"));
const WebhooksView = lazyView(() => import("./admin/WebhooksView"));
const CommunicationsView = lazyView(() => import("./admin/CommunicationsView"));
const EmailTemplatesView = lazyView(() => import("./admin/EmailTemplatesView"));
const SettingsView = lazyView(() => import("./admin/SettingsView"));
const DiscordBridgeView = lazyView(() => import("./admin/DiscordBridgeView"));
const AnnouncementsView = lazyView(() => import("./admin/AnnouncementsView"));
const AuditLogsView = lazyView(() => import("./admin/AuditLogsView"));
const WisePayoutsView = lazyView(() => import("./admin/WisePayoutsView"));

export default function AdminView({ view: propView }: { view?: string }) {
  const { currentUser } = useDashboardAuth();
  const { showToast, showConfirm } = useToast() as any;
  const { rawView, setView } = useDashboardRoute<string>();
  const features = getAdminFeatureFlags();
  const view = normalizeAdminView(propView || rawView || undefined);
  const viewDisplayName = getAdminViewDisplayName(view);
  const {
    submissions,
    artists,
    users,
    requests,
    siteContent,
    webhooks,
    contracts,
    earnings,
    payments,
    releases,
    discordBridge,
    announcements,
    earningsPagination,
    datasetStatus,
    hasViewData,
    isViewLoading,
    viewError,
    refreshView,
  } = useAdminDashboardData(view);
  const [syncDialog, setSyncDialog] = useState<{
    userId: string;
    artistId?: string | null;
    spotifyUrl: string;
    submitting: boolean;
  } | null>(null);

  const canViewCurrentSection =
    canAccessAdminView(currentUser, view, getAdminViewPermission(view));
  const canDeleteSubmission = canDeleteDemos(currentUser);
  const viewLoaderKeys = (getAdminViewLoaders(view) || []) as string[];
  const isViewInitializing = viewLoaderKeys.some(
    (key: string) => datasetStatus[key] === "idle",
  );
  // Only show loading on initial fetch (isPending = no cached data yet).
  // Background refetches (isFetching but data exists) render silently.
  const isInitialFetch = viewLoaderKeys.some(
    (key: string) => datasetStatus[key] === "loading" || datasetStatus[key] === "idle",
  );
  const showLoading = useMinimumLoader(
    isInitialFetch && !hasViewData && !viewError,
    300,
  );

  const runSpotifySync = async (userId: string, spotifyUrl: string, artistId?: string | null) => {
    try {
      const data = await dashboardRequestJson<{
        success?: boolean;
        monthlyListeners?: number;
        error?: string;
      }>("/api/admin/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, artistId, spotifyUrl }),
        context: "spotify sync",
        retry: false,
      });

      if (data.success) {
        showToast(
          `SYNC_COMPLETED: ${Number(data.monthlyListeners || 0).toLocaleString()} listeners`,
          "success",
        );
        await refreshView(view === "users" ? ["artists", "users"] : ["artists"]);
        return;
      }

      showToast(data.error || "Sync failed", "error");
    } catch (error) {
      showToast(getDashboardErrorMessage(error, "Sync failed"), "error");
    } finally {
      setSyncDialog(null);
    }
  };

  const handleSyncStats = async (
    userId: string,
    existingUrl?: string | null,
    artistId?: string | null,
  ) => {
    if (!userId && !existingUrl) return;

    if (existingUrl) {
      await runSpotifySync(userId, existingUrl, artistId);
      return;
    }

    setSyncDialog({
      userId,
      artistId,
      spotifyUrl: "",
      submitting: false,
    });
  };

  const handleDeleteDemo = async (id: string) => {
    if (!canDeleteSubmission) {
      showToast("You do not have permission to delete demos.", "error");
      return;
    }

    showConfirm(
      "DELETE SUBMISSION?",
      "Are you sure you want to permanently delete this submission? This action cannot be undone.",
      async () => {
        try {
          await dashboardRequestJson(`/api/demo/${id}`, {
            method: "DELETE",
            context: "delete submission",
            retry: false,
          });
          showToast("Submission deleted", "success");
          await refreshView("submissions");
        } catch (error) {
          showToast(getDashboardErrorMessage(error, "Delete failed"), "error");
        }
      },
    );
  };

  if (!canViewCurrentSection) {
    return (
      <div className="dashboard-view" style={{ padding: "32px", textAlign: "center" }}>
        <h2 style={{ fontSize: "20px", fontWeight: 900, letterSpacing: "0.16em", color: "#f87171" }}>
          ACCESS_DENIED
        </h2>
        <p style={{ marginTop: "8px", fontSize: "13px", color: "#94a3b8" }}>
          You do not have permission to view this section.
        </p>
      </div>
    );
  }

  if (showLoading && !hasViewData) {
    return (
      <DashboardLoader
        label="ADMIN PANEL"
        subLabel={`Preparing ${viewDisplayName.toLowerCase()} module...`}
      />
    );
  }

  if (viewError && !hasViewData) {
    return (
      <DashboardErrorState
        title={`${viewDisplayName} failed to load`}
        message={viewError}
        onAction={() => refreshView(view)}
      />
    );
  }

  const refreshers = {
    content: () => refreshView("content"),
    requests: () => refreshView("requests"),
    submissions: () => refreshView("submissions"),
    artists: () => refreshView(["artists", "users", "releases", "contracts"]),
    users: () => refreshView("users"),
    webhooks: () => refreshView("webhooks"),
    contracts: () => refreshView(["contracts", "artists", "releases", "submissions"]),
    payments: () => refreshView(["payments", "users"]),
    releases: () => refreshView("releases"),
    discordBridge: () => refreshView("discordBridge"),
    announcements: () => refreshView("announcements"),
  };

  const refreshEarnings = async (page = 1) => {
    await refreshView(["contracts", "earnings"], page);
  };

  return (
    <div className="dashboard-view" style={{ padding: 0 }}>
      {viewError && hasViewData ? <DashboardInlineAlert message={viewError} /> : null}

      {view === "overview" && <HomeView onNavigate={(nextView: string) => setView(nextView)} />}
      {view === "analytics" && <AnalyticsView />}
      {view === "submissions" && features.submissions && (
        <SubmissionsView
          demos={submissions}
          onDelete={handleDeleteDemo}
          canDelete={canDeleteSubmission}
        />
      )}
      {view === "artists" && (
        <ArtistsView
          artists={artists}
          users={users}
          releases={releases}
          contracts={contracts}
          onSync={handleSyncStats}
          onRefresh={refreshers.artists}
          isLoading={isViewLoading}
        />
      )}
      {view === "users" && <UsersView users={users} onRefresh={refreshers.users} />}
      {view === "requests" && <RequestsView requests={requests} />}
      {view === "contracts" && features.contracts && (
        <ContractsView
          contracts={contracts}
          artists={artists}
          releases={releases}
          demos={submissions.filter((submission: any) => submission.status === "approved")}
          onRefresh={refreshers.contracts}
        />
      )}
      {view === "earnings" && features.earnings && (
        <EarningsView
          earnings={earnings}
          contracts={contracts}
          onRefresh={refreshEarnings}
          pagination={earningsPagination}
        />
      )}
      {view === "payments" && features.payments && (
        <PaymentsView
          payments={payments}
          users={users}
          artists={artists}
          onRefresh={refreshers.payments}
        />
      )}
      {view === "content" && (
        <ContentView content={siteContent} onRefresh={refreshers.content} />
      )}
      {view === "webhooks" && (
        <WebhooksView webhooks={webhooks} onRefresh={refreshers.webhooks} />
      )}
      {view === "releases" && features.releases && (
        <ReleasesView releases={releases} onRefresh={refreshers.releases} />
      )}
      {view === "communications" && features.communications && (
        <CommunicationsView artists={artists} />
      )}
      {view === "email-templates" && <EmailTemplatesView />}
      {view === "audit-logs" && <AuditLogsView />}
      {view === "settings" && <SettingsView />}
      {view === "discord-bridge" && features.discordBridge && (
        <DiscordBridgeView data={discordBridge} onRefresh={refreshers.discordBridge} />
      )}
      {view === "announcements" && features.announcements && (
        <AnnouncementsView announcements={announcements} onRefresh={refreshers.announcements} />
      )}
      {view === "wise-payouts" && features.wisePayouts && (
        <WisePayoutsView payments={payments} onRefresh={refreshers.payments} />
      )}

      {syncDialog ? (
        <DashboardModal
          title="Sync Spotify Profile"
          description="Enter the artist Spotify profile URL. The dashboard will refresh artist metrics after the sync completes."
          onClose={() => {
            if (syncDialog.submitting) return;
            setSyncDialog(null);
          }}
        >
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              if (!syncDialog.spotifyUrl.trim()) {
                showToast("Please provide a Spotify profile URL.", "warning");
                return;
              }

              setSyncDialog((current) =>
                current ? { ...current, submitting: true } : current,
              );
              await runSpotifySync(
                syncDialog.userId,
                syncDialog.spotifyUrl.trim(),
                syncDialog.artistId,
              );
            }}
            style={{ display: "grid", gap: "16px" }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  marginBottom: "8px",
                  fontSize: "12px",
                  fontWeight: 800,
                  color: "rgba(255,255,255,0.68)",
                  letterSpacing: "0.08em",
                }}
              >
                Spotify Artist URL
              </label>
              <input
                value={syncDialog.spotifyUrl}
                onChange={(event) =>
                  setSyncDialog((current) =>
                    current ? { ...current, spotifyUrl: event.target.value } : current,
                  )
                }
                placeholder="https://open.spotify.com/artist/..."
                style={{
                  width: "100%",
                  height: "46px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "rgba(255,255,255,0.03)",
                  color: "#fff",
                  padding: "0 14px",
                  fontSize: "13px",
                }}
              />
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
              <button
                type="submit"
                disabled={syncDialog.submitting}
                style={{
                  flex: 1,
                  height: "42px",
                  borderRadius: "10px",
                  border: "none",
                  background: "#e5e7eb",
                  color: "#0b0b0b",
                  fontSize: "11px",
                  fontWeight: 900,
                  letterSpacing: "0.12em",
                  cursor: syncDialog.submitting ? "wait" : "pointer",
                }}
              >
                {syncDialog.submitting ? "SYNCING..." : "START SYNC"}
              </button>
              <button
                type="button"
                onClick={() => setSyncDialog(null)}
                disabled={syncDialog.submitting}
                style={{
                  flex: 1,
                  height: "42px",
                  borderRadius: "10px",
                  border: "1px solid rgba(255,255,255,0.12)",
                  background: "transparent",
                  color: "#fff",
                  fontSize: "11px",
                  fontWeight: 900,
                  letterSpacing: "0.12em",
                  cursor: syncDialog.submitting ? "not-allowed" : "pointer",
                }}
              >
                CANCEL
              </button>
            </div>
          </form>
        </DashboardModal>
      ) : null}
    </div>
  );
}
