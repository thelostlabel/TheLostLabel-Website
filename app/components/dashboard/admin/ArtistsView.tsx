"use client";
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useDebouncedSearch } from "@/app/components/dashboard/hooks/useDebouncedSearch";
import NextImage from 'next/image';
import { RefreshCw, Plus, AlertCircle, Edit2, Settings2, CheckCircle, Mail } from 'lucide-react';
import BulkActionsBar from '@/app/components/dashboard/primitives/BulkActionsBar';
import type { BulkAction } from '@/app/components/dashboard/primitives/BulkActionsBar';
import { useToast } from '@/app/components/ToastContext';
import ExportButtons from '@/app/components/dashboard/primitives/ExportButtons';
import type { ExportColumn } from '@/app/components/dashboard/lib/export-utils';
import { useDashboardAuth } from '@/app/components/dashboard/context/DashboardAuthProvider';
import { useDashboardRoute } from '@/app/components/dashboard/hooks/useDashboardRoute';
import { dashboardRequestJson, getDashboardErrorMessage } from '@/app/components/dashboard/lib/dashboard-request';
import { Button, Input, Table, Chip, Modal, Card, Skeleton, Pagination, Checkbox, Tooltip } from '@heroui/react';
import type { DashboardArtist, DashboardUser, DashboardContract } from '@/app/components/dashboard/types';

// ---------------------------------------------------------------------------
// Local types
// ---------------------------------------------------------------------------

interface Release {
    id: string;
    name?: string | null;
    image?: string | null;
    releaseDate?: string | null;
    artistName?: string | null;
    artistsJson?: string | null;
    [key: string]: unknown;
}

/** Artist as returned by the admin endpoint – extends the shared type with
 *  the fields that are only present in this view. */
interface AdminArtist extends DashboardArtist {
    email?: string | null;
    lastSyncedAt?: string | null;
    user?: (DashboardUser & { image?: string | null }) | null;
}

interface BalanceStats {
    available?: number;
    totalEarnings?: number;
    totalPaid?: number;
    totalPending?: number;
    manualAdjustments?: number;
}

interface BalanceAdjustment {
    id: string;
    amount?: number | string | null;
    reason?: string | null;
    createdAt?: string | null;
    createdBy?: {
        stageName?: string | null;
        fullName?: string | null;
        email?: string | null;
    } | null;
}

interface SkeletonRow {
    id: string;
    _skeleton: true;
}

type TableItem = AdminArtist | SkeletonRow;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ARTISTS_PAGE_SIZE = 25;
const LONG_PRESS_SELECTION_MS = 420;

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

const normalizeSelectionKeys = (keys: 'all' | Iterable<string>, availableIds: string[] = []): Set<string> => {
    if (keys === 'all') return new Set(availableIds);
    return new Set(Array.from(keys || []));
};

