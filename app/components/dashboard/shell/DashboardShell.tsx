"use client";

import React, {
  type ReactNode,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
  isValidElement,
  cloneElement,
} from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut } from "next-auth/react";
import { BRANDING } from "@/lib/branding";
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
  BarChart3,
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
import { Button, Tabs, cn } from "@heroui/react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/app/components/ThemeProvider";

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

import Breadcrumb from "@/app/components/dashboard/primitives/Breadcrumb";
import NotificationBell from "@/app/components/dashboard/primitives/NotificationBell";
import DashboardLoader from "@/app/components/dashboard/DashboardLoader";
import { useToast } from "@/app/components/ToastContext";
import { DashboardAuthProvider, useDashboardAuth } from "@/app/components/dashboard/context/DashboardAuthProvider";
import { useDashboardRoute } from "@/app/components/dashboard/hooks/useDashboardRoute";

import styles from "./DashboardShell.module.css";

const avatarLoader = ({ src }: { src: string }) => src;

const NAV_ICON_MAP = {
  "layout-dashboard": LayoutDashboard,
  "bar-chart-3": BarChart3,
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
  return Icon ? <Icon size={15} /> : null;
}

type DashboardShellProps = PropsWithChildren<{
  initialUser: AppSessionUser;
}>;

function ViewLocker({ view, children }: { view: string } & PropsWithChildren) {
  const [lockedView] = useState(view);
  if (!isValidElement(children)) return <>{children}</>;
  return cloneElement(children as React.ReactElement<any>, { view: lockedView });
}

