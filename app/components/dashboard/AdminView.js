"use client";
import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/app/components/ToastContext';

import DashboardLoader from './DashboardLoader';
import { canDeleteDemos, canViewAllDemos, canViewUsers, hasAdminViewPermission } from '@/lib/permissions';
import { useMinimumLoader } from '@/lib/use-minimum-loader';
import {
    getAdminFeatureFlags,
    getAdminViewDisplayName,
    getAdminViewLoaders,
    getAdminViewPermission,
    hasAdminViewData,
    normalizeAdminView
} from './admin-view-registry';

const lazyView = (loader) => dynamic(loader, {
    loading: () => <DashboardLoader label="LOADING MODULE" subLabel="Fetching admin view..." />
});

const HomeView = lazyView(() => import('./admin/HomeView'));
const SubmissionsView = lazyView(() => import('./admin/SubmissionsView'));
const ArtistsView = lazyView(() => import('./admin/ArtistsView'));
const UsersView = lazyView(() => import('./admin/UsersView'));
const RequestsView = lazyView(() => import('./admin/RequestsView'));
const ContractsView = lazyView(() => import('./admin/ContractsView'));
const ReleasesView = lazyView(() => import('./admin/ReleasesView'));
const EarningsView = lazyView(() => import('./admin/EarningsView'));
const PaymentsView = lazyView(() => import('./admin/PaymentsView'));
const ContentView = lazyView(() => import('./admin/ContentView'));
const WebhooksView = lazyView(() => import('./admin/WebhooksView'));
const CommunicationsView = lazyView(() => import('./admin/CommunicationsView'));
const SettingsView = lazyView(() => import('./admin/SettingsView'));
const DiscordBridgeView = lazyView(() => import('./admin/DiscordBridgeView'));

function WisePayoutsView() {
    return (
        <div className="dashboard-view py-10 text-center">
            <h2 className="text-xl font-black tracking-[0.16em] text-neutral-200">WISE_PAYOUTS</h2>
            <p className="mt-2 text-sm text-neutral-500">This module is not wired into the current dashboard build yet.</p>
        </div>
    );
}

