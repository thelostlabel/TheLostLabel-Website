"use client";
import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useToast } from '@/app/components/ToastContext';

const FEATURES = {
    discordBridge:  process.env.NEXT_PUBLIC_FEATURE_DISCORD     !== 'false',
    wisePayouts:    process.env.NEXT_PUBLIC_FEATURE_WISE         === 'true',
    submissions:    process.env.NEXT_PUBLIC_FEATURE_SUBMISSIONS  !== 'false',
    contracts:      process.env.NEXT_PUBLIC_FEATURE_CONTRACTS    !== 'false',
    earnings:       process.env.NEXT_PUBLIC_FEATURE_EARNINGS     !== 'false',
    payments:       process.env.NEXT_PUBLIC_FEATURE_PAYMENTS     !== 'false',
    releases:       process.env.NEXT_PUBLIC_FEATURE_RELEASES     !== 'false',
    communications: process.env.NEXT_PUBLIC_FEATURE_COMMS        !== 'false',
    spotifySync:    process.env.NEXT_PUBLIC_FEATURE_SPOTIFY_SYNC !== 'false',
};

// Import View Components
import HomeView from './admin/HomeView';
import SubmissionsView from './admin/SubmissionsView';
import ArtistsView from './admin/ArtistsView';
import UsersView from './admin/UsersView';
import RequestsView from './admin/RequestsView';
import ContractsView from './admin/ContractsView';
import ReleasesView from './admin/ReleasesView';
import EarningsView from './admin/EarningsView';
import PaymentsView from './admin/PaymentsView';
import ContentView from './admin/ContentView';
import WebhooksView from './admin/WebhooksView';
import CommunicationsView from './admin/CommunicationsView';
import SettingsView from './admin/SettingsView';
import DiscordBridgeView from './admin/DiscordBridgeView';
import DashboardLoader from './DashboardLoader';
import { canDeleteDemos, canViewAllDemos, canViewUsers, hasAdminViewPermission } from '@/lib/permissions';
import { useMinimumLoader } from '@/lib/use-minimum-loader';

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
    const rawView = searchParams.get('view') || 'overview';
    const aliasViewMap = {
        submit: 'submissions'
    };
    const normalizedView = aliasViewMap[rawView] || rawView;
    const knownViews = new Set([
        'overview',
        'artists',
        'users',
        'requests',
        'content',
        'webhooks',
        'settings',
        ...(FEATURES.submissions    ? ['submissions']    : []),
        ...(FEATURES.contracts      ? ['contracts']      : []),
        ...(FEATURES.earnings       ? ['earnings']       : []),
        ...(FEATURES.payments       ? ['payments']       : []),
        ...(FEATURES.releases       ? ['releases']       : []),
        ...(FEATURES.communications ? ['communications'] : []),
        ...(FEATURES.discordBridge  ? ['discord-bridge'] : []),
        ...(FEATURES.wisePayouts    ? ['wise-payouts']   : []),
    ]);
    const view = knownViews.has(normalizedView) ? normalizedView : 'overview';
    const viewDisplayNames = {
        overview: 'Overview',
        artists: 'Artists',
        users: 'Users',
        requests: 'Requests',
        content: 'Content',
        webhooks: 'Webhooks',
        settings: 'Settings',
        ...(FEATURES.submissions    ? { submissions: 'Submissions' }       : {}),
        ...(FEATURES.contracts      ? { contracts: 'Contracts' }           : {}),
        ...(FEATURES.earnings       ? { earnings: 'Earnings' }             : {}),
        ...(FEATURES.payments       ? { payments: 'Payments' }             : {}),
        ...(FEATURES.releases       ? { releases: 'Releases' }             : {}),
        ...(FEATURES.communications ? { communications: 'Communications' } : {}),
        ...(FEATURES.discordBridge ? { 'discord-bridge': 'Discord Bridge' } : {}),
        ...(FEATURES.wisePayouts ? { 'wise-payouts': 'Wise Payouts' } : {}),
    };
    const viewToPerm = {
        overview: 'admin_view_overview',
        submissions: 'admin_view_submissions',
        artists: 'admin_view_artists',
        users: 'admin_view_users',
        requests: 'admin_view_requests',
        content: 'admin_view_content',
        webhooks: 'admin_view_webhooks',
        contracts: 'admin_view_contracts',
        earnings: 'admin_view_earnings',
        payments: 'admin_view_payments',
        releases: 'admin_view_releases',
        settings: 'admin_view_settings',
        communications: 'admin_view_communications',
        'discord-bridge': 'admin_view_discord_bridge'
    };

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
            : hasAdminViewPermission(session?.user, viewToPerm[view]);
    const canDeleteSubmission = canDeleteDemos(session?.user);

    const [earningsPagination, setEarningsPagination] = useState({ page: 1, pages: 1, total: 0, limit: 50 });

    useEffect(() => {
        if (!canViewCurrentSection) {
            setLoading(false);
            return;
        }

        if (view === 'submissions') fetchSubmissions();
        else if (view === 'artists') { fetchArtists(); fetchUsers(); fetchReleases(); fetchContracts(); }
        else if (view === 'users') fetchUsers();
        else if (view === 'requests') fetchRequests();
        else if (view === 'content') fetchContent();
        else if (view === 'contracts') { fetchContracts(); fetchArtists(); fetchReleases(); fetchSubmissions(); }
        else if (view === 'releases') fetchReleases();
        else if (view === 'earnings') { fetchEarnings(); fetchContracts(); }
        else if (view === 'payments') { fetchPayments(); fetchUsers(); }
        else if (view === 'webhooks') fetchWebhooks();
        else if (view === 'communications') fetchArtists();
        else if (view === 'discord-bridge') fetchDiscordBridge();
        else if (view === 'settings') setLoading(false);
        else setLoading(false);
    }, [view, canViewCurrentSection]);

    const fetchContent = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/content');
            const data = await res.json();
            setSiteContent(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/requests');
            const data = await res.json();
            setRequests(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchSubmissions = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/demo');
            const data = await res.json();
            setSubmissions(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchArtists = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/artists');
            const data = await res.json();
            console.log("[AdminView] Fetched Artists:", data.artists?.length);
            setArtists(data.artists || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }

    };

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/users');
            const data = await res.json();
            setUsers(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchWebhooks = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/webhooks');
            const data = await res.json();
            setWebhooks(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchContracts = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/contracts?all=true');
            const data = await res.json();
            console.log("[AdminView] Fetched Contracts:", data.contracts?.length);
            setContracts(data.contracts || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }

    };

    const fetchEarnings = async (page = 1) => {
        setLoading(true);
        try {
            const res = await fetch(`/api/earnings?page=${page}&limit=50`);
            const data = await res.json();
            setEarnings(data.earnings || []);
            if (data.pagination) setEarningsPagination(data.pagination);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/payments');
            const data = await res.json();
            setPayments(data.payments || []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const fetchReleases = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/releases');
            const data = await res.json();
            console.log("[AdminView] Fetched Releases:", data.length);
            setReleases(Array.isArray(data) ? data : []);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }

    };

    const fetchDiscordBridge = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/discord-bridge');
            const data = await res.json();
            setDiscordBridge(data || null);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

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
                fetchArtists();
                if (view === 'users') fetchUsers();
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
                    fetchSubmissions();
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
        overview: true,
        submissions: submissions.length > 0,
        artists: artists.length > 0,
        users: users.length > 0,
        requests: requests.length > 0,
        contracts: contracts.length > 0,
        earnings: earnings.length > 0,
        payments: payments.length > 0,
        releases: releases.length > 0,
        webhooks: webhooks.length > 0,
        content: siteContent.length > 0,
        communications: artists.length > 0,
        'discord-bridge': discordBridge !== null,
        settings: true
    };

    if (showLoading && !hasData[view]) {
        return (
            <DashboardLoader
                fullScreen
                label="Admin Panel"
                subLabel={`Preparing ${viewDisplayNames[view] || 'Dashboard'} module...`}
            />
        );
    }

    return (
        <div className="dashboard-view p-0">
            {view === 'overview' && <HomeView onNavigate={(v) => {
                const params = new URLSearchParams(window.location.search);
                params.set('view', v);
                window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
                window.dispatchEvent(new Event('popstate'));
            }} />}
            {view === 'submissions'   && FEATURES.submissions    && <SubmissionsView demos={submissions} onDelete={handleDeleteDemo} canDelete={canDeleteSubmission} />}
            {view === 'artists'       && <ArtistsView artists={artists} users={users} releases={releases} contracts={contracts} onSync={handleSyncStats} onRefresh={fetchArtists} />}
            {view === 'users'         && <UsersView users={users} onRefresh={fetchUsers} />}
            {view === 'requests'      && <RequestsView requests={requests} />}
            {view === 'contracts'     && FEATURES.contracts      && <ContractsView contracts={contracts} artists={artists} releases={releases} demos={submissions.filter(s => s.status === 'approved')} onRefresh={fetchContracts} />}
            {view === 'earnings'      && FEATURES.earnings       && <EarningsView earnings={earnings} contracts={contracts} onRefresh={fetchEarnings} pagination={earningsPagination} />}
            {view === 'payments'      && FEATURES.payments       && <PaymentsView payments={payments} users={users} onRefresh={fetchPayments} />}
            {view === 'content'       && <ContentView content={siteContent} onRefresh={fetchContent} />}
            {view === 'webhooks'      && <WebhooksView webhooks={webhooks} onRefresh={fetchWebhooks} />}
            {view === 'releases'      && FEATURES.releases       && <ReleasesView releases={releases} />}
            {view === 'communications'&& FEATURES.communications && <CommunicationsView artists={artists} />}
            {view === 'settings'      && <SettingsView />}
            {view === 'discord-bridge'&& FEATURES.discordBridge  && <DiscordBridgeView data={discordBridge} onRefresh={fetchDiscordBridge} />}
            {view === 'wise-payouts'  && FEATURES.wisePayouts    && <WisePayoutsView />}
        </div>
    );
}
