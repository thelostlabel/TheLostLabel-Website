"use client";

import {
  type CSSProperties,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Bot,
  Briefcase,
  CreditCard,
  Disc,
  DollarSign,
  File,
  FileText,
  HelpCircle,
  Inbox,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Mic2,
  Music,
  Search,
  Settings,
  Upload,
  User,
  Users,
  X,
} from "lucide-react";

import type { AppSessionUser } from "@/lib/auth-types";
import { ADMIN_DASHBOARD_FEATURES } from "@/lib/dashboard-features";
import {
  getEnabledAdminViews,
  PORTAL_VIEW_DEFINITIONS,
} from "@/lib/dashboard-view-registry";
import {
  canAccessAdminView,
  hasPortalPermission,
} from "@/lib/permissions";

import DashboardLoader from "@/app/components/dashboard/DashboardLoader";
import { useToast } from "@/app/components/ToastContext";
import { DashboardAuthProvider, useDashboardAuth } from "@/app/components/dashboard/context/DashboardAuthProvider";
import { useDashboardRoute } from "@/app/components/dashboard/hooks/useDashboardRoute";

import styles from "./DashboardShell.module.css";

const avatarLoader = ({ src }: { src: string }) => src;

const NAV_ICON_MAP = {
  "layout-dashboard": LayoutDashboard,
  inbox: Inbox,
  "mic-2": Mic2,
  "file-text": FileText,
  users: Users,
  file: File,
  bell: Bell,
  settings: Settings,
  disc: Disc,
  music: Music,
  upload: Upload,
  user: User,
  briefcase: Briefcase,
  "dollar-sign": DollarSign,
  "credit-card": CreditCard,
  mail: Mail,
  bot: Bot,
} as const;

type NavItem = {
  name: string;
  view: string;
  icon: ReactNode;
};

function getNavIcon(iconKey: keyof typeof NAV_ICON_MAP | string) {
  const Icon = NAV_ICON_MAP[iconKey as keyof typeof NAV_ICON_MAP];
  return Icon ? <Icon size={16} /> : null;
}

type DashboardShellProps = PropsWithChildren<{
  initialUser: AppSessionUser;
}>;

