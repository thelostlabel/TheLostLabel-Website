"use client";

import { Suspense } from "react";
import Link from "next/link";

import DashboardLoader from "@/app/components/dashboard/DashboardLoader";
import ArtistView from "@/app/components/dashboard/ArtistView";
import AdminView from "@/app/components/dashboard/AdminView";
import { useDashboardAuth } from "@/app/components/dashboard/context/DashboardAuthProvider";
import { useDashboardRoute } from "@/app/components/dashboard/hooks/useDashboardRoute";
import { getAdminViewPermission } from "@/lib/dashboard-view-registry";
import {
  canAccessAdminView,
  isAdminUser,
} from "@/lib/permissions";

function DashboardContent({ view: propView }: { view?: string }) {
  const { currentUser, canAccessManagement, isPending, isRejected } = useDashboardAuth();
  const { rawView } = useDashboardRoute<string>();
  const view = propView ?? rawView ?? "overview";

  if (!currentUser) {
    return (
      <DashboardLoader
        fullScreen
        label="AUTHENTICATING"
        subLabel="Checking your dashboard access..."
      />
    );
  }

  const canBypassApprovalGate = isAdminUser(currentUser);

  if (isPending && !canBypassApprovalGate) {
    return (
      <div className="dashboard-view" style={{ display: "grid", placeItems: "center", minHeight: "72vh", padding: "20px" }}>
        <div
          style={{
            width: "100%",
            maxWidth: "520px",
            borderRadius: "28px",
            border: "1px solid rgba(245, 158, 11, 0.2)",
            background: "rgba(245, 158, 11, 0.06)",
            padding: "32px",
            textAlign: "center",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "24px", fontWeight: 900, letterSpacing: "0.14em", color: "#f59e0b" }}>
            ACCOUNT REVIEW IN PROGRESS
          </h2>
          <p style={{ margin: "16px 0 0", fontSize: "14px", lineHeight: 1.7, color: "rgba(255,255,255,0.74)" }}>
            Your application has been received. Access will unlock once the {process.env.NEXT_PUBLIC_SITE_NAME || 'LOST'} team finishes reviewing your account.
          </p>
          <Link
            href="/"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              minWidth: "180px",
              height: "42px",
              marginTop: "20px",
              borderRadius: "12px",
              border: "1px solid rgba(255,255,255,0.14)",
              color: "#fff",
              textDecoration: "none",
              fontSize: "11px",
              fontWeight: 900,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Return Home
          </Link>
        </div>
      </div>
    );
  }

  if (isRejected && !canBypassApprovalGate) {
    return (
      <div className="dashboard-view" style={{ display: "grid", placeItems: "center", minHeight: "72vh", padding: "20px" }}>
        <div
          style={{
            width: "100%",
            maxWidth: "520px",
            borderRadius: "28px",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            background: "rgba(239, 68, 68, 0.06)",
            padding: "32px",
            textAlign: "center",
          }}
        >
          <h2 style={{ margin: 0, fontSize: "24px", fontWeight: 900, letterSpacing: "0.14em", color: "#f87171" }}>
            APPLICATION NOT APPROVED
          </h2>
          <p style={{ margin: "16px 0 0", fontSize: "14px", lineHeight: 1.7, color: "rgba(255,255,255,0.74)" }}>
            Contact support if you need more information about the review decision.
          </p>
        </div>
      </div>
    );
  }

  const isArtistView = view.startsWith("my-");
  const canOpenRequestedManagementView = canAccessAdminView(
    currentUser,
    view,
    getAdminViewPermission(view),
  );

  if (canAccessManagement) {
    if (!isArtistView && view === "overview" && !canOpenRequestedManagementView) {
      return <ArtistView view={view} />;
    }

    if (isArtistView) return <ArtistView view={view} />;
    return <AdminView view={view} />;
  }

  return <ArtistView view={view} />;
}

export default function DashboardPage({ view }: { view?: string }) {
  return (
    <Suspense
      fallback={
        <DashboardLoader
          fullScreen
          label="LOADING DASHBOARD"
          subLabel="Preparing workspace..."
        />
      }
    >
      <DashboardContent view={view} />
    </Suspense>
  );
}
