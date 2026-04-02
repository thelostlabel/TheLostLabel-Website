"use client";

import { ChevronRight } from "lucide-react";
import {
  getAdminViewDisplayName,
  PORTAL_VIEW_DEFINITIONS,
} from "@/lib/dashboard-view-registry";
import { useDashboardRoute } from "@/app/components/dashboard/hooks/useDashboardRoute";

type BreadcrumbProps = {
  view: string;
  isAdmin: boolean;
};

function getPortalDisplayName(view: string): string {
  const stripped = view.startsWith("my-") ? view.slice(3) : view;
  const def = PORTAL_VIEW_DEFINITIONS.find((d) => d.view === stripped || d.routeView === view);
  return def?.title ?? "Dashboard";
}

export default function Breadcrumb({ view, isAdmin }: BreadcrumbProps) {
  const { setView } = useDashboardRoute();

  const root = isAdmin ? "ADMIN" : "PORTAL";
  const rootView = isAdmin ? "overview" : "my-overview";

  const currentLabel = isAdmin
    ? getAdminViewDisplayName(view)?.toUpperCase()
    : getPortalDisplayName(view);

  const isRoot = view === rootView || view === "overview";

  const segments: Array<{ label: string; view?: string }> = [
    { label: root, view: isRoot ? undefined : rootView },
  ];

  if (!isRoot) {
    segments.push({ label: currentLabel });
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5">
      {segments.map((segment, idx) => {
        const isLast = idx === segments.length - 1;
        return (
          <span key={idx} className="flex items-center gap-1.5">
            {idx > 0 && (
              <ChevronRight size={10} className="ds-text-muted shrink-0" />
            )}
            {segment.view && !isLast ? (
              <button
                type="button"
                onClick={() => setView(segment.view!)}
                className="border-0 bg-transparent p-0 text-[10px] font-bold tracking-widest uppercase ds-text-muted cursor-pointer transition-colors hover:ds-text"
              >
                {segment.label}
              </button>
            ) : (
              <span
                className={
                  isLast
                    ? "text-[10px] font-bold tracking-widest uppercase ds-text"
                    : "text-[10px] font-bold tracking-widest uppercase ds-text-muted"
                }
              >
                {segment.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