const getVisiblePageNumbers = (page: number, totalPages: number): (number | string)[] => {
    if (totalPages <= 7) {
        return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages: (number | string)[] = [1];
    if (page > 3) pages.push('ellipsis-left');

    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    for (let current = start; current <= end; current += 1) {
        pages.push(current);
    }

    if (page < totalPages - 2) pages.push('ellipsis-right');
    pages.push(totalPages);

    return pages;
};

// ---------------------------------------------------------------------------
// UserLinker sub-component
// ---------------------------------------------------------------------------

interface UserLinkerProps {
    artistId: string;
    users: DashboardUser[];
    artistEmail?: string | null;
    onLinked?: () => Promise<void>;
}

function UserLinker({ artistId, users, artistEmail, onLinked }: UserLinkerProps) {
    const { showToast } = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedUser, setSelectedUser] = useState<DashboardUser | null>(null);
    const [linking, setLinking] = useState(false);

    const suggestedUser = artistEmail ? users.find(u => u.email?.toLowerCase() === artistEmail.toLowerCase()) : null;

    const filteredUsers = users?.filter(u =>
        (u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.stageName?.toLowerCase().includes(searchTerm.toLowerCase()))
    ).slice(0, 5) || [];

    const handleLink = async (userToLink?: DashboardUser) => {
        const user = userToLink || selectedUser;
        if (!user) return;
        setLinking(true);
        try {
            await dashboardRequestJson('/api/admin/artists', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: artistId, userId: user.id }),
                context: 'link artist user',
                retry: false
            });
            await onLinked?.();
            showToast('User linked successfully', "success");
        } catch (e) {
            showToast(getDashboardErrorMessage(e, 'Error linking user'), "error");
        } finally { setLinking(false); }
    };

    return (
        <div className="mt-4 bg-surface p-6 rounded-xl border border-border">
            <div className="text-[10px] font-black text-muted mb-5 tracking-widest">LINK EXISTING USER</div>

            {suggestedUser && !selectedUser && (
                <div className="mb-5 p-4 bg-surface/50 rounded-lg border border-accent/30">
                    <div className="flex justify-between items-center">
                        <div>
                            <div className="text-[10px] text-accent font-black mb-1 tracking-widest">SUGGESTED MATCH</div>
                            <div className="text-xs text-foreground font-black">{suggestedUser.email}</div>
                        </div>
                        <Button size="sm" variant="primary" onPress={() => handleLink(suggestedUser)} isDisabled={linking}>
                            {linking ? 'LINKING...' : 'LINK NOW'}
                        </Button>
                    </div>
                </div>
            )}

            {!selectedUser ? (
                <>
                    <Input
                        aria-label="Search users"
                        placeholder="Search other user email or name..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="mb-3"
                        fullWidth
                    />
                    <div className="flex flex-col gap-1.5">
                        {searchTerm && filteredUsers.map(u => (
                            <div
                                key={u.id}
                                onClick={() => setSelectedUser(u)}
                                className="p-3 bg-surface rounded-lg cursor-pointer text-xs flex justify-between items-center border border-border hover:bg-surface/80 transition-colors"
                            >
                                <span className="font-black">{u.stageName || 'NO STAGE NAME'} <span className="text-muted font-normal">{'// '}{u.email}</span></span>
                                <span className="text-accent text-[10px] font-black tracking-widest">SELECT</span>
                            </div>
                        ))}
                        {searchTerm && filteredUsers.length === 0 && (
                            <div className="text-[10px] text-muted italic p-2 text-center">No users found matching search</div>
                        )}
                    </div>
                </>
            ) : (
                <div className="text-center p-6 bg-surface rounded-lg border border-border">
                    <div className="mb-5 text-xs font-black">
                        LINK USER ACCOUNT:<br /><span className="text-accent text-sm">{selectedUser.email?.toUpperCase()}</span>?
                    </div>
                    <div className="flex gap-3">
                        <Button variant="primary" className="flex-[2]" onPress={() => handleLink()} isDisabled={linking}>
                            {linking ? 'LINKING...' : 'CONFIRM LINK'}
                        </Button>
                        <Button variant="secondary" className="flex-1" onPress={() => setSelectedUser(null)}>CANCEL</Button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Skeleton constant
// ---------------------------------------------------------------------------

const SKELETON_IDS: SkeletonRow[] = Array.from({ length: 7 }, (_, i) => ({ id: `sk-${i}`, _skeleton: true as const }));

// ---------------------------------------------------------------------------
// ArtistsView props
// ---------------------------------------------------------------------------

interface ArtistsViewProps {
    artists: AdminArtist[];
    users: DashboardUser[];
    releases?: Release[];
    contracts?: DashboardContract[];
    onSync: (userId: string | null | undefined, spotifyUrl: string | null | undefined, artistId: string) => Promise<void> | void;
    onRefresh?: () => Promise<void> | void;
    isLoading?: boolean;
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function ArtistsView({ artists, users, releases = [], contracts = [], onSync, onRefresh, isLoading = false }: ArtistsViewProps) {
    const { showToast, showConfirm } = useToast();
    const { currentUser } = useDashboardAuth();
    const { recordId, setRecordId, clearRecordId } = useDashboardRoute();
    const canManage = currentUser?.role === 'admin' || currentUser?.permissions?.canManageArtists;

    const [searchTerm, setSearchTerm, debouncedSearch] = useDebouncedSearch();
    const [currentPage, setCurrentPage] = useState(1);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedArtistIds, setSelectedArtistIds] = useState<Set<string>>(() => new Set());
    const [selectedArtist, setSelectedArtist] = useState<AdminArtist | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newArtist, setNewArtist] = useState({ name: '', spotifyUrl: '', email: '' });
    const [saving, setSaving] = useState(false);
    const [syncingArtistId, setSyncingArtistId] = useState<string | null>(null);
    const [isSyncingAll, setIsSyncingAll] = useState(false);
    const [balanceLoading, setBalanceLoading] = useState(false);
    const [balanceStats, setBalanceStats] = useState<BalanceStats | null>(null);
    const [balanceAdjustments, setBalanceAdjustments] = useState<BalanceAdjustment[]>([]);
    const [adjustAmount, setAdjustAmount] = useState('');
    const [adjustReason, setAdjustReason] = useState('');
    const [adjustSaving, setAdjustSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editFields, setEditFields] = useState({ name: '', email: '', spotifyUrl: '' });
    const [editSaving, setEditSaving] = useState(false);
    const [bulkProcessing, setBulkProcessing] = useState(false);
    const touchSelectionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!recordId) { setSelectedArtist(null); return; }
        const artist = artists.find(a => a.id === recordId);
        if (artist && artist.id !== selectedArtist?.id) setSelectedArtist(artist);
    }, [artists, recordId, selectedArtist?.id]);

    useEffect(() => {
        if (!selectedArtist?.id) return;
        const latest = artists.find((artist) => artist.id === selectedArtist.id);
        if (latest && latest !== selectedArtist) setSelectedArtist(latest);
    }, [artists, selectedArtist]);

    const filteredArtists = useMemo(() => {
        return artists.filter(artist =>
            artist.name?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            artist.email?.toLowerCase().includes(debouncedSearch.toLowerCase())
        );
    }, [artists, debouncedSearch]);

    const artistsExportColumns: ExportColumn[] = [
        { key: 'name', label: 'Name', format: (v) => v || 'Unknown' },
        { key: 'email', label: 'Email', format: (v) => v || '' },
        { key: 'status', label: 'Status', format: (v) => (v || 'active').toUpperCase() },
        { key: 'spotifyUrl', label: 'Spotify URL', format: (v) => v || '' },
        { key: 'lastSyncedAt', label: 'Last Synced', format: (v) => v ? new Date(v).toLocaleDateString() : 'Never' },
    ];

    const totalArtistCount = filteredArtists.length;
    const totalPages = Math.max(1, Math.ceil(totalArtistCount / ARTISTS_PAGE_SIZE));
    const pageStart = totalArtistCount === 0 ? 0 : ((currentPage - 1) * ARTISTS_PAGE_SIZE) + 1;
    const pageEnd = Math.min(currentPage * ARTISTS_PAGE_SIZE, totalArtistCount);
    const paginatedArtists = useMemo(() => (
        filteredArtists.slice((currentPage - 1) * ARTISTS_PAGE_SIZE, currentPage * ARTISTS_PAGE_SIZE)
    ), [currentPage, filteredArtists]);

    useEffect(() => {
        setCurrentPage(1);
    }, [debouncedSearch]);

    useEffect(() => {
        if (currentPage > totalPages) {
            setCurrentPage(totalPages);
        }
    }, [currentPage, totalPages]);

    useEffect(() => {
        setSelectedArtistIds((prev) => {
            const availableIds = new Set(filteredArtists.map((artist) => artist.id));
            const next = new Set(Array.from(prev).filter((id) => availableIds.has(id)));
            return next.size === prev.size ? prev : next;
        });
    }, [filteredArtists]);

    useEffect(() => {
        if (selectionMode && selectedArtistIds.size === 0) {
            setSelectionMode(false);
        }
    }, [selectedArtistIds, selectionMode]);

    const fetchArtistBalance = useCallback(async (artistId: string) => {
        if (!artistId) return;
        setBalanceLoading(true);
        try {
            const data = await dashboardRequestJson(`/api/admin/artist-balance?artistId=${artistId}`, { context: 'artist balance' }) as { stats?: BalanceStats; adjustments?: BalanceAdjustment[] };
            setBalanceStats(data.stats || null);
            setBalanceAdjustments(data.adjustments || []);
        } catch (e) {
            setBalanceStats(null);
            setBalanceAdjustments([]);
            showToast(getDashboardErrorMessage(e, 'Failed to fetch artist balance'), 'error');
        } finally { setBalanceLoading(false); }
    }, [showToast]);

    const handleApplyAdjustment = async () => {
        const amount = Number(adjustAmount);
        if (!Number.isFinite(amount) || amount === 0) { showToast('Enter a non-zero amount', 'warning'); return; }
        if (!selectedArtist?.id) return;
        setAdjustSaving(true);
        try {
            await dashboardRequestJson('/api/admin/artist-balance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ artistId: selectedArtist.id, amount, reason: adjustReason }),
                context: 'apply balance adjustment',
                retry: false
            });
            setAdjustAmount('');
            setAdjustReason('');
            showToast('Balance adjustment applied', 'success');
            await fetchArtistBalance(selectedArtist.id);
        } catch (e) {
            showToast(getDashboardErrorMessage(e, 'Failed to apply balance adjustment'), 'error');
        } finally { setAdjustSaving(false); }
    };

    useEffect(() => {
        if (!selectedArtist?.id) { setBalanceStats(null); setBalanceAdjustments([]); setAdjustAmount(''); setAdjustReason(''); return; }
        setAdjustAmount('');
        setAdjustReason('');
        fetchArtistBalance(selectedArtist.id);
    }, [fetchArtistBalance, selectedArtist?.id]);

    const startEdit = (artist: AdminArtist) => {
        setEditingId(artist.id);
        setEditFields({ name: artist.name || '', email: artist.email || '', spotifyUrl: artist.spotifyUrl || '' });
    };
    const cancelEdit = () => setEditingId(null);
    const saveEdit = async (artistId: string) => {
        setEditSaving(true);
        try {
            await dashboardRequestJson('/api/admin/artists', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: artistId, ...editFields }),
                context: 'update artist',
                retry: false,
            });
            showToast('Artist updated', 'success');
            setEditingId(null);
            await onRefresh?.();
        } catch (e) {
            showToast(getDashboardErrorMessage(e, 'Update failed'), 'error');
        } finally { setEditSaving(false); }
    };

    const enterSelectionMode = useCallback((artistId?: string) => {
        setSelectionMode(true);
        if (!artistId) return;
        setSelectedArtistIds((prev) => {
            const next = new Set(prev);
            next.add(artistId);
            return next;
        });
    }, []);

    const exitSelectionMode = useCallback(() => {
        setSelectionMode(false);
        setSelectedArtistIds(new Set());
    }, []);

    const toggleArtistSelection = useCallback((artistId: string) => {
        setSelectedArtistIds((prev) => {
            const next = new Set(prev);
            if (next.has(artistId)) next.delete(artistId);
            else next.add(artistId);
            return next;
        });
    }, []);

    const clearTouchSelectionTimer = useCallback(() => {
        if (touchSelectionTimerRef.current) {
            clearTimeout(touchSelectionTimerRef.current);
            touchSelectionTimerRef.current = null;
        }
    }, []);

    const selectCurrentPage = useCallback(() => {
        setSelectionMode(true);
        setSelectedArtistIds(new Set(paginatedArtists.map((artist) => artist.id)));
    }, [paginatedArtists]);

    const selectAllFiltered = useCallback(() => {
        setSelectionMode(true);
        setSelectedArtistIds(new Set(filteredArtists.map((artist) => artist.id)));
    }, [filteredArtists]);

    const handleSelectionChange = useCallback((keys: any) => {
        setSelectedArtistIds(normalizeSelectionKeys(keys, filteredArtists.map((artist) => artist.id)));
    }, [filteredArtists]);

    // -----------------------------------------------------------------------
    // Bulk actions
    // -----------------------------------------------------------------------

    const handleBulkApprove = useCallback(async () => {
        if (selectedArtistIds.size === 0) return;
        setBulkProcessing(true);
        try {
            const result = await dashboardRequestJson<{ success: string[]; failed: Array<{ id: string; error: string }> }>(
                '/api/admin/bulk',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'approve-artists', ids: Array.from(selectedArtistIds) }),
                    context: 'bulk approve artists',
                    retry: false,
                },
            );
            const successCount = result.success?.length ?? 0;
            const failCount = result.failed?.length ?? 0;
            if (failCount === 0) {
                showToast(`${successCount} artist${successCount === 1 ? '' : 's'} approved`, 'success');
            } else {
                showToast(`Approved ${successCount}, failed ${failCount}`, 'warning');
            }
            exitSelectionMode();
            await onRefresh?.();
        } catch (e) {
            showToast(getDashboardErrorMessage(e, 'Bulk approve failed'), 'error');
        } finally {
            setBulkProcessing(false);
        }
    }, [selectedArtistIds, showToast, exitSelectionMode, onRefresh]);

    const handleBulkSync = useCallback(async () => {
        if (selectedArtistIds.size === 0) return;
        setBulkProcessing(true);
        try {
            const selectedList = artists.filter((a) => selectedArtistIds.has(a.id));
            const results = await Promise.allSettled(
                selectedList.map((a) => onSync(a.userId, a.spotifyUrl, a.id)),
            );
            const successCount = results.filter((r) => r.status === 'fulfilled').length;
            const failCount = results.filter((r) => r.status === 'rejected').length;
            if (failCount === 0) {
                showToast(`${successCount} artist${successCount === 1 ? '' : 's'} synced`, 'success');
            } else {
                showToast(`Synced ${successCount}, failed ${failCount}`, 'warning');
            }
            exitSelectionMode();
            await onRefresh?.();
        } catch (e) {
            showToast(getDashboardErrorMessage(e, 'Bulk sync failed'), 'error');
        } finally {
            setBulkProcessing(false);
        }
    }, [selectedArtistIds, artists, onSync, showToast, exitSelectionMode, onRefresh]);

    const handleBulkEmail = useCallback(() => {
        if (selectedArtistIds.size === 0) return;
        const selectedList = artists.filter((a) => selectedArtistIds.has(a.id));
        const emails = selectedList
            .map((a) => a.email || a.user?.email)
            .filter(Boolean) as string[];
        if (emails.length === 0) {
            showToast('No email addresses found for selected artists', 'warning');
            return;
        }
        window.open(`mailto:${emails.join(',')}`, '_blank');
        showToast(`Opened email compose for ${emails.length} recipient${emails.length === 1 ? '' : 's'}`, 'success');
    }, [selectedArtistIds, artists, showToast]);

    const bulkActions: BulkAction[] = useMemo(() => [
        { label: 'APPROVE', icon: <CheckCircle size={14} />, onClick: handleBulkApprove, variant: 'primary' as const, isDisabled: bulkProcessing },
        { label: 'SYNC', icon: <RefreshCw size={14} />, onClick: handleBulkSync, variant: 'secondary' as const, isDisabled: bulkProcessing },
        { label: 'EMAIL', icon: <Mail size={14} />, onClick: handleBulkEmail, variant: 'secondary' as const, isDisabled: bulkProcessing },
    ], [handleBulkApprove, handleBulkSync, handleBulkEmail, bulkProcessing]);

    const handleCreate = async () => {
        if (!newArtist.name) return showToast('Name Required', "warning");
        setSaving(true);
        try {
            await dashboardRequestJson('/api/admin/artists', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newArtist),
                context: 'create artist',
                retry: false
            });
            setIsCreating(false);
            setNewArtist({ name: '', spotifyUrl: '', email: '' });
            showToast("Artist profile created", "success");
            await onRefresh?.();
        } catch (e) {
            showToast(getDashboardErrorMessage(e, "Creation failed"), "error");
        } finally { setSaving(false); }
    };

    if (selectedArtist) {
        const hasLinkedUser = Boolean(selectedArtist.user);
        const hasSpotifyProfile = Boolean(selectedArtist.spotifyUrl);
        const completedProfileFields = [
            Boolean(selectedArtist.name),
            Boolean(selectedArtist.email),
            hasSpotifyProfile,
            hasLinkedUser
        ].filter(Boolean).length;
        const profileCompleteness = Math.round((completedProfileFields / 4) * 100);
        const lastSyncText = selectedArtist.lastSyncedAt
            ? new Date(selectedArtist.lastSyncedAt).toLocaleString()
            : 'Never synced';

        return (
            <div className="flex flex-col gap-8">
                <Button variant="secondary" className="self-start" onPress={() => clearRecordId({ replace: true })}>
                    ← BACK TO LIST
                </Button>

                <div className="flex gap-8 items-center">
                    <div className="w-28 h-28 rounded-2xl bg-surface flex items-center justify-center border border-border overflow-hidden shrink-0">
                        {selectedArtist.image
                            ? <NextImage src={selectedArtist.image} alt={selectedArtist.name ?? ''} width={120} height={120} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            : <span className="text-4xl opacity-50">👤</span>
                        }
                    </div>
                    <div className="flex-1">
                        <h2 className="m-0 text-4xl font-black tracking-tight">{selectedArtist.name}</h2>
                        <div className="text-sm text-muted mt-2.5 font-black">{selectedArtist.email || 'NO EMAIL LINKED'}</div>
                        {selectedArtist.spotifyUrl && (
                            <a href={selectedArtist.spotifyUrl} target="_blank" rel="noreferrer"
                                className="mt-3 text-xs font-black tracking-widest inline-flex items-center gap-1.5 bg-surface px-3 py-1.5 rounded-lg border border-border hover:bg-surface/80 transition-colors">
                                OPEN SPOTIFY PROFILE ↗
                            </a>
                        )}
                    </div>
                    <Card className="text-right">
                        <Card.Content className="p-6 flex flex-col items-end gap-4">
                            <div>
                                <div className="text-xs text-muted font-black mb-2 tracking-widest">MONTHLY LISTENERS</div>
                                <div className="text-3xl font-black">
                                    {(selectedArtist.monthlyListeners !== undefined && selectedArtist.monthlyListeners !== null)
                                        ? selectedArtist.monthlyListeners.toLocaleString()
                                        : <span className="text-sm flex items-center gap-2 text-danger font-black"><AlertCircle size={16} /> SYNC REQUIRED</span>
                                    }
                                </div>
                            </div>
                            <Button
                                variant="primary"
                                isDisabled={syncingArtistId === selectedArtist.id}
                                onPress={async () => {
                                    if (syncingArtistId) return;
                                    setSyncingArtistId(selectedArtist.id);
                                    await onSync(selectedArtist.userId, selectedArtist.spotifyUrl, selectedArtist.id);
                                    setSyncingArtistId(null);
                                }}
                            >
                                <RefreshCw size={14} />
                                {syncingArtistId === selectedArtist.id ? 'REFRESHING...' : 'SYNC PLATFORM DATA'}
                            </Button>
                        </Card.Content>
                    </Card>
                </div>

                <div className="grid gap-6" style={{ gridTemplateColumns: 'minmax(0,1.15fr) minmax(0,0.85fr)' }}>
                    <div className="grid gap-6">
                        <Card>
                            <Card.Header><Card.Title>LINKED SYSTEM ACCOUNT</Card.Title></Card.Header>
                            <Card.Content>
                                {selectedArtist.user ? (
                                    <div>
                                        <div className="text-lg font-black mb-1.5">{selectedArtist.user.stageName || selectedArtist.user.fullName || 'NO NAME'}</div>
                                        <div className="text-sm text-muted font-black">{selectedArtist.user.email}</div>
                                        <div className="mt-5 text-[10px] font-black bg-surface inline-block px-3 py-1.5 rounded-lg border border-border">✓ ACCOUNT VERIFIED</div>
                                        <div className="mt-6">
                                            <Button
                                                variant="ghost" className="text-danger hover:bg-danger/10"
                                                fullWidth
                                                onPress={() => {
                                                    showConfirm(
                                                        "UNLINK ACCOUNT?",
                                                        "Are you sure you want to unlink this user from the artist profile? They will lose access to their stats and dashboard.",
                                                        async () => {
                                                            try {
                                                                await dashboardRequestJson('/api/admin/artists', {
                                                                    method: 'PUT',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({ id: selectedArtist.id, userId: null }),
                                                                    context: 'unlink artist user',
                                                                    retry: false
                                                                });
                                                                showToast("Account unlinked successfully", "success");
                                                                await onRefresh?.();
                                                            } catch (e) { showToast(getDashboardErrorMessage(e, 'Error unlinking account'), "error"); }
                                                        }
                                                    );
                                                }}
                                            >
                                                UNLINK ACCOUNT
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <UserLinker artistId={selectedArtist.id} users={users} artistEmail={selectedArtist.email} onLinked={async () => { await onRefresh?.(); }} />
                                )}
                            </Card.Content>
                        </Card>

                        <Card>
                            <Card.Header><Card.Title>RELEASES</Card.Title></Card.Header>
                            <Card.Content>
                                {releases.length === 0 ? (
                                    <div className="text-center py-10 text-muted text-[10px] font-black tracking-widest">LOADING RELEASES...</div>
                                ) : (() => {
                                    const artistReleases = releases.filter(r => {
                                        const nameMatch = r.artistName?.toLowerCase().includes(selectedArtist.name?.toLowerCase() ?? '');
                                        const titleMatch = r.name?.toLowerCase().includes(selectedArtist.name?.toLowerCase() ?? '');
                                        let jsonMatch = false;
                                        if (r.artistsJson) {
                                            try {
                                                const parsedArtists = JSON.parse(r.artistsJson) as Array<{ id?: string; name?: string }>;
                                                jsonMatch = parsedArtists.some(a =>
                                                    a.id === selectedArtist.id ||
                                                    a.name?.toLowerCase() === selectedArtist.name?.toLowerCase() ||
                                                    (selectedArtist.userId && a.id === selectedArtist.userId)
                                                );
                                            } catch (e) { }
                                        }
                                        return nameMatch || jsonMatch || titleMatch;
                                    });

                                    return artistReleases.length > 0 ? (
                                        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))' }}>
                                            {artistReleases.slice(0, 12).map(release => (
                                                <div key={release.id} className="text-center">
                                                    <div className="w-full aspect-square bg-surface rounded overflow-hidden border border-border mb-2">
                                                        {release.image
                                                            ? <NextImage src={release.image} alt={release.name ?? ''} width={100} height={100} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            : <div className="w-full h-full flex items-center justify-center text-xl">💿</div>
                                                        }
                                                    </div>
                                                    <div className="text-xs font-black truncate">{release.name}</div>
                                                    <div className="text-[9px] text-muted font-black">{release.releaseDate}</div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-10 text-muted text-[10px] font-black tracking-widest">NO RELEASES FOUND IN SYSTEM</div>
                                    );
                                })()}
                            </Card.Content>
                        </Card>
                    </div>

                    <div className="grid gap-4">
                        <Card>
                            <Card.Header><Card.Title>PLATFORM HEALTH</Card.Title></Card.Header>
                            <Card.Content className="flex flex-col gap-2.5">
                                <div className="flex justify-between items-center text-xs">
                                    <span className="text-muted font-black">Profile Completeness</span>
                                    <span className="font-black">{profileCompleteness}%</span>
                                </div>
                                <div className="h-1.5 rounded-full bg-border overflow-hidden">
                                    <div className="h-full bg-accent" style={{ width: `${profileCompleteness}%` }} />
                                </div>
                                <div className="flex justify-between text-xs mt-1">
                                    <span className="text-muted font-black">Linked Account</span>
                                    <span className={`font-black ${hasLinkedUser ? '' : 'text-danger'}`}>{hasLinkedUser ? 'Connected' : 'Missing'}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted font-black">Spotify Profile</span>
                                    <span className={`font-black ${hasSpotifyProfile ? '' : 'text-danger'}`}>{hasSpotifyProfile ? 'Connected' : 'Missing'}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-muted font-black">Last Sync</span>
                                    <span className="font-black text-right ml-4">{lastSyncText}</span>
                                </div>
                            </Card.Content>
                        </Card>

                        <Card>
                            <Card.Header><Card.Title>CONTRACTS</Card.Title></Card.Header>
                            <Card.Content>
                                {contracts.length === 0 ? (
                                    <div className="text-center py-5 text-muted text-[10px] font-black">LOADING CONTRACTS...</div>
                                ) : (() => {
                                    const artistContracts = contracts.filter(c =>
                                        c.artistId === selectedArtist.id ||
                                        (selectedArtist.userId && c.userId === selectedArtist.userId) ||
                                        (selectedArtist.email && c.primaryArtistEmail?.toLowerCase() === selectedArtist.email?.toLowerCase()) ||
                                        (c.splits?.some(s =>
                                            s.artistId === selectedArtist.id ||
                                            (selectedArtist.userId && s.userId === selectedArtist.userId) ||
                                            (selectedArtist.email && String(s.email || '').toLowerCase() === selectedArtist.email?.toLowerCase())
                                        ))
                                    );
                                    if (artistContracts.length === 0) {
                                        return <div className="text-center py-5 text-muted text-[10px] font-black">NO CONTRACTS FOUND</div>;
                                    }
                                    return (
                                        <div className="flex flex-col gap-2.5">
                                            {artistContracts.map(contract => (
                                                <div key={contract.id} className="p-3 bg-surface rounded-lg border border-border">
                                                    <div className="text-xs font-black mb-0.5">{contract.title || contract.release?.name || 'Untitled Contract'}</div>
                                                    <div className="text-[10px] text-muted font-black">REF: {String((contract.contractDetails as Record<string, unknown>)?.agreementReferenceNo || 'N/A')}</div>
                                                    <div className="flex justify-between mt-2 items-center">
                                                        <Chip size="sm" variant="soft" color="success">
                                                            <Chip.Label>{contract.status?.toUpperCase()}</Chip.Label>
                                                        </Chip>
                                                        <span className="text-[10px] text-accent font-black">{Math.round(Number(contract.artistShare) * 100)}% SHARE</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    );
                                })()}
                            </Card.Content>
                        </Card>

                        <Card>
                            <Card.Header><Card.Title>BALANCE MANAGEMENT</Card.Title></Card.Header>
                            <Card.Content>
                                {balanceLoading ? (
                                    <div className="text-center py-5 text-muted text-[10px] font-black tracking-widest">LOADING BALANCE...</div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-2 gap-2.5 mb-4">
                                            {[
                                                { label: 'AVAILABLE', value: balanceStats?.available || 0 },
                                                { label: 'TOTAL EARNINGS', value: balanceStats?.totalEarnings || 0 },
                                                { label: 'PAID', value: balanceStats?.totalPaid || 0 },
                                                { label: 'PENDING', value: balanceStats?.totalPending || 0 },
                                            ].map(item => (
                                                <div key={item.label} className="bg-surface border border-border rounded-lg p-2.5">
                                                    <div className="text-[9px] text-muted font-black tracking-widest">{item.label}</div>
                                                    <div className="text-base font-black mt-1">${Number(item.value).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                                </div>
                                            ))}
                                            <div className="col-span-2 bg-surface border border-border rounded-lg p-2.5">
                                                <div className="text-[9px] text-muted font-black tracking-widest">MANUAL ADJUSTMENTS</div>
                                                <div className="text-sm font-black mt-1">${Number(balanceStats?.manualAdjustments || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-2 mb-3">
                                            <Input
                                                aria-label="Adjustment amount"
                                                type="number"
                                                step="0.01"
                                                value={adjustAmount}
                                                onChange={(e) => setAdjustAmount(e.target.value)}
                                                placeholder="Adjustment amount (e.g. +100 or -50)"
                                                fullWidth
                                            />
                                            <Input
                                                aria-label="Adjustment reason"
                                                value={adjustReason}
                                                onChange={(e) => setAdjustReason(e.target.value)}
                                                placeholder="Reason (optional)"
                                                fullWidth
                                            />
                                            <Button variant="primary" fullWidth onPress={handleApplyAdjustment} isDisabled={adjustSaving}>
                                                {adjustSaving ? 'APPLYING...' : 'APPLY BALANCE ADJUSTMENT'}
                                            </Button>
                                        </div>

                                        <div className="max-h-44 overflow-y-auto border-t border-border/10 pt-2.5">
                                            {balanceAdjustments.length === 0 ? (
                                                <div className="text-[10px] text-muted font-black">No manual adjustments yet.</div>
                                            ) : balanceAdjustments.map((item) => (
                                                <div key={item.id} className="py-2 border-b border-border/10">
                                                    <div className="flex justify-between items-center">
                                                        <span className={`text-xs font-black ${Number(item.amount) >= 0 ? 'text-success' : 'text-danger'}`}>
                                                            {Number(item.amount) >= 0 ? '+' : ''}${Number(item.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                                        </span>
                                                        <span className="text-[9px] text-muted font-black">{new Date(item.createdAt!).toLocaleDateString()}</span>
                                                    </div>
                                                    {item.reason && <div className="text-[10px] text-muted mt-1">{item.reason}</div>}
                                                    <div className="text-[9px] text-muted mt-0.5">by {item.createdBy?.stageName || item.createdBy?.fullName || item.createdBy?.email || 'admin'}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </Card.Content>
                        </Card>

                        <Card>
                            <Card.Header><Card.Title>QUICK ACTIONS</Card.Title></Card.Header>
                            <Card.Content className="flex flex-col gap-2.5">
                                <Button variant="secondary" fullWidth onPress={async () => {
                                    try { await navigator.clipboard.writeText(selectedArtist.id); showToast('Artist ID copied to clipboard', 'success'); }
                                    catch (e) { showToast('Unable to copy artist ID', 'error'); }
                                }}>COPY ARTIST ID</Button>
                                <Button variant="secondary" fullWidth onPress={() => window.open(`/artists`, '_blank')}>OPEN PUBLIC ROSTER</Button>
                                <Button variant="secondary" fullWidth onPress={() => {
                                    showConfirm('REFRESH ARTIST NOW?', `This will re-sync ${selectedArtist.name} from Spotify.`, async () => {
                                        if (syncingArtistId) return;
                                        setSyncingArtistId(selectedArtist.id);
                                        await onSync(selectedArtist.userId, selectedArtist.spotifyUrl, selectedArtist.id);
                                        setSyncingArtistId(null);
                                    });
                                }}>FORCE RESYNC</Button>
                            </Card.Content>
                        </Card>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <Modal isOpen={isCreating} onOpenChange={(open: boolean) => { if (!open) setIsCreating(false); }}>
                <Modal.Backdrop />
                <Modal.Container>
                    <Modal.Dialog className="w-full max-w-md">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="w-8 h-0.5 bg-accent" />
                            <h3 className="text-sm font-black tracking-widest m-0">NEW ARTIST PROFILE</h3>
                        </div>
                        <div className="flex flex-col gap-6">
                            <div>
                                <label className="text-[10px] text-muted font-black tracking-widest block mb-2.5">ARTIST NAME *</label>
                                <Input
                                    aria-label="Artist name"
                                    placeholder="e.g. Lost Boy"
                                    value={newArtist.name}
                                    onChange={(e) => setNewArtist({ ...newArtist, name: e.target.value })}
                                    fullWidth
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-muted font-black tracking-widest block mb-2.5">EMAIL ADDRESS</label>
                                <Input
                                    aria-label="Email address"
                                    placeholder="contact@artist.com"
                                    value={newArtist.email}
                                    onChange={(e) => setNewArtist({ ...newArtist, email: e.target.value })}
                                    fullWidth
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-muted font-black tracking-widest block mb-2.5">SPOTIFY URL</label>
                                <Input
                                    aria-label="Spotify URL"
                                    placeholder="https://open.spotify.com/artist/..."
                                    value={newArtist.spotifyUrl}
                                    onChange={(e) => setNewArtist({ ...newArtist, spotifyUrl: e.target.value })}
                                    fullWidth
                                />
                            </div>
                        </div>
                        <div className="flex gap-4 mt-8">
                            <Button variant="primary" className="flex-[2]" onPress={handleCreate} isDisabled={saving}>
                                {saving ? 'INITIALIZING...' : 'CREATE PLATFORM PROFILE'}
                            </Button>
                            <Button variant="secondary" className="flex-1" onPress={() => setIsCreating(false)}>CANCEL</Button>
                        </div>
                    </Modal.Dialog>
                </Modal.Container>
            </Modal>

            <div className="flex flex-col gap-2">
                <div className="flex flex-col sm:flex-row justify-between gap-3">
                    <Input
                        aria-label="Search artists"
                        placeholder="Search artists..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full sm:max-w-xs"
                    />
                    {canManage && (
                        <div className="flex flex-wrap gap-2 sm:gap-3 shrink-0">
                            <Button
                                variant="secondary"
                                isDisabled={isSyncingAll}
                                onPress={async () => {
                                    if (isSyncingAll) return;
                                    if (!confirm("Start bulk background sync? This will refresh all artists with Spotify URLs.")) return;
                                    setIsSyncingAll(true);
                                    try {
                                        const res = await fetch('/api/admin/scrape/batch', { method: 'POST' });
                                        const data = await res.json() as { queued?: boolean; jobId?: string; success?: boolean; successCount?: number; failCount?: number };
                                        if (data.queued) {
                                            showToast(`Batch sync queued. Job: ${data.jobId?.slice(0, 8) || 'pending'}`, "success");
                                        } else if (data.success) {
                                            showToast(`Batch Sync Completed. Success: ${data.successCount}, Failed: ${data.failCount}`, "success");
                                        } else {
                                            showToast("Batch sync failed", "error");
                                        }
                                        if (onRefresh) onRefresh();
                                    } catch (e) { showToast("Sync error", "error"); }
                                    finally { setIsSyncingAll(false); }
                                }}
                            >
                                <RefreshCw size={14} />
                                {isSyncingAll ? 'SYNCING...' : 'SYNC ALL'}
                            </Button>
                            <Button variant="primary" onPress={() => setIsCreating(true)}>
                                <Plus size={14} /> NEW ARTIST
                            </Button>
                            <ExportButtons
                                data={filteredArtists}
                                columns={artistsExportColumns}
                                filename="artists-export"
                                title="Artists Report"
                            />
                        </div>
                    )}
                </div>
                <p className="m-0 text-[10px] font-black tracking-widest uppercase text-muted">
                    Right click or press-hold a row to start bulk selection.
                </p>
            </div>

            {selectionMode && (
                <Card variant="secondary" className="border border-border/60 bg-surface/40 shadow-none">
                    <Card.Content className="flex flex-wrap items-center justify-between gap-2 px-3 py-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <Chip color="accent" size="sm" variant="soft" className="shrink-0">
                                <Chip.Label>{selectedArtistIds.size} selected</Chip.Label>
                            </Chip>
                            <span className="text-[9px] font-black tracking-[0.18em] uppercase text-muted whitespace-nowrap">
                                Selection mode
                            </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                            <Button size="sm" variant="secondary" className="min-w-0 px-2.5" onPress={selectCurrentPage}>PAGE</Button>
                            <Button size="sm" variant="secondary" className="min-w-0 px-2.5" onPress={selectAllFiltered}>ALL</Button>
                            <Button size="sm" variant="secondary" className="min-w-0 px-2.5" onPress={() => setSelectedArtistIds(new Set())}>CLEAR</Button>
                            <Button size="sm" variant="primary" className="min-w-0 px-2.5" onPress={exitSelectionMode}>DONE</Button>
                        </div>
                    </Card.Content>
                </Card>
            )}

            <Table aria-label="Artists Table">
                <Table.ScrollContainer>
                    <Table.Content
                        className="min-w-[760px]"
                        selectedKeys={selectedArtistIds}
                        selectionMode={selectionMode ? 'multiple' : 'none'}
                        onSelectionChange={handleSelectionChange}
                    >
                        <Table.Header>
                            <Table.Column
                                className={`w-12 pr-0 ${selectionMode ? '' : 'hidden'}`}
                                id="select"
                            >
                                {selectionMode ? (
                                    <Checkbox aria-label="Select all artists on current result set" slot="selection" variant="secondary">
                                        <Checkbox.Control>
                                            <Checkbox.Indicator />
                                        </Checkbox.Control>
                                    </Checkbox>
                                ) : ' '}
                            </Table.Column>
                            <Table.Column isRowHeader id="artist">ARTIST</Table.Column>
                            <Table.Column id="monthly">MONTHLY LISTENERS</Table.Column>
                            <Table.Column id="linkeduser">LINKED USER</Table.Column>
                            <Table.Column className="text-end" id="actions">ACTIONS</Table.Column>
                        </Table.Header>
                        <Table.Body
                            items={isLoading ? SKELETON_IDS : paginatedArtists}
                            renderEmptyState={() => (
                                !isLoading && (
                                    <div className="py-16 flex flex-col items-center gap-3">
                                        <p className="text-muted text-xs font-bold tracking-widest uppercase">NO ARTISTS FOUND</p>
                                    </div>
                                )
                            )}
                        >
                            {(item: TableItem) => (item as SkeletonRow)._skeleton ? (
                                <Table.Row key={item.id} id={item.id}>
                                    <Table.Cell className={selectionMode ? '' : 'hidden'}>
                                        {selectionMode && (
                                            <Skeleton className="w-4 h-4 rounded-md" />
                                        )}
                                    </Table.Cell>
                                    <Table.Cell>
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                                            <div className="flex flex-col gap-1.5">
                                                <Skeleton className="h-3 w-28 rounded-md" />
                                                <Skeleton className="h-2.5 w-20 rounded-md" />
                                            </div>
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell><Skeleton className="h-3 w-16 rounded-md" /></Table.Cell>
                                    <Table.Cell>
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="w-6 h-6 rounded-full shrink-0" />
                                            <Skeleton className="h-3 w-28 rounded-md" />
                                        </div>
                                    </Table.Cell>
                                    <Table.Cell>
                                        <div className="flex items-center justify-end gap-1">
                                            <Skeleton className="h-7 w-14 rounded-lg" />
                                            <Skeleton className="h-7 w-14 rounded-lg" />
                                            <Skeleton className="h-7 w-18 rounded-lg" />
                                        </div>
                                    </Table.Cell>
                                </Table.Row>
                            ) : (() => {
                                const artist = item as AdminArtist;
                                return (
                                    <Table.Row
                                        key={artist.id}
                                        id={artist.id}
                                        className={`${editingId === artist.id ? '' : 'cursor-pointer'} ${selectionMode && selectedArtistIds.has(artist.id) ? 'bg-default/10' : ''}`}
                                        onContextMenu={(event: React.MouseEvent) => {
                                            event.preventDefault();
                                            event.stopPropagation();
                                            enterSelectionMode(artist.id);
                                        }}
                                        onTouchStart={() => {
                                            clearTouchSelectionTimer();
                                            touchSelectionTimerRef.current = setTimeout(() => {
                                                enterSelectionMode(artist.id);
                                                touchSelectionTimerRef.current = null;
                                            }, LONG_PRESS_SELECTION_MS);
                                        }}
                                        onTouchEnd={clearTouchSelectionTimer}
                                        onTouchMove={clearTouchSelectionTimer}
                                        onTouchCancel={clearTouchSelectionTimer}
                                        onPress={() => {
                                            if (selectionMode) return;
                                            if (editingId === artist.id) return;
                                            setSelectedArtist(artist);
                                            setRecordId(artist.id);
                                        }}
                                    >
                                        <Table.Cell className={`pr-0 ${selectionMode ? '' : 'hidden'}`}>
                                            {selectionMode && (
                                                <Checkbox
                                                    aria-label={`Select ${artist.name}`}
                                                    slot="selection"
                                                    variant="secondary"
                                                >
                                                    <Checkbox.Control>
                                                        <Checkbox.Indicator />
                                                    </Checkbox.Control>
                                                </Checkbox>
                                            )}
                                        </Table.Cell>
                                        <Table.Cell>
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl overflow-hidden border border-border bg-surface shrink-0 flex items-center justify-center">
                                                    {artist.image ? (
                                                        <NextImage unoptimized src={artist.image} alt={artist.name ?? ''} width={36} height={36} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                    ) : (
                                                        <span className="text-sm font-black text-muted">{artist.name?.[0]?.toUpperCase() || '?'}</span>
                                                    )}
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    {editingId === artist.id ? (
                                                        <input
                                                            value={editFields.name}
                                                            onChange={e => setEditFields(f => ({ ...f, name: e.target.value }))}
                                                            onClick={e => e.stopPropagation()}
                                                            className="text-sm font-black bg-surface border border-border/60 rounded-lg px-2 py-1 text-foreground outline-none focus:border-foreground/40 w-36"
                                                            autoFocus
                                                        />
                                                    ) : (
                                                        <span className="text-sm font-black">{artist.name}</span>
                                                    )}
                                                    {artist.spotifyUrl ? (
                                                        editingId === artist.id ? (
                                                            <input
                                                                value={editFields.spotifyUrl}
                                                                onChange={e => setEditFields(f => ({ ...f, spotifyUrl: e.target.value }))}
                                                                onClick={e => e.stopPropagation()}
                                                                placeholder="Spotify URL"
                                                                className="text-[10px] font-black bg-surface border border-border/60 rounded-lg px-2 py-0.5 text-muted outline-none focus:border-foreground/40 w-36"
                                                            />
                                                        ) : (
                                                            <span className="text-[9px] text-muted font-black tracking-widest flex items-center gap-1">
                                                                <span className="inline-block w-2 h-2 rounded-full bg-[#1DB954]" />
                                                                SPOTIFY
                                                            </span>
                                                        )
                                                    ) : (
                                                        editingId === artist.id && (
                                                            <input
                                                                value={editFields.spotifyUrl}
                                                                onChange={e => setEditFields(f => ({ ...f, spotifyUrl: e.target.value }))}
                                                                onClick={e => e.stopPropagation()}
                                                                placeholder="Spotify URL"
                                                                className="text-[10px] font-black bg-surface border border-border/60 rounded-lg px-2 py-0.5 text-muted outline-none focus:border-foreground/40 w-36"
                                                            />
                                                        )
                                                    )}
                                                </div>
                                            </div>
                                        </Table.Cell>
                                        <Table.Cell>
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-xs font-black text-foreground">
                                                    {(artist.monthlyListeners !== null && artist.monthlyListeners !== undefined) ? artist.monthlyListeners.toLocaleString() : '---'}
                                                </span>
                                                <span className="text-[9px] text-muted font-black tracking-widest">
                                                    {artist.lastSyncedAt ? new Date(artist.lastSyncedAt).toLocaleDateString() : 'NEVER SYNCED'}
                                                </span>
                                            </div>
                                        </Table.Cell>
                                        <Table.Cell>
                                            {artist.user ? (
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-7 h-7 rounded-full overflow-hidden border border-border bg-surface shrink-0 flex items-center justify-center">
                                                        {artist.user.image ? (
                                                            <NextImage unoptimized src={artist.user.image} alt={artist.user.email ?? ''} width={28} height={28} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : (
                                                            <span className="text-[10px] font-black text-muted">{artist.user.email?.[0]?.toUpperCase()}</span>
                                                        )}
                                                    </div>
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="text-xs font-black">{artist.user.stageName || artist.user.name || artist.user.email}</span>
                                                        <span className="text-[9px] text-muted font-black tracking-widest">{artist.user.email}</span>
                                                    </div>
                                                </div>
                                            ) : (
                                                editingId === artist.id ? (
                                                    <input
                                                        value={editFields.email}
                                                        onChange={e => setEditFields(f => ({ ...f, email: e.target.value }))}
                                                        onClick={e => e.stopPropagation()}
                                                        placeholder="artist@email.com"
                                                        className="text-xs font-black bg-surface border border-border/60 rounded-lg px-2 py-1 text-foreground outline-none focus:border-foreground/40 w-44"
                                                    />
                                                ) : (
                                                    <span className="text-[10px] text-muted font-black tracking-widest">UNLINKED</span>
                                                )
                                            )}
                                        </Table.Cell>
                                        <Table.Cell>
                                            <div className="flex items-center justify-end gap-1" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                                                {selectionMode ? (
                                                    <Chip size="sm" variant="soft" color={selectedArtistIds.has(artist.id) ? 'accent' : 'default'}>
                                                        <Chip.Label>{selectedArtistIds.has(artist.id) ? 'SELECTED' : 'SELECT'}</Chip.Label>
                                                    </Chip>
                                                ) : editingId === artist.id ? (
                                                    <>
                                                        <Button size="sm" variant="primary" isDisabled={editSaving} onPress={() => saveEdit(artist.id)}>
                                                            {editSaving ? '...' : 'SAVE'}
                                                        </Button>
                                                        <Button size="sm" variant="secondary" isDisabled={editSaving} onPress={cancelEdit}>
                                                            CANCEL
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Button size="sm" variant="ghost" isIconOnly aria-label="Sync" onPress={() => { onSync(artist.userId, artist.spotifyUrl, artist.id); }}>
                                                            <RefreshCw size={12} />
                                                        </Button>
                                                        <Button size="sm" variant="ghost" isIconOnly aria-label="Edit" onPress={() => { startEdit(artist); }}>
                                                            <Edit2 size={12} />
                                                        </Button>
                                                        <Button size="sm" variant="ghost" isIconOnly aria-label="Manage" onPress={() => { setSelectedArtist(artist); setRecordId(artist.id); }}>
                                                            <Settings2 size={12} />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </Table.Cell>
                                    </Table.Row>
                                );
                            })()}
                        </Table.Body>
                    </Table.Content>
                </Table.ScrollContainer>
                {!isLoading && totalArtistCount > 0 && (
                    <Table.Footer>
                        <Pagination className="w-full" size="sm">
                            <Pagination.Summary>
                                Showing {pageStart}-{pageEnd} of {totalArtistCount} artists
                            </Pagination.Summary>
                            <Pagination.Content>
                                <Pagination.Item>
                                    <Pagination.Previous
                                        isDisabled={currentPage === 1}
                                        onPress={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                    >
                                        <Pagination.PreviousIcon />
                                        Prev
                                    </Pagination.Previous>
                                </Pagination.Item>
                                {getVisiblePageNumbers(currentPage, totalPages).map((page) => (
                                    page === 'ellipsis-left' || page === 'ellipsis-right' ? (
                                        <Pagination.Item key={page as string}>
                                            <Pagination.Ellipsis />
                                        </Pagination.Item>
                                    ) : (
                                        <Pagination.Item key={page as number}>
                                            <Pagination.Link
                                                isActive={page === currentPage}
                                                onPress={() => setCurrentPage(page as number)}
                                            >
                                                {page}
                                            </Pagination.Link>
                                        </Pagination.Item>
                                    )
                                ))}
                                <Pagination.Item>
                                    <Pagination.Next
                                        isDisabled={currentPage === totalPages}
                                        onPress={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                                    >
                                        Next
                                        <Pagination.NextIcon />
                                    </Pagination.Next>
                                </Pagination.Item>
                            </Pagination.Content>
                        </Pagination>
                    </Table.Footer>
                )}
            </Table>

            <BulkActionsBar
                selectedCount={selectedArtistIds.size}
                actions={bulkActions}
                onClear={exitSelectionMode}
            />
        </div>
    );
}