function DashboardShellContent({ children }: PropsWithChildren) {
  const { currentUser, canAccessManagement } = useDashboardAuth();
  const { theme, toggleTheme } = useTheme();
  const { showConfirm } = useToast() as {
    showConfirm: (
      title: string,
      message: string,
      onConfirm: () => void | Promise<void>,
      onCancel?: () => void,
    ) => void;
  };
  const { rawView, setView, pathname } = useDashboardRoute<string>();
  const currentView = useMemo(() => {
    if (rawView) return rawView;
    if (pathname.startsWith("/dashboard/demo/")) {
      return canAccessManagement ? "submissions" : "my-demos";
    }
    return "overview";
  }, [rawView, pathname, canAccessManagement]);

  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsMobileNavOpen(false));
    return () => cancelAnimationFrame(frame);
  }, [currentView]);

  const railWidth = 220;

  const hasPermission = (permission: string) =>
    hasPortalPermission(currentUser, permission);

  const canAccessManagementView = (view: string, permission: string) =>
    canAccessAdminView(currentUser, view, permission);

  const mgmtItems = getEnabledAdminViews(ADMIN_DASHBOARD_FEATURES)
    .filter((item) => canAccessManagementView(item.view, item.perm))
    .map((item) => ({ name: item.navLabel, view: item.view, icon: getNavIcon(item.iconKey) }));

  const personalItems = PORTAL_VIEW_DEFINITIONS
    .filter((item) => !item.hidden && hasPermission(item.perm))
    .map((item) => ({ name: item.navLabel, view: item.routeView, icon: getNavIcon(item.iconKey) }));

  const isPersonalView = currentView.startsWith("my-");
  const canSwitchModes = canAccessManagement && mgmtItems.length > 0 && personalItems.length > 0;

  const displayedSections = useMemo(() => (
    canSwitchModes
      ? [isPersonalView
          ? { label: "ARTIST PORTAL", items: personalItems }
          : { label: "MANAGEMENT", items: mgmtItems }]
      : canAccessManagement
        ? [
            { label: "MANAGEMENT", items: mgmtItems },
            { label: "ARTIST PORTAL", items: personalItems },
          ].filter((s) => s.items.length > 0)
        : [{ label: "ARTIST DASHBOARD", items: personalItems }]
  ), [canAccessManagement, canSwitchModes, isPersonalView, mgmtItems, personalItems]);

  const searchableItems = useMemo(() => {
    const deduped = new Map<string, NavItem>();
    displayedSections.flatMap((s) => s.items).forEach((item) => {
      if (!deduped.has(item.view)) deduped.set(item.view, item);
    });
    return Array.from(deduped.values());
  }, [displayedSections]);

  const mobileNavItems = useMemo(() => searchableItems.slice(0, 4), [searchableItems]);

  const normalizedSearch = searchQuery.trim().toLowerCase();
  const searchResults = !normalizedSearch
    ? searchableItems.slice(0, 8)
    : searchableItems
        .filter((item) =>
          item.name.toLowerCase().includes(normalizedSearch) ||
          item.view.toLowerCase().includes(normalizedSearch)
        )
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
    if (targetView) navigateToView(targetView);
  };

  if (!currentUser) {
    return <DashboardLoader fullScreen label="LOADING WORKSPACE" subLabel="Preparing dashboard shell..." />;
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-x-hidden">
      <div className={styles.ambient} aria-hidden />

      {/* Mobile hamburger */}
      <button
        type="button"
        className={cn(
          styles.mobileToggle,
          "ds-glass rounded-xl text-foreground",
        )}
        onClick={() => setIsMobileNavOpen((p) => !p)}
        aria-label="Toggle navigation"
      >
        {isMobileNavOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Sidebar */}
      <aside
        className={cn(
          styles.rail,
          "ds-glass rounded-3xl",
          isMobileNavOpen && styles.railOpen,
        )}
        style={{ width: `${railWidth}px` }}
      >
        {/* User header */}
        <div className="flex flex-col gap-3 border-b border-[var(--ds-divider)] px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="ds-item flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-sm font-bold text-foreground">
              {currentUser.image ? (
                <Image
                  loader={avatarLoader}
                  unoptimized
                  src={currentUser.image}
                  alt={`${currentUser.stageName || currentUser.name || "User"} avatar`}
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{currentUser.stageName?.[0] || currentUser.name?.[0] || "U"}</span>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="truncate text-[11px] font-extrabold tracking-widest uppercase ds-text">
                {currentUser.stageName || currentUser.name || currentUser.email}
              </span>
              <span className="text-[9px] font-bold tracking-widest uppercase ds-text-muted">
                {(currentUser.role || "artist").toUpperCase()}
              </span>
            </div>
          </div>

          {canSwitchModes && (
            <Tabs
              selectedKey={isPersonalView ? "artist" : "admin"}
              onSelectionChange={(key) => switchDashboardMode(key as "admin" | "artist")}
              className="w-full"
            >
              <Tabs.ListContainer>
                <Tabs.List aria-label="Dashboard mode" className="w-full">
                  <Tabs.Tab id="admin" className="flex-1 text-[10px] font-extrabold tracking-widest uppercase">
                    ADMIN
                    <Tabs.Indicator />
                  </Tabs.Tab>
                  <Tabs.Tab id="artist" className="flex-1 text-[10px] font-extrabold tracking-widest uppercase">
                    ARTIST
                    <Tabs.Indicator />
                  </Tabs.Tab>
                </Tabs.List>
              </Tabs.ListContainer>
            </Tabs>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 flex flex-col gap-2 px-2 py-3 overflow-y-auto overflow-x-hidden">
          {displayedSections.map((section) => (
            <div key={section.label} className="flex flex-col gap-0.5">
              <p className="mx-3 mb-1 mt-2 text-[9px] font-bold tracking-[0.18em] uppercase ds-text-faint">
                {section.label}
              </p>
              {section.items.map((item) => {
                const isActive = currentView === item.view;
                return (
                  <Link
                    key={item.view}
                    href={`/dashboard?view=${item.view}`}
                    onClick={() => setIsMobileNavOpen(false)}
                    className={cn(
                      "relative flex items-center gap-2.5 px-3 min-h-9.5 rounded-xl",
                      "text-[11px] font-extrabold tracking-widest uppercase no-underline",
                      "transition-colors duration-150",
                      isActive
                        ? "bg-[var(--ds-item-bg-hover)] text-foreground"
                        : "ds-text-muted hover:bg-[var(--ds-item-bg)] hover:text-[var(--ds-text)]",
                    )}
                  >
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4.5 rounded-r-full bg-foreground" />
                    )}
                    <span className="flex items-center justify-center w-4 h-4 shrink-0">
                      {item.icon}
                    </span>
                    <span className="truncate">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="flex flex-col gap-0.5 border-t border-[var(--ds-divider)] px-2 py-3">
          <Link
            href="/faq"
            className="flex w-full min-h-9.5 items-center gap-2.5 rounded-xl border-0 bg-transparent px-3 text-[10px] font-extrabold tracking-widest uppercase ds-text-muted transition-colors hover:bg-[var(--ds-item-bg)] hover:text-[var(--ds-text)] cursor-pointer no-underline"
          >
            <HelpCircle size={16} />
            <span>HELP</span>
          </Link>
          <button
            type="button"
            className="flex w-full min-h-9.5 items-center gap-2.5 rounded-xl border-0 bg-transparent px-3 text-[10px] font-extrabold tracking-widest uppercase ds-text-muted transition-colors hover:bg-[var(--ds-item-bg)] hover:text-[var(--ds-text)] cursor-pointer"
            onClick={() => {
              showConfirm(
                "Log out?",
                "You will be signed out from the dashboard and returned to the public site.",
                () => { void signOut({ callbackUrl: "/" }); },
              );
            }}
          >
            <LogOut size={16} />
            <span>LOGOUT</span>
          </button>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {isMobileNavOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/60 z-98 backdrop-blur-sm border-0 cursor-pointer"
          onClick={() => setIsMobileNavOpen(false)}
          aria-label="Close navigation"
        />
      )}

      {/* Main content */}
      <main className={styles.main} style={{ marginLeft: `${railWidth + 12}px` }}>
        {/* Window */}
        <div className="ds-glass flex min-h-[calc(100vh-24px)] flex-col overflow-hidden rounded-3xl">

          {/* Toolbar */}
          <header className="flex min-h-15 items-center justify-between gap-4 border-b border-[var(--ds-divider)] px-5">
            <div className="flex items-center gap-2.5 ds-text">
              <Image src="/logo.png" alt={BRANDING.shortName} width={28} height={28} />
              <span className="font-black text-base tracking-[0.22em] uppercase">{BRANDING.shortName}</span>
            </div>

            <div className="flex items-center justify-end gap-3 flex-1">
              {/* Search */}
              <div className={styles.searchBox}>
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 ds-text-muted">
                  <Search size={14} />
                </span>
                <input
                  type="text"
                  placeholder="Search views..."
                  value={searchQuery}
                  onChange={(e) => { setSearchQuery(e.target.value); setIsSearchOpen(true); }}
                  onFocus={() => setIsSearchOpen(true)}
                  onBlur={() => { window.setTimeout(() => setIsSearchOpen(false), 120); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && searchResults.length > 0) {
                      e.preventDefault();
                      navigateToView(searchResults[0].view);
                    }
                    if (e.key === "Escape") setIsSearchOpen(false);
                  }}
                  className="h-9 w-full rounded-xl border border-[var(--ds-item-border)] bg-[var(--ds-item-bg)] pl-9 pr-4 text-xs font-semibold ds-text placeholder:ds-text-faint outline-none transition-colors focus:border-[var(--ds-item-border-hover)] focus:bg-[var(--ds-item-bg-hover)]"
                />

                {isSearchOpen && (
                  <div className="ds-glass absolute left-0 right-0 top-[calc(100%+8px)] z-40 flex flex-col gap-0.5 overflow-hidden rounded-2xl p-1.5">
                    {searchResults.length === 0 ? (
                      <div className="px-3 py-2 text-[11px] font-semibold ds-text-muted">
                        No matching views
                      </div>
                    ) : (
                      searchResults.map((item) => (
                        <button
                          key={item.view}
                          type="button"
                          onClick={() => navigateToView(item.view)}
                          className={cn(
                            "flex items-center gap-2 w-full min-h-9 px-3 rounded-xl text-left",
                            "text-[11px] font-extrabold tracking-wider uppercase border-0 cursor-pointer",
                            "transition-colors",
                            currentView === item.view
                              ? "bg-[var(--ds-item-bg-hover)] text-foreground"
                              : "bg-transparent text-foreground hover:bg-[var(--ds-item-bg)]",
                          )}
                        >
                          <span className="flex h-4 w-4 shrink-0 items-center ds-text-muted">
                            {item.icon}
                          </span>
                          <span>{item.name}</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Notifications */}
              <NotificationBell />

              {/* Theme toggle */}
              <button
                type="button"
                onClick={toggleTheme}
                aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                className="ds-item flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ds-text-muted transition-colors hover:bg-[var(--ds-item-bg-hover)] hover:text-[var(--ds-text)]"
              >
                {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
              </button>

              {/* Avatar */}
              <div className="ds-item flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-xl text-xs font-bold text-foreground">
                {currentUser.image ? (
                  <Image
                    loader={avatarLoader}
                    unoptimized
                    src={currentUser.image}
                    alt={`${currentUser.stageName || currentUser.name || "User"} avatar`}
                    width={36}
                    height={36}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>{currentUser.stageName?.[0] || currentUser.name?.[0] || "U"}</span>
                )}
              </div>
            </div>
          </header>

          {/* Breadcrumb + Help */}
          <div className="flex items-center justify-between px-6 pt-4 pb-2">
            <Breadcrumb view={currentView} isAdmin={!isPersonalView} />
            <Link
              href="/faq"
              className="ds-item flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ds-text-muted transition-colors hover:bg-[var(--ds-item-bg-hover)] hover:text-[var(--ds-text)] no-underline"
              aria-label="Help & FAQ"
            >
              <HelpCircle size={15} />
            </Link>
          </div>

          {/* View content */}
          <div style={{ position: "relative" }}>
            <AnimatePresence initial={false} mode="wait">
              <motion.section
                key={currentView}
                initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -6, filter: "blur(3px)" }}
                transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
                className={styles.content}
              >
                <ViewLocker view={currentView}>
                  {children}
                </ViewLocker>
              </motion.section>
            </AnimatePresence>
          </div>
        </div>
      </main>

      <nav className={styles.mobileBottomBar} aria-label="Mobile dashboard navigation">
        {mobileNavItems.map((item) => {
          const isActive = currentView === item.view;
          return (
            <button
              key={item.view}
              type="button"
              onClick={() => navigateToView(item.view)}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl border-0 px-2 py-2.5",
                "text-[9px] font-extrabold tracking-[0.18em] uppercase transition-colors",
                isActive
                  ? "bg-[var(--ds-item-bg-hover)] text-foreground"
                  : "bg-transparent ds-text-muted",
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <span className="flex h-4 w-4 items-center justify-center">{item.icon}</span>
              <span className="truncate max-w-full">{item.name}</span>
            </button>
          );
        })}

        <button
          type="button"
          onClick={() => setIsMobileNavOpen(true)}
          className="flex min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-2xl border-0 px-2 py-2.5 text-[9px] font-extrabold tracking-[0.18em] uppercase ds-text-muted transition-colors"
          aria-label="Open navigation menu"
        >
          <span className="flex h-4 w-4 items-center justify-center">
            <Menu size={15} />
          </span>
          <span className="truncate max-w-full">More</span>
        </button>
      </nav>
    </div>
  );
}

export default function DashboardShell({ children, initialUser }: DashboardShellProps) {
  return (
    <DashboardAuthProvider initialUser={initialUser}>
      <DashboardShellContent>{children}</DashboardShellContent>
    </DashboardAuthProvider>
  );
}