function DashboardShellContent({ children }: PropsWithChildren) {
  const { currentUser, canAccessManagement } = useDashboardAuth();
  const { showConfirm } = useToast() as {
    showConfirm: (
      title: string,
      message: string,
      onConfirm: () => void | Promise<void>,
      onCancel?: () => void,
    ) => void;
  };
  const { rawView, setView } = useDashboardRoute<string>();

  const currentView = rawView || "overview";
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [themeMode] = useState<"dark" | "light">("dark");
  const [densityMode] = useState<"compact" | "relaxed">("compact");

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsMobileNavOpen(false));
    return () => cancelAnimationFrame(frame);
  }, [currentView]);

  const railWidth = densityMode === "compact" ? 216 : 236;
  const shellBackground = themeMode === "light" ? "#f5f5f5" : "#0a0a0a";
  const shellColor = themeMode === "light" ? "#1f2937" : "#ffffff";
  const shellSurface = themeMode === "light" ? "#ffffff" : "#141414";
  const shellBorder = themeMode === "light" ? "rgba(0,0,0,0.08)" : "#2a2a2a";
  const shellMuted = themeMode === "light" ? "#6b7280" : "#888888";

  const hasPermission = (permission: string) =>
    hasPortalPermission(currentUser, permission);

  const canAccessManagementView = (view: string, permission: string) => {
    return canAccessAdminView(currentUser, view, permission);
  };

  const mgmtItems = getEnabledAdminViews(ADMIN_DASHBOARD_FEATURES)
    .filter((item) => canAccessManagementView(item.view, item.perm))
    .map((item) => ({
      name: item.navLabel,
      view: item.view,
      icon: getNavIcon(item.iconKey),
    }));

  const personalItems = PORTAL_VIEW_DEFINITIONS
    .filter((item) => !item.hidden && hasPermission(item.perm))
    .map((item) => ({
      name: item.navLabel,
      view: item.routeView,
      icon: getNavIcon(item.iconKey),
    }));

  const isPersonalView = currentView.startsWith("my-");
  const canSwitchModes =
    canAccessManagement && mgmtItems.length > 0 && personalItems.length > 0;

  const displayedSections = useMemo(() => (
    canSwitchModes
      ? [
          isPersonalView
            ? { label: "ARTIST PORTAL", items: personalItems }
            : { label: "MANAGEMENT", items: mgmtItems },
        ]
      : canAccessManagement
        ? [
            { label: "MANAGEMENT", items: mgmtItems },
            { label: "ARTIST PORTAL", items: personalItems },
          ].filter((section) => section.items.length > 0)
        : [{ label: "ARTIST DASHBOARD", items: personalItems }]
  ), [canAccessManagement, canSwitchModes, isPersonalView, mgmtItems, personalItems]);

  const searchableItems = useMemo(() => {
    const deduped = new Map<string, NavItem>();
    displayedSections.flatMap((section) => section.items).forEach((item) => {
      if (!deduped.has(item.view)) {
        deduped.set(item.view, item);
      }
    });
    return Array.from(deduped.values());
  }, [displayedSections]);

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const searchResults = !normalizedSearch
    ? searchableItems.slice(0, 8)
    : searchableItems
        .filter((item) => {
          return (
            item.name.toLowerCase().includes(normalizedSearch) ||
            item.view.toLowerCase().includes(normalizedSearch)
          );
        })
        .slice(0, 8);

  const navigateToView = (view: string) => {
    if (!view || view === currentView) {
      setIsSearchOpen(false);
      setIsMobileNavOpen(false);
      return;
    }

    setView(view, { preserveRecordId: false });
    setSearchQuery("");
    setIsSearchOpen(false);
    setIsMobileNavOpen(false);
  };

  const switchDashboardMode = (mode: "admin" | "artist") => {
    const targetView = mode === "artist" ? personalItems[0]?.view : mgmtItems[0]?.view;
    if (!targetView) return;
    navigateToView(targetView);
  };

  if (!currentUser) {
    return <DashboardLoader fullScreen label="LOADING WORKSPACE" subLabel="Preparing dashboard shell..." />;
  }

  return (
    <div
      className={styles.shell}
      style={
        {
          "--shell-background": shellBackground,
          "--shell-color": shellColor,
          "--shell-surface": shellSurface,
          "--shell-border": shellBorder,
          "--shell-muted": shellMuted,
        } as CSSProperties
      }
    >
      <div className={styles.ambient} aria-hidden />

      <button
        type="button"
        className={styles.mobileRailToggle}
        onClick={() => setIsMobileNavOpen((prev) => !prev)}
        aria-label="Toggle navigation"
      >
        {isMobileNavOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      <aside
        className={[styles.rail, isMobileNavOpen ? styles.railOpen : ""].filter(Boolean).join(" ")}
        style={{ width: `${railWidth}px` }}
      >
        <div className={styles.railTop}>
          <div className={styles.railUserHead}>
            <div className={styles.railUserAvatar}>
              {currentUser.image ? (
                <Image
                  loader={avatarLoader}
                  unoptimized
                  src={currentUser.image}
                  alt={`${currentUser.stageName || currentUser.name || "User"} avatar`}
                  width={42}
                  height={42}
                />
              ) : (
                <span>{currentUser.stageName?.[0] || currentUser.name?.[0] || "U"}</span>
              )}
            </div>
            <div className={styles.railUserMeta}>
              <span className={styles.railUserName}>
                {currentUser.stageName || currentUser.name || currentUser.email}
              </span>
              <small className={styles.railUserRole}>
                {(currentUser.role || "artist").toUpperCase()}
              </small>
            </div>
          </div>

          {canSwitchModes ? (
            <div className={styles.railModeSwitch}>
              <button
                type="button"
                className={[
                  styles.railModeButton,
                  !isPersonalView ? styles.railModeButtonActive : "",
                ].join(" ")}
                onClick={() => switchDashboardMode("admin")}
              >
                ADMIN
              </button>
              <button
                type="button"
                className={[
                  styles.railModeButton,
                  isPersonalView ? styles.railModeButtonActive : "",
                ].join(" ")}
                onClick={() => switchDashboardMode("artist")}
              >
                ARTIST
              </button>
            </div>
          ) : null}
        </div>

        <nav className={styles.railNav}>
          {displayedSections.map((section) => (
            <div key={section.label} className={styles.railSection}>
              <p className={styles.railSectionLabel}>{section.label}</p>
              {section.items.map((item) => {
                const isActive = currentView === item.view;

                return (
                  <Link
                    key={item.view}
                    href={`/dashboard?view=${item.view}`}
                    className={[styles.railItem, isActive ? styles.railItemActive : ""].join(" ")}
                    onClick={() => setIsMobileNavOpen(false)}
                  >
                    <span className={styles.railItemIcon}>{item.icon}</span>
                    <span className={styles.railItemLabel}>{item.name}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        <div className={styles.railFooter}>
          <button type="button" className={styles.railFooterButton}>
            <HelpCircle size={18} />
            <span>HELP</span>
          </button>
          <button
            type="button"
            className={styles.railFooterButton}
            onClick={() => {
              showConfirm(
                "Log out?",
                "You will be signed out from the dashboard and returned to the public site.",
                () => {
                  void signOut({ callbackUrl: "/" });
                },
              );
            }}
          >
            <LogOut size={18} />
            <span>LOGOUT</span>
          </button>
        </div>
      </aside>

      {isMobileNavOpen ? (
        <button type="button" className={styles.backdrop} onClick={() => setIsMobileNavOpen(false)} aria-label="Close navigation" />
      ) : null}

      <main className={styles.main} style={{ marginLeft: `${railWidth}px` }}>
        <div className={styles.window}>
          <header className={styles.toolbar}>
            <div className={styles.logo}>
              <Image src="/logo.png" alt="LOST" width={32} height={32} />
              <span className={styles.logoText}>LOST</span>
            </div>

            <div className={styles.toolbarRight}>
              <div className={styles.searchContainer}>
                <Search size={16} className={styles.searchIcon} />
                <input
                  type="text"
                  className={styles.searchInput}
                  placeholder="Search views..."
                  value={searchQuery}
                  onChange={(event) => {
                    setSearchQuery(event.target.value);
                    setIsSearchOpen(true);
                  }}
                  onFocus={() => setIsSearchOpen(true)}
                  onBlur={() => {
                    window.setTimeout(() => setIsSearchOpen(false), 120);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && searchResults.length > 0) {
                      event.preventDefault();
                      navigateToView(searchResults[0].view);
                    }

                    if (event.key === "Escape") {
                      setIsSearchOpen(false);
                    }
                  }}
                />

                {isSearchOpen ? (
                  <div className={styles.searchResults}>
                    {searchResults.length === 0 ? (
                      <div className={styles.searchEmpty}>No matching views</div>
                    ) : (
                      searchResults.map((item) => (
                        <button
                          key={item.view}
                          type="button"
                          className={[
                            styles.searchResultItem,
                            currentView === item.view ? styles.searchResultActive : "",
                          ].join(" ")}
                          onClick={() => navigateToView(item.view)}
                        >
                          <span className={styles.searchResultIcon}>{item.icon}</span>
                          <span>{item.name}</span>
                        </button>
                      ))
                    )}
                  </div>
                ) : null}
              </div>

              <div className={styles.avatar}>
                {currentUser.image ? (
                  <Image
                    loader={avatarLoader}
                    unoptimized
                    src={currentUser.image}
                    alt={`${currentUser.stageName || currentUser.name || "User"} avatar`}
                    width={36}
                    height={36}
                  />
                ) : (
                  <span>{currentUser.stageName?.[0] || currentUser.name?.[0] || "U"}</span>
                )}
              </div>
            </div>
          </header>

          <div style={{ position: "relative" }}>
            <AnimatePresence mode="popLayout">
              <motion.section
                key={currentView}
                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -6, filter: "blur(3px)" }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className={styles.content}
              >
                {children}
              </motion.section>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </div>
  );
}

export default function DashboardShell({
  children,
  initialUser,
}: DashboardShellProps) {
  return (
    <DashboardAuthProvider initialUser={initialUser}>
      <DashboardShellContent>{children}</DashboardShellContent>
    </DashboardAuthProvider>
  );
}