export default function AdminView() {
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const { showToast, showConfirm } = useToast();
    const features = getAdminFeatureFlags();
    const rawView = searchParams.get('view') || 'overview';
    const view = normalizeAdminView(rawView);
    const viewDisplayName = getAdminViewDisplayName(view);

    const [submissions, setSubmissions] = useState([]);
    const [artists, setArtists] = useState([]);
    const [users, setUsers] = useState([]);
    const [requests, setRequests] = useState([]);
    const [siteContent, setSiteContent] = useState([]);
    const [webhooks, setWebhooks] = useState([]);
    const [contracts, setContracts] = useState([]);
    const [earnings, setEarnings] = useState([]);
    const [payments, setPayments] = useState([]);
    const [releases, setReleases] = useState([]);
    const [discordBridge, setDiscordBridge] = useState(null);
    const [loading, setLoading] = useState(true);
    const showLoading = useMinimumLoader(loading, 250);
    const canViewCurrentSection = view === 'submissions'
        ? canViewAllDemos(session?.user)
        : view === 'users'
            ? canViewUsers(session?.user)
            : hasAdminViewPermission(session?.user, getAdminViewPermission(view));
    const canDeleteSubmission = canDeleteDemos(session?.user);

    const [earningsPagination, setEarningsPagination] = useState({ page: 1, pages: 1, total: 0, limit: 50 });

    const fetchers = useMemo(() => ({
        content: async () => {
            const res = await fetch('/api/admin/content');
            const data = await res.json();
            setSiteContent(Array.isArray(data) ? data : []);
        },
        requests: async () => {
            const res = await fetch('/api/admin/requests?limit=50');
            const data = await res.json();
            setRequests(data.requests || []);
        },
        submissions: async () => {
            const res = await fetch('/api/demo?limit=50');
            const data = await res.json();
            setSubmissions(data.demos || []);
        },
        artists: async () => {
            const res = await fetch('/api/admin/artists?limit=50');
            const data = await res.json();
            setArtists(data.artists || []);
        },
        users: async () => {
            const res = await fetch('/api/admin/users?limit=50');
            const data = await res.json();
            setUsers(data.users || []);
        },
        webhooks: async () => {
            const res = await fetch('/api/admin/webhooks');
            const data = await res.json();
            setWebhooks(Array.isArray(data) ? data : []);
        },
        contracts: async () => {
            const res = await fetch('/api/contracts?all=true&limit=50');
            const data = await res.json();
            setContracts(data.contracts || []);
        },
        earnings: async (page = 1) => {
            const res = await fetch(`/api/earnings?page=${page}&limit=50`);
            const data = await res.json();
            setEarnings(data.earnings || []);
            if (data.pagination) setEarningsPagination(data.pagination);
        },
        payments: async () => {
            const res = await fetch('/api/payments?limit=50');
            const data = await res.json();
            setPayments(data.payments || []);
        },
        releases: async () => {
            const res = await fetch('/api/admin/releases?limit=50');
            const data = await res.json();
            setReleases(data.releases || []);
        },
        discordBridge: async () => {
            const res = await fetch('/api/admin/discord-bridge');
            const data = await res.json();
            setDiscordBridge(data || null);
        }
    }), []);

    const runLoaders = useCallback(async (keys = []) => {
        if (!keys.length) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            await Promise.all(keys.map(async (key) => {
                const loader = fetchers[key];
                if (!loader) return;
                try {
                    await loader();
                } catch (error) {
                    console.error(`[AdminView] Failed loader: ${key}`, error);
                }
            }));
        } finally {
            setLoading(false);
        }
    }, [fetchers]);

    useEffect(() => {
        if (!canViewCurrentSection) {
            setLoading(false);
            return;
        }

        void runLoaders(getAdminViewLoaders(view));
    }, [canViewCurrentSection, runLoaders, view]);

    const handleSyncStats = async (userId, existingUrl, artistId = null) => {
        if (!userId && !existingUrl) return;
        let spotifyUrl = existingUrl;
        if (!spotifyUrl) {
            spotifyUrl = prompt("Enter Artist Spotify Profile URL:");
            if (!spotifyUrl) return;
        }
        setLoading(true);
        try {
            const res = await fetch('/api/admin/scrape', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, artistId, spotifyUrl })
            });
            const data = await res.json();
            if (data.success) {
                showToast(`SYNC_COMPLETED: ${data.monthlyListeners?.toLocaleString()} Listeners`, "success");
                await runLoaders(view === 'users' ? ['artists', 'users'] : ['artists']);
            } else {
                showToast(data.error || "Sync failed", "error");
            }
        } catch (e) {
            console.error(e);
            showToast("Sync error", "error");
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteDemo = async (id) => {
        if (!canDeleteSubmission) {
            showToast("You do not have permission to delete demos.", "error");
            return;
        }

        showConfirm(
            "DELETE SUBMISSION?",
            "Are you sure you want to PERMANENTLY delete this submission? This action cannot be undone.",
            async () => {
                try {
                    await fetch(`/api/demo/${id}`, { method: 'DELETE' });
                    showToast("Submission deleted", "success");
                    await runLoaders(['submissions']);
                } catch (e) {
                    showToast("Delete failed", "error");
                }
            }
        );
    };

    if (!showLoading && !canViewCurrentSection) {
        return (
            <div className="dashboard-view py-10 text-center">
                <h2 className="text-xl font-black tracking-[0.16em] text-red-400">ACCESS_DENIED</h2>
                <p className="mt-2 text-sm text-neutral-500">You do not have permission to view this section.</p>
            </div>
        );
    }

    // Only show full-screen loader if it's the very first load for that view
    const hasData = {
        submissions,
        artists,
        users,
        requests,
        contracts,
        earnings,
        payments,
        releases,
        webhooks,
        siteContent,
        discordBridge
    };

    if (showLoading && !hasAdminViewData(view, hasData)) {
        return (
            <DashboardLoader
                fullScreen
                label="Admin Panel"
                subLabel={`Preparing ${viewDisplayName} module...`}
            />
        );
    }

    const refreshEarnings = async (page = 1) => {
        setLoading(true);
        try {
            await Promise.all([
                fetchers.contracts(),
                fetchers.earnings(page)
            ]);
        } finally {
            setLoading(false);
        }
    };

    const refreshers = {
        content: () => runLoaders(['content']),
        requests: () => runLoaders(['requests']),
        submissions: () => runLoaders(['submissions']),
        artists: () => runLoaders(['artists', 'users', 'releases', 'contracts']),
        users: () => runLoaders(['users']),
        webhooks: () => runLoaders(['webhooks']),
        contracts: () => runLoaders(['contracts', 'artists', 'releases', 'submissions']),
        payments: () => runLoaders(['payments', 'users']),
        releases: () => runLoaders(['releases']),
        discordBridge: () => runLoaders(['discordBridge'])
    };

    return (
        <div className="dashboard-view p-0">
            {view === 'overview' && <HomeView onNavigate={(v) => {
                const params = new URLSearchParams(window.location.search);
                params.set('view', v);
                window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
                window.dispatchEvent(new Event('popstate'));
            }} />}
            {view === 'submissions'   && features.submissions    && <SubmissionsView demos={submissions} onDelete={handleDeleteDemo} canDelete={canDeleteSubmission} />}
            {view === 'artists'       && <ArtistsView artists={artists} users={users} releases={releases} contracts={contracts} onSync={handleSyncStats} onRefresh={refreshers.artists} />}
            {view === 'users'         && <UsersView users={users} onRefresh={refreshers.users} />}
            {view === 'requests'      && <RequestsView requests={requests} />}
            {view === 'contracts'     && features.contracts      && <ContractsView contracts={contracts} artists={artists} releases={releases} demos={submissions.filter(s => s.status === 'approved')} onRefresh={refreshers.contracts} />}
            {view === 'earnings'      && features.earnings       && <EarningsView earnings={earnings} contracts={contracts} onRefresh={refreshEarnings} pagination={earningsPagination} />}
            {view === 'payments'      && features.payments       && <PaymentsView payments={payments} users={users} onRefresh={refreshers.payments} />}
            {view === 'content'       && <ContentView content={siteContent} onRefresh={refreshers.content} />}
            {view === 'webhooks'      && <WebhooksView webhooks={webhooks} onRefresh={refreshers.webhooks} />}
            {view === 'releases'      && features.releases       && <ReleasesView releases={releases} />}
            {view === 'communications'&& features.communications && <CommunicationsView artists={artists} />}
            {view === 'settings'      && <SettingsView />}
            {view === 'discord-bridge'&& features.discordBridge  && <DiscordBridgeView data={discordBridge} onRefresh={refreshers.discordBridge} />}
            {view === 'wise-payouts'  && features.wisePayouts    && <WisePayoutsView />}
        </div>
    );
}
